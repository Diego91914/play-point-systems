import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Inside Man scenario pool", () => {
  it("launches with a large unique scenario pool and three-point win conditions", () => {
    const source = readFileSync("lib/play-point-core/inside-man-server.ts", "utf8");
    const scenarioIds = [...source.matchAll(/\{id:"([^"]+)",title:/g)].map(match => match[1]);
    expect(scenarioIds.length).toBeGreaterThanOrEqual(60);
    expect(new Set(scenarioIds).size).toBe(scenarioIds.length);
    expect(source).toContain("state.insideManId=shuffle(state.players)[0].id");
    expect(source).toContain("if(state.crewPoints>=3)");
    expect(source).toContain("else if(state.sabotagePoints>=3)");
  });
});
