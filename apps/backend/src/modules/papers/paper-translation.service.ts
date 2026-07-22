import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { AppError } from "../../common/exceptions/app-error.js";
import { PaperModel } from "./models/paper.model.js";
import { PaperTranslationModel } from "./models/paper-translation.model.js";
import { LIBRETRANSLATE_PROVIDER_VERSION, translateText } from "./libretranslate.client.js";

export interface PaperTranslationResult {
  paperId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedTitle: string;
  translatedAbstract: string;
  provider: "original" | "libretranslate";
  cacheHit: boolean;
  translatedAt: string;
}

function hashSource(title: string, abstractText: string): string {
  return createHash("sha256").update(`${title}\u0000${abstractText}`).digest("hex");
}

export const paperTranslationService = {
  async translate(paperId: string, targetLanguage: string): Promise<PaperTranslationResult> {
    if (!mongoose.Types.ObjectId.isValid(paperId)) throw AppError.notFound("Paper not found");

    const paper = await PaperModel.findById(paperId).select("title abstractText language").lean();
    if (!paper) throw AppError.notFound("Paper not found");

    const rawSourceLanguage = (paper.language || "und").toLowerCase();
    const sourceLanguage = /^[a-z]{2,3}$/.test(rawSourceLanguage) ? rawSourceLanguage : "und";
    const abstractText = paper.abstractText || "";
    if (sourceLanguage === targetLanguage) {
      return {
        paperId,
        sourceLanguage,
        targetLanguage,
        translatedTitle: paper.title,
        translatedAbstract: abstractText,
        provider: "original",
        cacheHit: true,
        translatedAt: new Date().toISOString(),
      };
    }

    if (env.TRANSLATION_PROVIDER !== "libretranslate") {
      throw AppError.serviceUnavailable("Paper translation is not enabled on this deployment.");
    }

    const sourceTextHash = hashSource(paper.title, abstractText);
    const cached = await PaperTranslationModel.findOne({
      paper: paper._id,
      targetLanguage,
      sourceTextHash,
      provider: "libretranslate",
    }).lean();
    if (cached) {
      return {
        paperId,
        sourceLanguage,
        targetLanguage,
        translatedTitle: cached.translatedTitle,
        translatedAbstract: cached.translatedAbstract,
        provider: "libretranslate",
        cacheHit: true,
        translatedAt: (cached.updatedAt as Date).toISOString(),
      };
    }

    const [translatedTitle, translatedAbstract] = await Promise.all([
      translateText(paper.title, sourceLanguage, targetLanguage),
      translateText(abstractText, sourceLanguage, targetLanguage),
    ]);

    const saved = await PaperTranslationModel.findOneAndUpdate(
      { paper: paper._id, targetLanguage, sourceTextHash, provider: "libretranslate" },
      {
        $setOnInsert: {
          paper: paper._id,
          sourceLanguage,
          targetLanguage,
          sourceTextHash,
          translatedTitle,
          translatedAbstract,
          provider: "libretranslate",
          providerVersion: LIBRETRANSLATE_PROVIDER_VERSION,
        },
      },
      { upsert: true, new: true },
    ).lean();

    return {
      paperId,
      sourceLanguage,
      targetLanguage,
      translatedTitle: saved!.translatedTitle,
      translatedAbstract: saved!.translatedAbstract,
      provider: "libretranslate",
      cacheHit: false,
      translatedAt: (saved!.updatedAt as Date).toISOString(),
    };
  },
};
