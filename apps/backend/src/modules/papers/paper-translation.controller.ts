import type { Request, Response } from "express";
import type { TranslatePaperInput } from "./dto/translate-paper.schema.js";
import { paperTranslationService } from "./paper-translation.service.js";

export const paperTranslationController = {
  async translate(
    req: Request<{ id: string }, unknown, TranslatePaperInput>,
    res: Response,
  ) {
    const data = await paperTranslationService.translate(req.params.id, req.body.targetLanguage);
    res.json({ success: true, data });
  },
};
