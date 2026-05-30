import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

const DOMPurify = createDOMPurify(new JSDOM("").window);

// Test 1: Default iframe behavior
console.log("Test 1: Default iframe sanitization (NO ADD_TAGS)");
const test1 = '<iframe src="https://example.com"></iframe>';
const result1 = DOMPurify.sanitize(test1);
console.log("Input:", test1);
console.log("Output:", result1);
console.log("");

// Test 2: With ADD_TAGS configuration (as in markdown.js)
console.log("Test 2: With ADD_TAGS=['iframe'] + attributes");
const test2 = '<iframe src="https://example.com" allow="autoplay"></iframe>';
const result2 = DOMPurify.sanitize(test2, {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder"],
});
console.log("Input:", test2);
console.log("Output:", result2);
console.log("");

// Test 3: Malicious javascript: URI
console.log("Test 3: Malicious javascript: URI");
const test3 = '<iframe src="javascript:alert(1)"></iframe>';
const result3 = DOMPurify.sanitize(test3, {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder"],
});
console.log("Input:", test3);
console.log("Output:", result3);
console.log("");

// Test 4: Data URI with script
console.log("Test 4: Data URI with script");
const test4 = '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>';
const result4 = DOMPurify.sanitize(test4, {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder"],
});
console.log("Input:", test4);
console.log("Output:", result4);
console.log("");

// Test 5: Style tag injection with background-image
console.log("Test 5: Style tag injection");
const test5 = '<style>body { background: url(javascript:alert(1)); }</style>';
const result5 = DOMPurify.sanitize(test5, {
  ADD_TAGS: ["style"],
});
console.log("Input:", test5);
console.log("Output:", result5);
console.log("");

// Test 6: Check if sandbox is in the ADD_ATTR list
console.log("Test 6: iframe with sandbox attribute (NOT in ADD_ATTR)");
const test6 = '<iframe src="https://example.com" sandbox="allow-scripts"></iframe>';
const result6 = DOMPurify.sanitize(test6, {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: ["allow", "allowfullscreen", "frameborder"],
});
console.log("Input:", test6);
console.log("Output:", result6);
