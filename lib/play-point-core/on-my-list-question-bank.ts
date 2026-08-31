import { ON_MY_LIST_QUESTIONS as BASE_QUESTIONS } from "@/lib/play-point-core/on-my-list-questions";
import { ON_MY_LIST_EXTRA_QUESTIONS } from "@/lib/play-point-core/on-my-list-questions-extra";
import { ON_MY_LIST_RESTORED_QUESTIONS } from "@/lib/play-point-core/on-my-list-questions-restored";

export type OnMyListQuestion = { id: string; prompt: string };

export const ON_MY_LIST_QUESTIONS: readonly OnMyListQuestion[] = [
  ...BASE_QUESTIONS.map(({ id, prompt }) => ({ id, prompt })),
  ...ON_MY_LIST_EXTRA_QUESTIONS,
  ...ON_MY_LIST_RESTORED_QUESTIONS,
];

function normalizePrompt(prompt: string) {
  return prompt
    .toLowerCase()
    .replaceAll("{name}", "")
    .replace(/^name\s+\d+\s+/i, "list ")
    .replace(/\b\d+\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function assertUniqueQuestions(questions: readonly OnMyListQuestion[]) {
  const ids = new Set<string>();
  const prompts = new Set<string>();
  for (const question of questions) {
    if (ids.has(question.id)) throw new Error(`Duplicate On My List question id: ${question.id}`);
    ids.add(question.id);
    const normalized = normalizePrompt(question.prompt);
    if (prompts.has(normalized)) throw new Error(`Duplicate On My List question prompt: ${question.prompt}`);
    prompts.add(normalized);
  }
}

assertUniqueQuestions(ON_MY_LIST_QUESTIONS);

// Kept as an alias for server compatibility while On My List is Classic-only.
export const ON_MY_LIST_ALL_QUESTIONS: readonly OnMyListQuestion[] = ON_MY_LIST_QUESTIONS;

export function getOnMyListQuestionPack() {
  return ON_MY_LIST_QUESTIONS;
}

export function formatOnMyListPrompt(prompt: string, name: string) {
  const flexiblePrompt = prompt.replace(/^Name\s+\d+\s+/i, "List ");
  return flexiblePrompt.replaceAll("{name}", name);
}
