import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { STORIES } from "@/app/_landing/content";
import { activePage, leafTurn } from "@/app/_landing/flip";
import { isRetiredPath, NAV_LINKS, SITE_URL } from "@/lib/site";

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

  it("lists every public page and never a retired one", () => {
    const paths = sitemap().map((entry) => entry.url.slice(SITE_URL.length) || "/");
    expect(paths).toEqual(expect.arrayContaining(["/", "/stories", "/contact", `/stories/${STORIES[0].slug}`]));
    expect(paths).toHaveLength(1 + NAV_LINKS.length + STORIES.length);
    expect(paths.filter(isRetiredPath)).toEqual([]);
  });
});

describe("story page turn", () => {
  it("rests, turns one page at a time, and never turns the last page", () => {
    expect(leafTurn(0, 0, 5)).toBe(0);
    expect(leafTurn(0.25, 0, 5)).toBe(1);
    expect(leafTurn(0.25, 1, 5)).toBe(0);
    expect(leafTurn(1, 3, 5)).toBe(1);
    expect(leafTurn(1, 4, 5)).toBe(0);
  });

  it("tracks the visible page, even when scroll overshoots", () => {
    expect(activePage(-1, 5)).toBe(0);
    expect(activePage(0.5, 5)).toBe(2);
    expect(activePage(2, 5)).toBe(4);
  });
});

describe("stories", () => {
  it("has a complete story in all three languages", () => {
    expect(new Set(STORIES.map((story) => story.slug)).size).toBe(STORIES.length);
    for (const story of STORIES) {
      for (const text of Object.values(story.text)) {
        expect(text.title && text.trade && text.teaser).toBeTruthy();
        expect(text.paragraphs.length).toBeGreaterThanOrEqual(4);
      }
    }
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
