import mongoose from "mongoose";
import { AppError } from "../../common/exceptions/app-error.js";
import { env } from "../../config/env.js";
import { hashKey } from "../../infrastructure/cache.js";
import { logger } from "../../infrastructure/logger.js";
import { getEmbeddingProvider } from "../embeddings/embedding.factory.js";
import { getLlmProvider } from "../llm/llm.factory.js";
import { cachedGenerate } from "../llm/llm.run.js";
import { PaperModel } from "../papers/models/paper.model.js";
import { ProjectModel } from "./models/project.model.js";
import { ProjectChatMessageModel } from "./models/project-chat-message.model.js";
import {
  buildChatPrompt,
  parseCitations,
  pickEvidence,
  type ChatEvidencePaper,
  type ChatHistoryTurn,
} from "./project-chat.prompt.js";
import {
  fitToBudget,
  normalizeQuestion,
  PROJECT_CHAT_PROMPT_VERSION,
} from "./project-chat.tokens.js";

export interface SendProjectChatMessageResult {
  answer: string;
  citedPaperIds: string[];
}

export interface ProjectChatHistoryMessage {
  id: string;
  projectId: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  citedPaperIds: string[];
  createdAt: string;
}

export class ProjectChatService {
  async sendMessage(
    projectId: string,
    userId: string,
    message: string,
  ): Promise<SendProjectChatMessageResult> {
    const papers = await this.loadProjectEvidence(projectId, userId);
    const selectedEvidence = await this.selectEvidence(message, papers);
    const selectedHistory = await this.loadRecentHistory(projectId, userId);
    const fitted = fitToBudget({
      papers: selectedEvidence,
      history: selectedHistory,
      maxChars: env.CHAT_MAX_PROMPT_CHARS,
      abstractMaxChars: env.CHAT_ABSTRACT_MAX_CHARS,
      render: (evidence, history) =>
        [
          buildChatPrompt({
            question: message,
            evidence,
            history,
            abstractMaxChars: env.CHAT_ABSTRACT_MAX_CHARS,
          }).system,
          buildChatPrompt({
            question: message,
            evidence,
            history,
            abstractMaxChars: env.CHAT_ABSTRACT_MAX_CHARS,
          }).prompt,
        ].join("\n").slice(0),
    });
    const evidence = [...fitted.papers].sort((a, b) => a.id.localeCompare(b.id));
    const history = fitted.history;
    const { system, prompt } = buildChatPrompt({
      question: message,
      evidence,
      history,
      abstractMaxChars: env.CHAT_ABSTRACT_MAX_CHARS,
    });
    const provider = getLlmProvider();
    const model = provider.name === "ollama" ? env.OLLAMA_MODEL : env.GEMINI_MODEL_FAST;
    let result: SendProjectChatMessageResult;
    try {
      result = await cachedGenerate<SendProjectChatMessageResult>({
        task: "chat",
        promptVersion: PROJECT_CHAT_PROMPT_VERSION,
        keyParts: {
          projectId,
          question: normalizeQuestion(message),
          paperIds: evidence.map((paper) => paper.id).sort(),
          provider: provider.name,
        },
        inputHash: hashKey({ system, prompt }),
        model,
        ttlSeconds: env.CHAT_CACHE_TTL_SECONDS,
        generate: async () => {
          const answer = (
            await provider.generate(prompt, {
              system,
              temperature: 0.25,
              maxOutputTokens: 1024,
            })
          )
            .trim()
            .slice(0, 4000);
          return { answer, citedPaperIds: parseCitations(answer, evidence) };
        },
      });
    } catch (err) {
      logger.warn({ err, projectId, userId, provider: provider.name }, "project chat LLM failed");
      throw AppError.serviceUnavailable("LLM provider unreachable");
    }
    await this.saveTurn(projectId, userId, message, result.answer, result.citedPaperIds);
    return result;
  }

  private async saveTurn(
    projectId: string,
    userId: string,
    message: string,
    answer: string,
    citedPaperIds: string[],
  ): Promise<void> {
    await ProjectChatMessageModel.insertMany([
      {
        projectId: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(userId),
        role: "user",
        content: message,
        citedPaperIds: [],
      },
      {
        projectId: new mongoose.Types.ObjectId(projectId),
        userId: new mongoose.Types.ObjectId(userId),
        role: "assistant",
        content: answer,
        citedPaperIds: citedPaperIds.map((id) => new mongoose.Types.ObjectId(id)),
      },
    ]);
  }

  async listHistory(projectId: string, userId: string, limit: number): Promise<ProjectChatHistoryMessage[]> {
    await this.assertCanAccess(projectId, userId);
    const docs = await ProjectChatMessageModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return docs.reverse().map((doc) => ({
      id: String(doc._id),
      projectId: String(doc.projectId),
      userId: String(doc.userId),
      role: doc.role as "user" | "assistant",
      content: doc.content,
      citedPaperIds: (doc.citedPaperIds ?? []).map((id) => String(id)),
      createdAt: doc.createdAt.toISOString(),
    }));
  }

  private async selectEvidence(question: string, papers: ChatEvidencePaper[]): Promise<ChatEvidencePaper[]> {
    if (papers.length <= env.CHAT_CONTEXT_PAPERS) return pickEvidence(papers, env.CHAT_CONTEXT_PAPERS);
    const questionVector = await getEmbeddingProvider().embed(normalizeQuestion(question));
    return pickEvidence(papers, env.CHAT_CONTEXT_PAPERS, questionVector);
  }

  private async loadRecentHistory(projectId: string, userId: string): Promise<ChatHistoryTurn[]> {
    const limit = env.CHAT_HISTORY_TURNS * 2;
    if (limit === 0) return [];
    const docs = await ProjectChatMessageModel.find({
      projectId: new mongoose.Types.ObjectId(projectId),
      userId: new mongoose.Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return docs.reverse().map((doc) => ({
      role: doc.role as "user" | "assistant",
      content: doc.content,
    }));
  }

  private async loadProjectEvidence(projectId: string, userId: string): Promise<ChatEvidencePaper[]> {
    const project = await this.assertCanAccess(projectId, userId);
    const paperIds = (project.papers ?? []).map((paper) => String(paper.targetId));
    if (paperIds.length === 0) return [];

    const docs = await PaperModel.find({ _id: { $in: paperIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select("title abstractText publicationYear authors +embedding")
      .lean();

    const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
    return paperIds
      .map((id) => byId.get(id))
      .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
      .map((doc) => ({
        id: String(doc._id),
        title: doc.title,
        abstractText: doc.abstractText || undefined,
        publicationYear: doc.publicationYear,
        authorNames: (doc.authors ?? []).map((a) => a.displayName).filter(Boolean),
        embedding: Array.isArray(doc.embedding) ? doc.embedding : undefined,
      }));
  }

  private async assertCanAccess(projectId: string, userId: string) {
    const project = await ProjectModel.findById(projectId).select("ownerId members papers").lean();
    if (!project) throw AppError.notFound("Project not found");

    const hasAccess =
      String(project.ownerId) === userId ||
      (project.members ?? []).some((member) => String(member.targetId) === userId);
    if (!hasAccess) throw AppError.forbidden("Access denied to this project");

    return project;
  }
}

export const projectChatService = new ProjectChatService();
