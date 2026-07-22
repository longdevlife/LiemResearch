import type { Request, Response } from "express";
import type { TranslatePaperInput } from "./dto/translate-paper.schema.js";
import { paperTranslationService } from "./paper-translation.service.js";
import { env } from "../../config/env.js";

export const paperTranslationController = {
  capabilities(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        enabled: env.TRANSLATION_PROVIDER === "libretranslate",
        provider: env.TRANSLATION_PROVIDER,
        targetLanguages: ["en", "vi"],
      },
    });
  },

  async translate(
    req: Request<{ id: string }, unknown, TranslatePaperInput>,
    res: Response,
  ) {
    const data = await paperTranslationService.translate(req.params.id, req.body.targetLanguage);
    res.json({ success: true, data });
  },
};
