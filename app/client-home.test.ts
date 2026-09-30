import { expect, it } from "vitest";
import { getCategoryArt } from "./client-home";

it("uses consistent category artwork, including accented and monthly labels", () => {
  for (const [category, icon] of [
    ["Curiosità", "bulb"], ["Grammatica", "book-2"],
    ["Cultura", "building-bank"], ["Attualita`", "news"],
    [" ATTUALITÀ ", "news"], ["Modo di dire", "messages"],
    ["Ricetta del mese", "tools-kitchen-2"], ["Film del mese", "movie"],
    ["Barzelletta", "mood-smile"], ["Prossima vacanza a...", "map-pin"],
    ["", "bulb"], ["Unknown", "bulb"],
  ]) expect(getCategoryArt(category).icon).toBe(icon);
  expect(getCategoryArt("Ricetta del mese")).toEqual(getCategoryArt("Ricetta"));
  expect(getCategoryArt()).toEqual(getCategoryArt("Curiosità"));
});
