import { Clipboard, showHUD } from "@raycast/api";
import { count } from "./lib/count";

export default async function Command() {
  const text = (await Clipboard.readText())?.trim() ?? "";
  if (!text) {
    await showHUD("Nothing to count in the clipboard");
    return;
  }

  const result = count(text, true);
  const number = (value: number) => value.toLocaleString();
  const plural = (n: number, singular: string, pluralValue: string) => (n === 1 ? singular : pluralValue);
  const stats = [
    `${number(result.characters)} ${plural(result.characters, "char", "chars")}`,
    `${number(result.words)} ${plural(result.words, "word", "words")}`,
    `${number(result.sentences)} ${plural(result.sentences, "sentence", "sentences")}`,
    `${number(result.paragraphs)} ${plural(result.paragraphs, "paragraph", "paragraphs")}`,
  ];
  await showHUD(stats.join(" · "));
}
