/**
 * Tests for the trust-boundary sanitizer used by `scripts/check-html.mjs`.
 *
 * If any of these change, `check-html.mjs` must be re-reviewed - this regex
 * is the only thing standing between editor-written i18n strings and
 * .innerHTML assignment in the live marketing site.
 */

import { describe, it, expect } from "vitest";
import { containsDangerousHtml } from "./sanitize.mjs";

describe("containsDangerousHtml", () => {
  describe("benign content (must pass through)", () => {
    const safe = [
      "Plain text with no markup.",
      "Texto plano con tildes - año, mañana, año.",
      "Bold via <strong>strong</strong> tag.",
      "<em>Italic</em> emphasis.",
      'Anchor: <a href="https://raineylagunastudios.com">visit</a>',
      "Line<br>break",
      "Line<br />break",
      "Numeric entities: &nbsp; &mdash; &amp;",
      "", // empty string is the no-translation case
    ];
    it.each(safe)("accepts: %s", (value) => {
      expect(containsDangerousHtml(value)).toBe(false);
    });
  });

  describe("dangerous content (must be refused)", () => {
    const unsafe = [
      "<script>alert(1)</script>",
      'before <script src="x"></script> after',
      '<SCRIPT>alert(1)</SCRIPT>', // case-insensitive
      "<iframe src=//evil></iframe>",
      "<object data=evil.swf></object>",
      "<embed src=evil.swf>",
      "<style>body{display:none}</style>",
      'a <a href="javascript:alert(1)">link</a>',
      'a <a href="JavaScript:alert(1)">link</a>',
      '<img src=x onerror=alert(1)>',
      '<img src=x ONERROR=alert(1)>',
      '<a onclick="x()">click</a>',
      '<div onmouseover="x()">hover</div>',
    ];
    it.each(unsafe)("refuses: %s", (value) => {
      expect(containsDangerousHtml(value)).toBe(true);
    });
  });

  describe("type guards", () => {
    it("returns false for non-strings (defensive)", () => {
      // The CI gate only ever passes strings, but the helper should not
      // explode if the regex source is reused elsewhere with bad input.
      // @ts-expect-error - intentional misuse
      expect(containsDangerousHtml(undefined)).toBe(false);
      // @ts-expect-error - intentional misuse
      expect(containsDangerousHtml(null)).toBe(false);
      // @ts-expect-error - intentional misuse
      expect(containsDangerousHtml(42)).toBe(false);
    });
  });
});
