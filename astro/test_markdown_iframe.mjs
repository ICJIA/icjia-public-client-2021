import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,
});

// Test: Can CMS markdown render iframe?
const testMarkdown = `
# Test

<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>

Some text.
`;

console.log("Markdown input:");
console.log(testMarkdown);
console.log("");
console.log("Rendered HTML:");
const rendered = md.render(testMarkdown);
console.log(rendered);
console.log("");
console.log("Analysis:");
console.log("- Markdown-it WITH html:true allows raw HTML");
console.log("- DOMPurify then sanitizes the output");
console.log("- iframes pass through if ADD_TAGS includes 'iframe'");
console.log("- But without 'sandbox' in ADD_ATTR, iframe is unsandboxed");
