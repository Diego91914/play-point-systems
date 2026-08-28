import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

test("Inside Man launches with a large scenario pool",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"lib/play-point-core/inside-man-server.ts"),"utf8");
  const scenarioIds=[...source.matchAll(/\{id:"([^"]+)",title:/g)].map(match=>match[1]);
  assert.ok(scenarioIds.length>=60,`expected at least 60 scenarios, found ${scenarioIds.length}`);
  assert.equal(new Set(scenarioIds).size,scenarioIds.length,"scenario IDs must be unique");
  assert.match(source,/state\.insideManId=shuffle\(state\.players\)\[0\]\.id/);
  assert.match(source,/if\(state\.crewPoints>=3\)/);
  assert.match(source,/else if\(state\.sabotagePoints>=3\)/);
});
