// Minimal allow-list HTML sanitizer for the rich-text description fields.
//
// Descriptions are captured as raw innerHTML from a contentEditable editor and
// later rendered with dangerouslySetInnerHTML, so untrusted markup (e.g. a
// pasted <img onerror> or <script>) must be stripped before storage/render.
// We only ever need the handful of inline/list tags the editor toolbar emits.

const ALLOWED_TAGS = new Set([
  "B",
  "STRONG",
  "I",
  "EM",
  "S",
  "STRIKE",
  "DEL",
  "U",
  "BR",
  "P",
  "DIV",
  "SPAN",
  "UL",
  "OL",
  "LI"
]);

/**
 * Returns a sanitized copy of the supplied HTML string containing only the
 * allow-listed formatting tags, with every attribute removed. Falls back to a
 * naive tag strip when run outside the browser (e.g. SSR / tests without DOM).
 */
export const sanitizeHtml = (html: string): string => {
  if (!html) return "";

  if (typeof document === "undefined") {
    // No DOM available: drop all tags rather than risk emitting unsafe markup.
    return html.replace(/<[^>]*>/g, "");
  }

  const template = document.createElement("template");
  template.innerHTML = html;

  const walk = (node: Node) => {
    // Iterate over a static copy because we mutate the tree as we go.
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        const element = child as Element;

        if (!ALLOWED_TAGS.has(element.tagName)) {
          // Unwrap disallowed elements: keep their (sanitized) text children,
          // discard the element itself (and anything like <script>/<style>).
          if (element.tagName === "SCRIPT" || element.tagName === "STYLE") {
            element.remove();
            return;
          }
          const parent = element.parentNode;
          if (parent) {
            while (element.firstChild) {
              parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
          }
          // The moved children are still in `node`, so recurse on the parent.
          walk(node);
          return;
        }

        // Strip every attribute (removes onerror, href:javascript, style, etc).
        Array.from(element.attributes).forEach((attr) => {
          element.removeAttribute(attr.name);
        });

        walk(element);
      } else if (
        child.nodeType !== Node.TEXT_NODE &&
        child.nodeType !== Node.DOCUMENT_FRAGMENT_NODE
      ) {
        // Drop comments and other node types.
        child.parentNode?.removeChild(child);
      }
    });
  };

  walk(template.content);
  return template.innerHTML;
};
