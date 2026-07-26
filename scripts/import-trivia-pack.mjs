import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const payloadPath = process.argv[2];

if (!payloadPath) {
  throw new Error("Usage: npm run trivia:import-pack -- <absolute-or-relative-payload.json>");
}

const url =
  process.env.PLAY_POINT_LIVE_SUPABASE_URL
  ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey =
  process.env.PLAY_POINT_LIVE_SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error("The trivia importer requires the server-only Supabase URL and service-role key.");
}

const payload = JSON.parse(fs.readFileSync(path.resolve(payloadPath), "utf8"));
const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function requireString(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value;
}

function assertPayload(value) {
  if (!value || typeof value !== "object") {
    throw new Error("Trivia import payload must be an object.");
  }
  requireString(value.category?.slug, "category.slug");
  requireString(value.category?.name, "category.name");
  requireString(value.pack?.slug, "pack.slug");

  if (!Array.isArray(value.topics) || value.topics.length !== 5) {
    throw new Error("A published category import must contain exactly five topics.");
  }
  if (!Array.isArray(value.questions) || value.questions.length !== 100) {
    throw new Error("A published category import must contain exactly 100 questions.");
  }
  if (value.pack.status !== "published" || value.questions.some((question) => question.status !== "published")) {
    throw new Error("Only fully reviewed published payloads may use this production importer.");
  }
}

async function one(query, label) {
  const { data, error } = await query;

  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
  if (!data || data.length !== 1) {
    throw new Error(`${label}: expected exactly one row.`);
  }
  return data[0];
}

async function upsertInChunks(table, rows, options, label) {
  for (let index = 0; index < rows.length; index += 50) {
    const chunk = rows.slice(index, index + 50);
    const { error } = await supabase.from(table).upsert(chunk, options);

    if (error) {
      throw new Error(`${label} rows ${index + 1}-${index + chunk.length}: ${error.message}`);
    }
  }
}

assertPayload(payload);

const category = await one(
  supabase
    .from("ppl_trivia_categories")
    .upsert({
      slug: payload.category.slug,
      name: payload.category.name,
      updated_at: payload.pack.updated_at,
    }, { onConflict: "slug" })
    .select("id,slug"),
  "Unable to upsert category",
);

const topicIds = new Map();

for (const topic of payload.topics) {
  if (topic.category_slug !== category.slug) {
    throw new Error(`Topic ${topic.slug} has a mismatched category.`);
  }

  const savedTopic = await one(
    supabase
      .from("ppl_trivia_topics")
      .upsert({
        category_id: category.id,
        slug: topic.slug,
        name: topic.name,
        updated_at: payload.pack.updated_at,
      }, { onConflict: "category_id,slug" })
      .select("id,slug"),
    `Unable to upsert topic ${topic.slug}`,
  );
  topicIds.set(savedTopic.slug, savedTopic.id);
}

const { data: existingPack, error: existingPackError } = await supabase
  .from("ppl_trivia_packs")
  .select("id,status,updated_at")
  .eq("slug", payload.pack.slug)
  .maybeSingle();

if (existingPackError) {
  throw new Error(`Unable to inspect pack state: ${existingPackError.message}`);
}

if (existingPack?.status === "published") {
  const { data: existingQuestions, error } = await supabase
    .from("ppl_trivia_questions")
    .select([
      "id",
      "source_id",
      "topic_id",
      "difficulty",
      "question",
      "choice_a",
      "choice_b",
      "choice_c",
      "choice_d",
      "correct_choice",
      "explanation",
      "reference",
      "source_url",
      "tags",
      "status",
    ].join(","))
    .eq("pack_id", existingPack.id)
    .limit(1000);

  if (error) {
    throw new Error(`Unable to verify the existing release: ${error.message}`);
  }
  if (existingQuestions?.length !== payload.questions.length) {
    throw new Error(
      `Published pack ${payload.pack.slug} is immutable but contains ${existingQuestions?.length ?? 0} questions.`,
    );
  }

  const existingBySourceId = new Map(
    existingQuestions.map((question) => [question.source_id, question]),
  );
  const immutableFields = [
    "difficulty",
    "question",
    "choice_a",
    "choice_b",
    "choice_c",
    "choice_d",
    "correct_choice",
    "explanation",
  ];
  const metadataUpdates = [];

  for (const question of payload.questions) {
    const existing = existingBySourceId.get(question.source_id);
    const expectedTopicId = topicIds.get(question.topic_id);

    if (!existing || !expectedTopicId) {
      throw new Error(
        `Published pack ${payload.pack.slug} does not match source question ${question.source_id}.`,
      );
    }
    if (existing.status !== "published" || existing.topic_id !== expectedTopicId) {
      throw new Error(
        `Published question ${question.source_id} changed status or topic; create a new pack version.`,
      );
    }

    for (const field of immutableFields) {
      if (existing[field] !== question[field]) {
        throw new Error(
          `Published question ${question.source_id} changed ${field}; create a new pack version.`,
        );
      }
    }

    const tags = question.tags.split("|").filter(Boolean);
    const tagsChanged = JSON.stringify(existing.tags ?? []) !== JSON.stringify(tags);

    if (
      existing.reference !== question.reference
      || existing.source_url !== question.source_url
      || tagsChanged
    ) {
      metadataUpdates.push({
        id: existing.id,
        reference: question.reference,
        source_url: question.source_url,
        tags,
      });
    }
  }

  for (const update of metadataUpdates) {
    const { error: updateError } = await supabase
      .from("ppl_trivia_questions")
      .update({
        reference: update.reference,
        source_url: update.source_url,
        tags: update.tags,
        updated_at: payload.pack.updated_at,
      })
      .eq("id", update.id);

    if (updateError) {
      throw new Error(`Unable to refresh published citation metadata: ${updateError.message}`);
    }
  }

  const { error: packUpdateError } = await supabase
    .from("ppl_trivia_packs")
    .update({ updated_at: payload.pack.updated_at })
    .eq("id", existingPack.id);

  if (packUpdateError) {
    throw new Error(`Unable to refresh published pack metadata: ${packUpdateError.message}`);
  }

  console.log(
    `${payload.pack.slug} is already published; refreshed ${metadataUpdates.length} citation metadata row(s).`,
  );
  process.exit(0);
}

const stagedPack = await one(
  supabase
    .from("ppl_trivia_packs")
    .upsert({
      slug: payload.pack.slug,
      category_id: category.id,
      version: payload.pack.version,
      title: payload.pack.title,
      description: payload.pack.description,
      status: "reviewed",
      reviewed_at: payload.pack.reviewed_at,
      published_at: null,
      created_at: payload.pack.created_at,
      updated_at: payload.pack.updated_at,
    }, { onConflict: "slug" })
    .select("id,slug"),
  "Unable to stage pack",
);

const questionRows = payload.questions.map((question) => {
  const topicId = topicIds.get(question.topic_id);

  if (!topicId) {
    throw new Error(`Question ${question.source_id} references unknown topic ${question.topic_id}.`);
  }

  return {
    source_id: question.source_id,
    category_id: category.id,
    pack_id: stagedPack.id,
    topic_id: topicId,
    difficulty: question.difficulty,
    question: question.question,
    choice_a: question.choice_a,
    choice_b: question.choice_b,
    choice_c: question.choice_c,
    choice_d: question.choice_d,
    correct_choice: question.correct_choice,
    explanation: question.explanation,
    reference: question.reference,
    source_url: question.source_url,
    tags: question.tags.split("|").filter(Boolean),
    status: "reviewed",
    reviewed_at: question.reviewed_at,
    created_at: question.created_at,
    updated_at: question.updated_at,
  };
});

await upsertInChunks(
  "ppl_trivia_questions",
  questionRows,
  { onConflict: "source_id" },
  "Unable to stage questions",
);

const { error: publishQuestionsError } = await supabase
  .from("ppl_trivia_questions")
  .update({
    status: "published",
    updated_at: payload.pack.published_at,
  })
  .eq("pack_id", stagedPack.id);

if (publishQuestionsError) {
  throw new Error(`Unable to publish questions: ${publishQuestionsError.message}`);
}

const { error: publishPackError } = await supabase
  .from("ppl_trivia_packs")
  .update({
    status: "published",
    published_at: payload.pack.published_at,
    updated_at: payload.pack.published_at,
  })
  .eq("id", stagedPack.id);

if (publishPackError) {
  throw new Error(`Unable to publish pack: ${publishPackError.message}`);
}

const { count, error: countError } = await supabase
  .from("ppl_trivia_published_catalog")
  .select("id", { count: "exact", head: true })
  .eq("pack_slug", payload.pack.slug);

if (countError) {
  throw new Error(`Unable to verify published catalog: ${countError.message}`);
}
if (count !== payload.questions.length) {
  throw new Error(`Published catalog returned ${count} of ${payload.questions.length} questions.`);
}

console.log(`Published ${payload.pack.slug} with ${count} verified runtime questions.`);
