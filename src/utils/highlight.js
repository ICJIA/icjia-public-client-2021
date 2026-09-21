// Highlights search terms in a result card's title and summary (v1.5.83).
//
// The card renders CMS text as HTML, so this works on text nodes only: tags and
// attributes are never touched, escaped text stays escaped, and the only markup
// added is <mark class="search-hit">. It marks what the search matched: each
// meaningful word of the query, in any order, including the word a misspelled
// term matched ("trafic" marks "Traffic").
import { searchWords } from "@/utils/searchFields";

// Edit distance, capped: returns a number above `max` as soon as it is exceeded.
function distance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      if (current[j] < best) best = current[j];
    }
    if (best > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
}

// The [start, end) ranges of one word that the search terms account for.
function rangesIn(word, terms) {
  const lower = word.toLowerCase();
  const ranges = [];
  for (const term of terms) {
    const at = lower.indexOf(term);
    if (at >= 0) {
      ranges.push([at, at + term.length]);
    } else if (term.length >= 5) {
      // a misspelling: one edit away from the word, or from its beginning
      if (distance(lower, term, 1) <= 1) ranges.push([0, word.length]);
      else {
        const head = Math.min(word.length, term.length + 1);
        if (
          word.length > head &&
          distance(lower.slice(0, head), term, 1) <= 1
        ) {
          ranges.push([0, head]);
        }
      }
    }
  }
  ranges.sort((a, b) => a[0] - b[0]);
  return ranges.reduce((merged, range) => {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push(range.slice());
    return merged;
  }, []);
}

// A typed word with punctuation inside it ("safe-t", "children's") is in no
// run of letters and digits ("SAFE", "-", "T"), so it is looked for as typed
// and marked as one piece, whatever mark joins its parts in the text
// ("Children’s"). A space does not join: "safe-t" is not in "a safe time".
function typedWhole(terms) {
  return terms
    .filter((term) => /[^a-z0-9]/.test(term))
    .map((term) => term.split(/[^a-z0-9]+/).join("[^A-Za-z0-9\\s]+"))
    .join("|");
}

// How a text is cut into pieces, and the test for a typed word kept whole.
function cutters(terms) {
  const whole = typedWhole(terms);
  return {
    pieces: new RegExp(`(${whole && `${whole}|`}[A-Za-z0-9]+)`, "i"),
    typed: whole && new RegExp(`^(?:${whole})$`, "i"),
  };
}

// The ranges to mark in one piece of a text.
function rangesOf(part, terms, typed) {
  if (/^[A-Za-z0-9]+$/.test(part)) return rangesIn(part, terms);
  return typed && typed.test(part) ? [[0, part.length]] : [];
}

function markTextNode(node, terms, pieces, typed) {
  const parts = node.nodeValue.split(pieces);
  if (parts.length < 2) return;
  const fragment = node.ownerDocument.createDocumentFragment();
  let marked = false;
  for (const part of parts) {
    const ranges = rangesOf(part, terms, typed);
    if (!ranges.length) {
      fragment.appendChild(node.ownerDocument.createTextNode(part));
      continue;
    }
    marked = true;
    let cursor = 0;
    for (const [start, end] of ranges) {
      if (start > cursor) {
        fragment.appendChild(
          node.ownerDocument.createTextNode(part.slice(cursor, start))
        );
      }
      const mark = node.ownerDocument.createElement("mark");
      mark.className = "search-hit";
      mark.textContent = part.slice(start, end);
      fragment.appendChild(mark);
      cursor = end;
    }
    if (cursor < part.length) {
      fragment.appendChild(
        node.ownerDocument.createTextNode(part.slice(cursor))
      );
    }
  }
  if (marked) node.parentNode.replaceChild(fragment, node);
}

export function highlightHtml(html, query) {
  if (typeof html !== "string" || !html) return "";
  const terms = searchWords(query);
  if (!terms.length || typeof document === "undefined") return html;
  const holder = document.createElement("template");
  holder.innerHTML = html;
  const root = holder.content || holder;
  const walker = document.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  const before = holder.innerHTML;
  const { pieces, typed } = cutters(terms);
  nodes.forEach((node) => markTextNode(node, terms, pieces, typed));
  // untouched input is returned exactly as given
  return holder.innerHTML === before ? html : holder.innerHTML;
}

// True when the highlighter would mark something in this plain text. The tags
// under a result are small and easy to miss: a chip that holds a typed word,
// whole or in part, is shown as a hit (SearchCard.vue).
export function holdsSearchWord(text, query) {
  if (typeof text !== "string" || !text) return false;
  const terms = searchWords(query);
  if (!terms.length) return false;
  const { pieces, typed } = cutters(terms);
  return text
    .split(pieces)
    .some((part) => rangesOf(part, terms, typed).length > 0);
}
