// What the four feed generators share (v1.5.89). CommonJS, so the unit tests
// can load it; the generators (ES modules) import it by name.
//
// Strapi v3 answers a request with no parameters with 100 records, lowest id
// first. Asked that way, a collection with more than 100 records never puts a
// new one in its feed: the feeds were rebuilt on every deploy and said nothing
// new for years. The whole collection is requested, and the feed carries its
// newest items; a feed is for what is new, not the archive.
const FEED_SIZE = 50;

function allRecords(base, collection) {
  return `${base}/${collection}?_limit=-1`;
}

// A feed's title element is plain text: readers show markup as text.
function plainTitle(text) {
  return String(text || "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Newest first, at most FEED_SIZE. An item with no usable date is left out:
// the feed library throws on one, which would fail the site's build.
function newestItems(items, max = FEED_SIZE) {
  return items
    .filter(
      (item) => item.date instanceof Date && !Number.isNaN(item.date.getTime())
    )
    .sort((a, b) => b.date - a.date)
    .slice(0, max);
}

// A job's closing date, said in words at the top of the item: the item's date
// used to be the closing date, and is now the posting date.
function applyBy(end) {
  const date = new Date(end);
  if (!end || Number.isNaN(date.getTime())) return "";
  const text = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return `<p><strong>Apply by:</strong> ${text}</p>`;
}

module.exports = {
  FEED_SIZE,
  allRecords,
  plainTitle,
  newestItems,
  applyBy,
};
