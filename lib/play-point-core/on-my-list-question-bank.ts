import { ON_MY_LIST_QUESTIONS as BASE_QUESTIONS } from "@/lib/play-point-core/on-my-list-questions";
import { ON_MY_LIST_EXTRA_QUESTIONS } from "@/lib/play-point-core/on-my-list-questions-extra";

export type OnMyListQuestion = { id: string; prompt: string };

export const ON_MY_LIST_QUESTIONS: readonly OnMyListQuestion[] = [
  ...BASE_QUESTIONS.map(({ id, prompt }) => ({ id, prompt })),
  ...ON_MY_LIST_EXTRA_QUESTIONS,
];

export function formatOnMyListPrompt(prompt: string, name: string) {
  const flexiblePrompt = prompt.replace(/^Name\s+\d+\s+/i, "List ");
  return flexiblePrompt.replaceAll("{name}", name);
}
