import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { isRetiredPath, SITE_URL } from "@/lib/site";

describe("search engine files", () => {
  it("keeps private and customer pages out of search", () => {
    const { rules, sitemap: map } = robots();
    const rule = Array.isArray(rules) ? rules[0] : rules;
    expect(rule.allow).toBe("/");
    expect(rule.disallow).toEqual(expect.arrayContaining(["/admin", "/api/", "/login", "/r/"]));
    expect(map).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it.each(["/universities", "/prices", "/faq"])("lets Google recrawl retired page %s", (path) => {
    const rule = [robots().rules].flat()[0];
    expect([rule.disallow].flat()).not.toContain(path);
  });

  it("lists only the live home page", () => {
    expect(sitemap().map((entry) => entry.url)).toEqual([SITE_URL]);
  });
});

describe("isRetiredPath", () => {
  it.each(["/why-semsorted", "/universities", "/universities/delhi", "/request", "/prices", "/how-it-works", "/faq", "/faq/"])(
    "retires %s",
    (path) => expect(isRetiredPath(path)).toBe(true)
  );

  it.each(["/", "/login", "/admin", "/r/abc12345", "/faq-new", "/pricesheet"])("keeps %s", (path) => {
    expect(isRetiredPath(path)).toBe(false);
  });
});
