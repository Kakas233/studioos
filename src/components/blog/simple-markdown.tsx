"use client";

/**
 * A simple markdown-to-HTML renderer that handles the subset of markdown
 * used in blog content: bold (**text**), lists (- item), and paragraphs.
 * This avoids needing the react-markdown dependency.
 */

/** Escape HTML entities to prevent XSS */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function SimpleMarkdown({ children }: { children: string }) {
  // Escape HTML first, then apply markdown transforms on the safe string
  const html = escapeHtml(children)
    // Bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Split into paragraphs by double newline
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";

      // Check if block is a list
      const lines = trimmed.split("\n");
      const isUnorderedList = lines.every(
        (l) => l.trim().startsWith("- ") || l.trim() === ""
      );
      const isOrderedList = lines.every(
        (l) => /^\d+\.\s/.test(l.trim()) || l.trim() === ""
      );

      if (isUnorderedList) {
        const items = lines
          .filter((l) => l.trim().startsWith("- "))
          .map((l) => `<li>${l.trim().slice(2)}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      if (isOrderedList) {
        const items = lines
          .filter((l) => /^\d+\.\s/.test(l.trim()))
          .map((l) => `<li>${l.trim().replace(/^\d+\.\s/, "")}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }

      return `<p>${trimmed}</p>`;
    })
    .join("");

  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
