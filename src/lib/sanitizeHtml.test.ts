import { describe, expect, it } from "vitest";

import { sanitizeHtml } from "./sanitizeHtml";

describe("sanitizeHtml", () => {
  it("keeps allow-listed formatting tags", () => {
    const input = "<p>Hello <strong>world</strong> and <em>friends</em></p>";
    expect(sanitizeHtml(input)).toBe(
      "<p>Hello <strong>world</strong> and <em>friends</em></p>"
    );
  });

  it("preserves lists", () => {
    const input = "<ul><li>one</li><li>two</li></ul>";
    expect(sanitizeHtml(input)).toBe("<ul><li>one</li><li>two</li></ul>");
  });

  it("removes script tags entirely", () => {
    const input = "<p>safe</p><script>alert('xss')</script>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<p>safe</p>");
    expect(result).not.toContain("script");
    expect(result).not.toContain("alert");
  });

  it("strips event handler attributes", () => {
    const input = '<strong onclick="steal()">bold</strong>';
    const result = sanitizeHtml(input);
    expect(result).toBe("<strong>bold</strong>");
    expect(result).not.toContain("onclick");
  });

  it("unwraps disallowed elements but keeps their text", () => {
    const input = '<a href="javascript:alert(1)">click</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("click");
    expect(result).not.toContain("href");
    expect(result).not.toContain("<a");
  });

  it("neutralizes img onerror payloads", () => {
    const input = '<img src="x" onerror="alert(1)" />';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onerror");
    expect(result).not.toContain("<img");
  });

  it("returns an empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});
