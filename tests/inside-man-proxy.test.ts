import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";

test("Inside Man room links and APIs support guests",()=>{
  const source=fs.readFileSync(path.join(process.cwd(),"proxy.ts"),"utf8");
  assert.match(source,/pathname === "\/games\/inside-man"/);
  assert.match(source,/pathname === "\/api\/games\/inside-man"/);
  assert.match(source,/pathname\.startsWith\("\/api\/games\/inside-man\/"\)/);
});
