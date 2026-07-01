export interface IProjectMember {
  targetKind: "User" | "Expert";
  targetId: string;
  role: "owner" | "member";
}

export interface IProjectPaper {
  targetKind: "Paper";
  targetId: string;
}

export interface IProject {
  _id: string;
  title: string;
  description?: string;
  ownerId: string;
  members: IProjectMember[];
  papers: IProjectPaper[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  title: string;
  description?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
}

export interface AddProjectMemberRequest {
  targetKind: "User" | "Expert";
  targetId: string;
  role: "owner" | "member";
}

export interface AddProjectPaperRequest {
  paperId: string;
}

export type ProjectChatRole = "user" | "assistant";

export interface ProjectChatMessage {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectChatRole;
  content: string;
  citedPaperIds: string[];
  createdAt: string;
}

export interface SendProjectChatMessageRequest {
  message: string;
}

export interface SendProjectChatMessageResponse {
  answer: string;
  citedPaperIds: string[];
}

export interface ProjectChatHistoryResponse {
  messages: ProjectChatMessage[];
}
