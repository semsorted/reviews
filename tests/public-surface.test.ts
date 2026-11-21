import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("public surface", () => {
  it.each(["/onboarding", "/signup", "/dashboard", "/admin/shops/new", "demo-token"])(
    "landing page has no %s path",
    (path) => {
      expect(readFileSync("src/app/page.tsx", "utf8")).not.toContain(path);
    }
  );

  it("has no bare /r entry that could open a fake review", () => {
    expect(existsSync("src/app/r/page.tsx")).toBe(false);
  });

  it("ships no demo identity", () => {
    const offenders = sourceFiles("src").filter((file) =>
      /demo-shop-id|demo-user-id|Artisan Coffee/.test(readFileSync(file, "utf8"))
    );
    expect(offenders).toEqual([]);
  });
});
