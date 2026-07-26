import "server-only";

import { getSupabaseServerClient } from "@/lib/play-point-core/quick-score-supabase";
import {
  buildRuntimeDeck,
  buildRuntimeDeckFromCategory,
  summarizeRuntimeCatalogCategory,
  type RuntimeDeckBuildOptions,
  type RuntimeSourceCatalogCategory,
  type RuntimeSourceCatalogRecord,
} from "./trivia-runtime-builder";
import {
  RUNTIME_DIFFICULTIES,
  type RuntimeCatalogCategorySummary,
  type RuntimeCatalogDifficultyCounts,
  type RuntimeCatalogTopicSummary,
  type RuntimeChoiceSlot,
  type RuntimeDeck,
  type RuntimeDifficulty,
  type RuntimeDifficultyFilter,
} from "./trivia-runtime-types";

const PUBLISHED_CATALOG_SELECT = [
  "source_id",
  "category_slug",
  "topic_slug",
  "difficulty",
  "question",
  "choice_a",
  "choice_b",
  "choice_c",
  "choice_d",
  "correct_choice",
  "explanation",
  "reference",
  "tags",
  "updated_at",
].join(",");

type PublishedCatalogRow = {
  source_id: string;
  category_slug: string;
  topic_slug: string;
  difficulty: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: RuntimeChoiceSlot;
  explanation: string;
  reference: string;
  tags: string[] | null;
  updated_at: string;
};

export type PublishedRuntimeCatalog = {
  generatedAt: string;
  categories: RuntimeSourceCatalogCategory[];
};

function emptyDifficultyCounts(): RuntimeCatalogDifficultyCounts {
  return { easy: 0, medium: 0, hard: 0, expert: 0 };
}

function formatSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isRuntimeDifficulty(value: string): value is RuntimeDifficulty {
  return RUNTIME_DIFFICULTIES.some((difficulty) => difficulty === value);
}

function rowToRecord(row: PublishedCatalogRow): RuntimeSourceCatalogRecord {
  if (!isRuntimeDifficulty(row.difficulty)) {
    throw new Error(`Published trivia question "${row.source_id}" has an unsupported difficulty.`);
  }

  const choices: Record<RuntimeChoiceSlot, string> = {
    A: row.choice_a,
    B: row.choice_b,
    C: row.choice_c,
    D: row.choice_d,
  };
  const answer = choices[row.correct_choice];

  if (!answer) {
    throw new Error(`Published trivia question "${row.source_id}" has an invalid correct choice.`);
  }

  return {
    id: row.source_id,
    category: row.category_slug,
    topic: row.topic_slug,
    difficulty: row.difficulty,
    question: row.question,
    answer,
    choices: [row.choice_a, row.choice_b, row.choice_c, row.choice_d],
    explanation: row.explanation,
    reference: row.reference,
    tags: row.tags ?? [],
  };
}

export function mapPublishedCatalogRows(
  rows: PublishedCatalogRow[],
): PublishedRuntimeCatalog {
  const recordsByCategory = new Map<string, RuntimeSourceCatalogRecord[]>();
  let generatedAt = new Date(0).toISOString();

  rows.forEach((row) => {
    const record = rowToRecord(row);
    const records = recordsByCategory.get(record.category) ?? [];
    records.push(record);
    recordsByCategory.set(record.category, records);

    if (row.updated_at > generatedAt) {
      generatedAt = row.updated_at;
    }
  });

  const categories = [...recordsByCategory.entries()]
    .map(([category, records]): RuntimeSourceCatalogCategory => {
      const countsByDifficulty = emptyDifficultyCounts();
      const topicRecords = new Map<string, RuntimeSourceCatalogRecord[]>();

      records.forEach((record) => {
        countsByDifficulty[record.difficulty] += 1;

        if (record.topic) {
          const values = topicRecords.get(record.topic) ?? [];
          values.push(record);
          topicRecords.set(record.topic, values);
        }
      });

      const topics: RuntimeCatalogTopicSummary[] = [...topicRecords.entries()]
        .map(([topic, values]) => {
          const topicCounts = emptyDifficultyCounts();
          values.forEach((record) => {
            topicCounts[record.difficulty] += 1;
          });

          return {
            topic,
            label: formatSlug(topic),
            totalGoldTriviaCount: values.length,
            countsByDifficulty: topicCounts,
            isPlayable: values.length > 0,
          };
        })
        .sort((left, right) => left.label.localeCompare(right.label));

      return {
        category,
        label: formatSlug(category),
        totalGoldTriviaCount: records.length,
        countsByDifficulty,
        topics,
        records,
      };
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  return { generatedAt, categories };
}

export async function loadPublishedRuntimeCatalog(): Promise<PublishedRuntimeCatalog> {
  const { data, error } = await getSupabaseServerClient()
    .from("ppl_trivia_published_catalog")
    .select(PUBLISHED_CATALOG_SELECT);

  if (error) {
    throw new Error(`Unable to load the published trivia catalog: ${error.message}`);
  }

  return mapPublishedCatalogRows((data ?? []) as unknown as PublishedCatalogRow[]);
}

export async function listServerRuntimeCatalogCategories(): Promise<{
  generatedAt: string;
  categories: RuntimeCatalogCategorySummary[];
}> {
  const publishedCatalog = await loadPublishedRuntimeCatalog();

  return {
    generatedAt: publishedCatalog.generatedAt,
    categories: publishedCatalog.categories.map(summarizeRuntimeCatalogCategory),
  };
}

export async function buildServerRuntimeDeck(
  category: string,
  difficultyFilter: RuntimeDifficultyFilter,
  options: RuntimeDeckBuildOptions = {},
): Promise<RuntimeDeck> {
  if (category === "bible") {
    return buildRuntimeDeck(category, difficultyFilter, options);
  }

  const publishedCatalog = await loadPublishedRuntimeCatalog();
  const publishedCategory = publishedCatalog.categories.find(
    (candidate) => candidate.category === category,
  );

  if (!publishedCategory) {
    throw new Error(`No published trivia category named "${category}" is available.`);
  }

  const knownTopics = new Set((publishedCategory.topics ?? []).map((topic) => topic.topic));
  const unknownTopic = (options.topicIds ?? []).find((topic) => !knownTopics.has(topic));

  if (unknownTopic) {
    throw new Error(`Unknown topic "${unknownTopic}" for ${publishedCategory.label}.`);
  }

  return buildRuntimeDeckFromCategory(publishedCategory, difficultyFilter, options);
}
