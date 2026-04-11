/**
 * Content Pipeline — intercepts all CMS (Strapi 3) content before display
 * to fix misspellings, SiteImprove false-positive triggers, and other
 * content-level issues that cannot be fixed at the CMS source.
 *
 * Architecture:
 *   The pipeline is a chain of plugin functions. Each plugin receives a
 *   string (HTML or plain text) and returns a transformed string. Plugins
 *   are executed in registration order.
 *
 *   Two parallel pipelines exist:
 *     - htmlPipeline:  for rendered HTML (article bodies, markdown output)
 *     - textPipeline:  for plain text (titles, summaries, meta tags)
 *
 * Usage:
 *   import { sanitizeContent, sanitizeText } from "@/utils/contentSanitizer";
 *
 *   // For HTML body content (after markdown render + DOMPurify):
 *   const cleanHtml = sanitizeContent(rawHtml);
 *
 *   // For plain text (titles, summaries):
 *   const cleanText = sanitizeText(rawText);
 *
 * Adding a new plugin:
 *   1. Write a function:  (text: string) => string
 *   2. Register it:       registerHtmlPlugin(myPlugin)
 *                    or:  registerTextPlugin(myPlugin)
 *                    or:  registerPlugin(myPlugin)  // both pipelines
 *   3. Plugins run in registration order after the built-in plugins.
 */

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixMisspellings
// Corrects known CMS typos. Add new entries alphabetically.
// ═══════════════════════════════════════════════════════════════════

const MISSPELLINGS = [
  // Genuine typos (SiteImprove scan 2026-04-11)
  [/\bactivites\b/gi, "activities"],
  [/\bandthe\b/gi, "and the"],
  [/\bAssesing\b/gi, "Assessing"],
  [/\bBehavorial\b/gi, "Behavioral"],
  [/\bBuiding\b/gi, "Building"],
  [/\bChallange\b/gi, "Challenge"],
  [/\bCommunnity\b/gi, "Community"],
  [/\bcounites\b/gi, "counties"],
  [/\bDecription\b/gi, "Description"],
  [/\bdefendent\b/gi, "defendant"],
  [/\beligilble\b/gi, "eligible"],
  [/\bfollowin\b(?!g)/gi, "following"],
  [/\bIlliois\b/gi, "Illinois"],
  [/\bIndependant\b/gi, "Independent"],
  [/\bindependantly\b/gi, "independently"],
  [/\bInitative\b/gi, "Initiative"],
  [/\bInstitue\b/gi, "Institute"],
  [/\bJounral\b/gi, "Journal"],
  [/\blangauge\b/gi, "language"],
  [/\bllinois\b/gi, "Illinois"],
  [/\bNewletter\b/gi, "Newsletter"],
  [/\boversite\b/gi, "oversight"],
  [/\bpayed\b/gi, "paid"],
  [/\bprogam\b(?!m)/gi, "program"],
  [/\bprograming\b/gi, "programming"],
  [/\bReserah\b/gi, "Research"],
  [/\bReserach\b/gi, "Research"],
  [/\bResearh\b/gi, "Research"],
  [/\brepresenation\b/gi, "representation"],
  [/\bRetreived\b/gi, "Retrieved"],
  [/\bseperated\b/gi, "separated"],
  [/\bseperately\b/gi, "separately"],
  [/\bsubtance\b/gi, "substance"],
  [/\bTThe\b/g, "The"],
];

function fixMisspellings(text) {
  let result = text;
  for (const [pattern, replacement] of MISSPELLINGS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixApostrophes
// Restores apostrophes stripped by Strapi slug generation when those
// slugs leak into titles/headings. Only runs on text pipeline since
// HTML bodies rarely have this issue.
// ═══════════════════════════════════════════════════════════════════

const APOSTROPHES = [
  [/\bDont\b(?!')/g, "Don't"],
  [/\bWomens\b(?!')/g, "Women's"],
  [/\bCommunitys\b(?!')/g, "Community's"],
  [/\bCountys\b(?!')/g, "County's"],
  [/\bStates\sAttorneys\b/g, "State's Attorney's"],
];

function fixApostrophes(text) {
  let result = text;
  for (const [pattern, replacement] of APOSTROPHES) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsImages
// Adds alt attributes to CMS images that are missing them.
// ═══════════════════════════════════════════════════════════════════

function fixCmsImages(html) {
  // Add alt text to images missing the alt attribute entirely
  return html.replace(
    /<img\b((?![^>]*\balt\s*=)[^>]*)>/gi,
    (match, attrs) => {
      // Try to derive alt from src filename
      const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
      let alt = "";
      if (srcMatch) {
        alt = srcMatch[1]
          .split("/")
          .pop()
          .replace(/[-_]/g, " ")
          .replace(/\.[^.]+$/, "")
          .replace(/\s[a-f0-9]{8,}$/i, "")
          .trim();
      }
      return `<img alt="${alt}"${attrs}>`;
    }
  );
}

// ═══════════════════════════════════════════════════════════════════
// PLUGIN: fixCmsContrast
// Fixes white-on-light contrast issues in CMS inline styles/classes.
// ═══════════════════════════════════════════════════════════════════

function fixCmsContrast(html) {
  let result = html;

  // Fix dark backgrounds with conflicting color: #000!important.
  // CMS authors set background: #3C5984 (dark blue) but color: #000 (black),
  // making text invisible. Change text to white.
  result = result.replace(
    /background:\s*(#[2-5][0-9a-f]{5})\s*!important;\s*color:\s*#000\s*!important/gi,
    "background: $1 !important; color: #fff !important"
  );

  // Convert .white-heading class to inline style.
  // DOMPurify strips <style> tags, so class-based colors like
  // .white-heading {color: #fff !important} are lost after sanitization.
  // Inject inline color directly on elements that use the class.
  result = result.replace(
    /\{\.white-heading\b/g,
    '{style="color: #fff !important" .white-heading'
  );

  // Also handle HTML elements with class="white-heading" (non-markdown)
  result = result.replace(
    /class="([^"]*\bwhite-heading\b[^"]*)"/g,
    (match, classes) => {
      return `class="${classes}" style="color: #fff !important"`;
    }
  );

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline registry
// ═══════════════════════════════════════════════════════════════════

// Built-in plugins (always run first)
const htmlPlugins = [fixMisspellings, fixApostrophes, fixCmsImages, fixCmsContrast];
const textPlugins = [fixMisspellings, fixApostrophes];

/**
 * Register a plugin for the HTML pipeline only (article bodies, markdown).
 */
function registerHtmlPlugin(fn) {
  htmlPlugins.push(fn);
}

/**
 * Register a plugin for the text pipeline only (titles, summaries).
 */
function registerTextPlugin(fn) {
  textPlugins.push(fn);
}

/**
 * Register a plugin for both pipelines.
 */
function registerPlugin(fn) {
  htmlPlugins.push(fn);
  textPlugins.push(fn);
}

// ═══════════════════════════════════════════════════════════════════
// Pipeline execution
// ═══════════════════════════════════════════════════════════════════

function runPipeline(plugins, input) {
  if (!input || typeof input !== "string") return input;
  let result = input;
  for (const plugin of plugins) {
    result = plugin(result);
  }
  return result;
}

/**
 * Sanitize HTML content (article bodies, rendered markdown).
 * Runs all registered HTML pipeline plugins in order.
 */
function sanitizeContent(html) {
  return runPipeline(htmlPlugins, html);
}

/**
 * Sanitize plain text (titles, summaries, meta descriptions).
 * Runs all registered text pipeline plugins in order.
 */
function sanitizeText(text) {
  return runPipeline(textPlugins, text);
}

// ═══════════════════════════════════════════════════════════════════
// Deep sanitizer for API response objects
// ═══════════════════════════════════════════════════════════════════

/**
 * Recursively sanitize all string values in an object/array.
 * Use as an axios response interceptor or on raw API data.
 */
function deepSanitize(obj) {
  if (typeof obj === "string") return sanitizeContent(obj);
  if (Array.isArray(obj)) return obj.map(deepSanitize);
  if (obj && typeof obj === "object") {
    const result = {};
    for (const key of Object.keys(obj)) {
      result[key] = deepSanitize(obj[key]);
    }
    return result;
  }
  return obj;
}

/**
 * Axios response interceptor that deep-sanitizes all response data.
 * Usage: api.interceptors.response.use(sanitizeResponse)
 */
function sanitizeResponse(response) {
  if (response.data) {
    response.data = deepSanitize(response.data);
  }
  return response;
}

export {
  sanitizeContent,
  sanitizeText,
  deepSanitize,
  sanitizeResponse,
  registerHtmlPlugin,
  registerTextPlugin,
  registerPlugin,
  // Expose individual plugins for testing/selective use
  fixMisspellings,
  fixApostrophes,
  fixCmsImages,
  fixCmsContrast,
  // Expose data for external inspection
  MISSPELLINGS,
  APOSTROPHES,
};
