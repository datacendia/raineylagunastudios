/**
 * Trust-boundary sanitization for the i18n innerHTML interpolator.
 *
 * The marketing site's i18n layer (see the apply() loop at the bottom of
 * `index.html`) reads `data-es` / `data-en` attributes from each element
 * and assigns them to .innerHTML when the same element is tagged with
 * `data-html="true"`. That makes the data-* attribute values a trust
 * boundary: any HTML written by an editor lands directly in the DOM.
 *
 * We do NOT sanitize at render time on purpose - the site is fully static,
 * the strings are committed to source, and a runtime sanitizer would only
 * add ambiguity. Instead, the CI gate (`scripts/check-html.mjs`) refuses
 * the build if a data-html attribute contains a dangerous token. This
 * module owns the regex used by that gate so it can be unit-tested
 * independently of the file-walking I/O in check-html.mjs.
 *
 * Allowed inline tags (intentionally narrow): <em>, <strong>, <a href="https://...">, <br>.
 * Refused: <script>, <iframe>, <object>, <embed>, <style>, javascript: URLs,
 *          and any `on*=` inline event handler attribute.
 */

/**
 * Anchored character class that matches any single token we reject.
 * Used as a one-shot test against the entire attribute value.
 */
export const DANGEROUS_RE =
  /<\s*(script|iframe|object|embed|style)\b|javascript:|\son[a-z]+\s*=/i;

/**
 * Returns true if `value` contains a token that would be unsafe to assign
 * to `.innerHTML` from a `data-es` / `data-en` attribute. The check is
 * deliberately strict: a single match anywhere in the string fails the
 * whole value.
 *
 * @param {string} value - the raw data-es/data-en/data-* attribute body.
 * @returns {boolean}
 */
export function containsDangerousHtml(value) {
  if (typeof value !== "string") return false;
  return DANGEROUS_RE.test(value);
}
