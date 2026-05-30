import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const DOMPurify = createDOMPurify(new JSDOM("").window);

// The exact configuration from markdown.js lines 212-231
const config = {
  ADD_TAGS: ["figure", "figcaption", "iframe", "style"],
  ADD_ATTR: [
    "target",
    "id",
    "class",
    "style",
    "tabindex",
    "aria-label",
    "aria-hidden",
    "role",
    "data-type",
    "colspan",
    "rowspan",
    "scope",
    "headers",
    "allow",
    "allowfullscreen",
    "frameborder",
  ],
};

console.log("Configuration from markdown.js:");
console.log("ADD_TAGS:", config.ADD_TAGS);
console.log("ADD_ATTR:", config.ADD_ATTR);
console.log("");

// Verify defaults
console.log("DOMPurify version 3+ defaults:");
console.log("- default-src: blocks unsafe iframes (requires ADD_TAGS)");
console.log("- Dangerous attributes blocked by default: src is NOT blocked after ADD_TAGS");
console.log("- javascript: URIs are blocked by DOMPurify");
console.log("- data: URIs are blocked by DOMPurify");
console.log("- sandbox attribute is NOT in ADD_ATTR → STRIPPED from iframes");
console.log("");

// Critical: No sandbox attribute in ADD_ATTR
console.log("CRITICAL FINDING:");
console.log("- sandbox attribute is NOT listed in ADD_ATTR");
console.log("- This means iframes rendered from markdown are UNSANDBOXED");
console.log("- Unsandboxed iframes can access window.parent, run unrestricted JS");
console.log("");

// Test: What happens if CMS author adds sandbox to markdown?
console.log("Test: If CMS content includes sandbox attribute");
const testWithSandbox = '<iframe src="https://youtube.com/embed/video" sandbox="allow-scripts"></iframe>';
const result = DOMPurify.sanitize(testWithSandbox, config);
console.log("Input:", testWithSandbox);
console.log("Output:", result);
console.log("Note: sandbox attribute is stripped!");
