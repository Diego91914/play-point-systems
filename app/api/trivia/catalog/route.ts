import { NextResponse } from "next/server";
import { getRuntimeCatalogGeneratedAt, listRuntimeCatalogCategories } from "../../../games/trivia/play/trivia-runtime-builder";

export async function GET() {
  const categories = listRuntimeCatalogCategories().filter((category) => category.category === "bible");

  return NextResponse.json({
    generatedAt: getRuntimeCatalogGeneratedAt(),
    categories,
  });
}
