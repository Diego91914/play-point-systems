import { NextResponse } from "next/server";
import { getRuntimeCatalogGeneratedAt, listRuntimeCatalogCategories } from "../../../games/trivia/play/trivia-runtime-builder";

export async function GET() {
  return NextResponse.json({
    generatedAt: getRuntimeCatalogGeneratedAt(),
    categories: listRuntimeCatalogCategories(),
  });
}
