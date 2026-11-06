import { Locale, Direction } from "../types/common";
import { arDictionary, Dictionary } from "./dictionaries/ar";
import { enDictionary } from "./dictionaries/en";

export const dictionaries: Record<Locale, Dictionary> = {
  ar: arDictionary,
  en: enDictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? arDictionary;
}

export function getDirection(locale: Locale): Direction {
  return locale === "ar" ? "rtl" : "ltr";
}
