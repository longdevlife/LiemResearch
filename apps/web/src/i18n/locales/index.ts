import { de } from "./de";
import { en } from "./en";
import { es } from "./es";
import { fr } from "./fr";
import { id } from "./id";
import { ja } from "./ja";
import { ko } from "./ko";
import { pt } from "./pt";
import { ru } from "./ru";
import { vi } from "./vi";
import { zh } from "./zh";

export const dictionaries = {
  en,
  vi,
  es,
  fr,
  de,
  pt,
  zh,
  ja,
  ko,
  ru,
  id,
} as const;

export type TranslationKey = keyof typeof en;
