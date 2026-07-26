import { NextResponse } from "next/server";
import { getRuntimeCatalogGeneratedAt, listRuntimeCatalogCategories } from "../../../games/trivia/play/trivia-runtime-builder";
import { listServerRuntimeCatalogCategories } from "../../../games/trivia/play/trivia-published-catalog";
import type { RuntimeCatalogCategorySummary } from "../../../games/trivia/play/trivia-runtime-types";

function latestTimestamp(left: string, right: string): string {
  return Date.parse(right) > Date.parse(left) ? right : left;
}

export async function GET() {
  const staticCategories = listRuntimeCatalogCategories().filter(
    (category) => category.category === "bible",
  );
  let generatedAt = getRuntimeCatalogGeneratedAt();
  let publishedCategories: RuntimeCatalogCategorySummary[] = [];

  try {
    const publishedCatalog = await listServerRuntimeCatalogCategories();
    publishedCategories = publishedCatalog.categories;
    generatedAt = latestTimestamp(generatedAt, publishedCatalog.generatedAt);
  } catch (error) {
    console.error("Unable to add published Supabase trivia categories.", error);
  }

  const categoriesById = new Map(
    [...staticCategories, ...publishedCategories].map((category) => [
      category.category,
      category,
    ]),
  );
  const categories = [...categoriesById.values()].sort((left, right) => {
    if (left.category === "bible") {
      return -1;
    }
    if (right.category === "bible") {
      return 1;
    }
    return left.label.localeCompare(right.label);
  });

  return NextResponse.json({
    generatedAt,
    categories,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
