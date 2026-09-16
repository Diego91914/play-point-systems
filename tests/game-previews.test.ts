import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import ts from "typescript";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { MASTER_GAME_CATALOG } from "../lib/play-point-core/master-game-catalog";
import manifest from "../lib/play-point-core/game-preview-manifest.json";
import routes from "./fixtures/game-preview-routes.json";

describe("authentic static previews", () => {
  it("covers every catalog entry exactly once and preserves detail and launch destinations", () => {
    expect(manifest.captures.flatMap(capture => capture.gameIds).sort()).toEqual(MASTER_GAME_CATALOG.map(game => game.id).sort());
    expect(MASTER_GAME_CATALOG.map(({ id, href, launchHref }) => ({ id, href, launchHref }))).toEqual(routes);
    for (const game of MASTER_GAME_CATALOG) {
      const capture = manifest.captures.find(item => item.gameIds.includes(game.id))!;
      expect(capture.launchHref).toBe(game.launchHref);
      expect(capture.captureRoute).toBe(game.id === "play-point-trivia" ? "/games/trivia/builder" : game.launchHref);
      expect(capture.captureRoute).not.toBe(game.href);
    }
  });

  it("labels shared selectors honestly and retains distinct Classic/Chaos and Quest captures", () => {
    const capture = (id: string) => manifest.captures.find(item => item.gameIds.includes(id))!;
    expect(capture("card-shark-stud")).toBe(capture("card-shark-classic"));
    expect(capture("atw-survival")).toBe(capture("atw-ladder"));
    for (const item of manifest.captures.filter(item => item.gameIds.length > 1)) {
      expect(item.sharedSelector).toBe(true);
      expect(item.label).toContain("shared format selector");
    }
    expect(capture("shot-classic").captureRoute).toContain("variant=CLASSIC");
    expect(capture("shot-chaos").captureRoute).toContain("variant=CHAOS");
    expect(capture("shot-classic").rawSha256).not.toBe(capture("shot-chaos").rawSha256);
    expect(capture("quest-digital").captureRoute).not.toBe(capture("quest-disc-golf").captureRoute);
    expect(capture("play-point-trivia").label).toContain("builder");
  });

  it("ships real, bounded WebP files matching recorded dimensions and hashes", async () => {
    const files: string[] = [];
    for (const capture of manifest.captures) {
      expect(capture.sourceRevision).toMatch(/^[a-f0-9]{40}$/);
      expect(Number.isFinite(Date.parse(capture.capturedAt))).toBe(true);
      expect(capture.pageErrors).toEqual([]);
      expect(capture.resolvedUrl).not.toContain("/sign-in");
      expect(capture.label).toMatch(/screenshot/);
      expect(capture.alt.length).toBeGreaterThan(20);
      expect(capture.files.map(file => file.width)).toEqual([480, 800, 1280]);
      for (const file of capture.files) {
        expect(file.src).toMatch(/^\/images\/game-previews\/[a-z0-9-]+-[a-f0-9]{12}-(480|800|1280)\.webp$/);
        const bytes = readFileSync(resolve("public", file.src.slice(1)));
        const metadata = await sharp(bytes).metadata();
        expect(metadata.format).toBe("webp");
        expect(metadata.width).toBe(file.width);
        expect(metadata.height).toBe(file.height);
        expect(file.width / file.height).toBe(capture.width / capture.height);
        expect(bytes.length).toBe(file.bytes);
        expect(bytes.length).toBeLessThan(300_000);
        expect(createHash("sha256").update(bytes).digest("hex")).toBe(file.sha256);
        files.push(file.src.split("/").at(-1)!);
      }
    }
    expect(readdirSync("public/images/game-previews").sort()).toEqual(files.sort());
  });

  it("keeps the preview import graph out of game runtimes and prevents link prefetch", () => {
    const allowedData = new Set(["master-game-catalog.ts", "founders-bundle.ts", "game-experience-demos.ts", "game-preview-manifest.json"]);
    const visited = new Set<string>();
    function inspect(path: string) {
      path = resolve(path);
      if (visited.has(path)) return;
      visited.add(path);
      const text = readFileSync(path, "utf8");
      if (path.endsWith(".json")) return;
      expect(text, path).not.toMatch(/<\s*(iframe|object|embed)\b|\b(fetch|WebSocket|EventSource|setInterval)\s*\(/);
      const tree = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly && ts.isStringLiteral(node.moduleSpecifier)) {
          const spec = node.moduleSpecifier.text;
          if (!spec.startsWith(".") && !spec.startsWith("@/")) {
            expect(["react", "next", "next/link", "next/image", "next/navigation"]).toContain(spec);
          } else {
            const base = spec.startsWith("@/") ? resolve(spec.slice(2)) : resolve(dirname(path), spec);
            const target = [base, `${base}.ts`, `${base}.tsx`].find(existsSync)!;
            expect(target, spec).toBeTruthy();
            expect(target.replaceAll("\\", "/")).not.toContain("/app/games/");
            if (target.replaceAll("\\", "/").includes("/lib/")) expect(allowedData.has(target.split(/[\\/]/).at(-1)!)).toBe(true);
            inspect(target);
          }
        }
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(tree) === "Link") {
          expect(node.attributes.properties.some(attr => ts.isJsxAttribute(attr) && attr.name.getText(tree) === "prefetch" && attr.initializer?.getText(tree) === "{false}"), path).toBe(true);
        }
        ts.forEachChild(node, visit);
      }
      visit(tree);
    }
    inspect("app/play-amplified/page.tsx");
    inspect("app/play-amplified/games/[gameId]/page.tsx");
    inspect("app/play-amplified/layout.tsx");
    for (const path of ["app/play-amplified/GameScreenshot.tsx", "app/play-amplified/GameScreenshotImage.tsx"]) {
      expect(readFileSync(path, "utf8")).not.toMatch(/localStorage|sessionStorage|indexedDB|useEffect/);
    }
  });

  it("does not precache game/account pages when the preview installs its shell", () => {
    const worker = readFileSync("public/play-amplified-sw.js", "utf8");
    const shell = worker.match(/const APP_SHELL = (\[[\s\S]*?\]);/)![1];
    expect(shell).toContain('"/play-amplified"');
    expect(shell).not.toMatch(/"\/(games|play|shot-caddy)(\/|"|\?)/);
  });
});
