import { describe, expect, it } from "vitest";
import { isAllowedGoogleReviewUrl } from "@/lib/reviews/rules";

describe("isAllowedGoogleReviewUrl", () => {
  it.each([
    "https://google.com/maps/place/x",
    "https://www.google.com/maps/place/x",
    "https://search.google.com/local/writereview?placeid=abc",
    "https://maps.google.com/?cid=1",
    "https://g.page/r/abc/review",
    "https://maps.app.goo.gl/abc",
    "https://g.co/kgs/abc",
    "https://www.google.co.in/maps/place/x",
    "https://google.co.in/maps/place/x",
    "https://maps.google.co.in/?cid=1",
  ])("accepts %s", (url) => {
    expect(isAllowedGoogleReviewUrl(url)).toBe(true);
  });

  it.each([
    "http://g.page/r/abc/review",
    "https://google.com.evil.com/x",
    "https://google.co.in.evil.com/x",
    "https://evil.com/google.com",
    "https://g.page@evil.com/x",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %s", (url) => {
    expect(isAllowedGoogleReviewUrl(url)).toBe(false);
  });
});
