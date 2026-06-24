// =============================================================================
// Vue filter tests (src/filters.js)
//
// Filters are registered globally via Vue.filter(name, fn); we retrieve each
// one back with the single-arg getter Vue.filter(name) and call it directly.
//
// Determinism notes:
//   - Date-only inputs ("2026-06-23") are parsed at LOCAL midnight by dayjs and
//     by the format() filter's offset-correction, so month/day/year/weekday
//     come out identical regardless of the machine timezone (CI runs in UTC).
//   - localTime() forces .tz("America/Chicago"), so a UTC ("...Z") input maps to
//     a fixed Chicago wall-clock time on any machine.
//   - The non-tz time filters (timeFormat, etc.) format in local time, so we
//     feed them a zoneless local timestamp ("...T13:30:00") — local-in/local-out
//     cancels and the result is machine-independent.
//   - Relative-time filters (fromNow/toNow) read "now"; with no sinon available
//     we assert their stable shape against a date decades in the past.
// =============================================================================
import { expect } from "chai";
import Vue from "vue";
import "@/filters"; // side-effect: registers all filters on the Vue singleton

// Helper: fetch a registered filter function by name.
const f = (name) => Vue.filter(name);

// ---------------------------------------------------------------------------
// format — "Month DD, YYYY" with timezone-offset correction (no dayjs)
// ---------------------------------------------------------------------------
describe("filter: format", () => {
  it("formats a date-only string as 'Month DD, YYYY'", () => {
    expect(f("format")("2026-06-23")).to.equal("June 23, 2026");
  });

  it("zero-pads single-digit days", () => {
    expect(f("format")("2026-03-05")).to.equal("March 05, 2026");
  });

  it("corrects the UTC-parse off-by-one (Jan 1 stays Jan 1, not Dec 31)", () => {
    // This is the whole reason the filter exists: a naive new Date("2026-01-01")
    // is UTC midnight and renders as the previous day in negative-offset zones.
    expect(f("format")("2026-01-01")).to.equal("January 01, 2026");
  });
});

// ---------------------------------------------------------------------------
// Text-case filters
// ---------------------------------------------------------------------------
describe("filter: titleCase", () => {
  it("capitalizes the first letter of each word", () => {
    expect(f("titleCase")("hello world")).to.equal("Hello World");
  });

  it("normalizes ALL-CAPS to title case", () => {
    expect(f("titleCase")("ICJIA REPORT")).to.equal("Icjia Report");
  });

  it("returns an empty string for empty input", () => {
    expect(f("titleCase")("")).to.equal("");
  });
});

describe("filter: upperCase / lowerCase", () => {
  it("upperCase uppercases", () => {
    expect(f("upperCase")("MixedCase")).to.equal("MIXEDCASE");
  });

  it("lowerCase lowercases", () => {
    expect(f("lowerCase")("MixedCase")).to.equal("mixedcase");
  });
});

// ---------------------------------------------------------------------------
// truncate — word-count limit with trailing ellipsis
// ---------------------------------------------------------------------------
describe("filter: truncate", () => {
  it("truncates to maxWords and appends an ellipsis", () => {
    expect(f("truncate")("one two three four five", 3)).to.equal(
      "one two three..."
    );
  });

  it("leaves text shorter than maxWords untouched (no ellipsis)", () => {
    expect(f("truncate")("one two", 5)).to.equal("one two");
  });

  it("does not append an ellipsis when the word count equals maxWords", () => {
    expect(f("truncate")("one two three", 3)).to.equal("one two three");
  });

  it("trims surrounding whitespace before counting words", () => {
    expect(f("truncate")("  hello world  ", 1)).to.equal("hello...");
  });
});

// ---------------------------------------------------------------------------
// truncateBySentence — keep the first N sentences
// ---------------------------------------------------------------------------
describe("filter: truncateBySentence", () => {
  it("keeps the first N sentences and drops the rest", () => {
    const out = f("truncateBySentence")("One. Two. Three.", 2);
    expect(out).to.match(/^One\.\s+Two\.$/);
    expect(out).to.not.include("Three");
  });

  it("appends moreText after the kept sentences", () => {
    expect(f("truncateBySentence")("One. Two. Three.", 1, " […]")).to.equal(
      "One. […]"
    );
  });

  it("returns the full text when there are exactly N sentences", () => {
    // The guard is `length > sentCount`, so an exact match is NOT truncated.
    expect(f("truncateBySentence")("One. Two.", 2)).to.equal("One. Two.");
  });

  it("returns the full text when there are fewer than N sentences", () => {
    expect(f("truncateBySentence")("Only one.", 2)).to.equal("Only one.");
  });

  it("returns the full text when no sentence punctuation is present", () => {
    expect(f("truncateBySentence")("No punctuation here", 2)).to.equal(
      "No punctuation here"
    );
  });
});

// ---------------------------------------------------------------------------
// dayjs date/time formatters — fed date-only or zoneless inputs (see header)
// ---------------------------------------------------------------------------
describe("filter: date formatters (dayjs, local)", () => {
  const D = "2026-06-23"; // a Tuesday

  it("month -> full month name", () => {
    expect(f("month")(D)).to.equal("June");
  });

  it("shortMonth -> abbreviated month", () => {
    expect(f("shortMonth")(D)).to.equal("Jun");
  });

  it("day -> day of month, no padding", () => {
    expect(f("day")(D)).to.equal("23");
  });

  it("yearFormat -> 4-digit year", () => {
    expect(f("yearFormat")(D)).to.equal("2026");
  });

  it("dayName -> weekday name", () => {
    expect(f("dayName")(D)).to.equal("Tuesday");
  });

  it("dateFormat -> 'MMMM DD, YYYY'", () => {
    expect(f("dateFormat")(D)).to.equal("June 23, 2026");
  });

  it("dateFormatShort -> 'MM/DD/YY'", () => {
    expect(f("dateFormatShort")(D)).to.equal("06/23/26");
  });

  it("dateFormatAlt -> 'MMM DD, YYYY'", () => {
    expect(f("dateFormatAlt")(D)).to.equal("Jun 23, 2026");
  });

  it("dateFormatFull -> 'dddd, MMM DD, YYYY'", () => {
    expect(f("dateFormatFull")(D)).to.equal("Tuesday, Jun 23, 2026");
  });
});

describe("filter: time formatters (dayjs)", () => {
  it("localTime converts a UTC instant to America/Chicago wall time", () => {
    // 18:30 UTC on Jun 23 is 13:30 CDT (UTC-5 during daylight time).
    expect(f("localTime")("2026-06-23T18:30:00Z")).to.equal("1:30 pm");
  });

  it("timeFormat -> 'h:mm a' in local time", () => {
    expect(f("timeFormat")("2026-06-23T13:30:00")).to.equal("1:30 pm");
  });

  it("timeDateFormat -> time + 'MMMM Do YYYY' with ordinal", () => {
    expect(f("timeDateFormat")("2026-06-23T13:30:45")).to.match(
      /^1:30:45 pm, June 23rd 2026\s*$/
    );
  });

  it("dateTimeFormat -> 'MM/DD/YY, h:mm:ss a'", () => {
    expect(f("dateTimeFormat")("2026-06-23T13:30:45")).to.match(
      /^06\/23\/26, 1:30:45 pm\s*$/
    );
  });
});

describe("filter: relative-time formatters (dayjs)", () => {
  const LONG_AGO = "2000-01-01";

  it("timeAgoFormat -> '… ago' for a past date", () => {
    expect(f("timeAgoFormat")(LONG_AGO)).to.match(/ago$/);
  });

  it("fromNow -> suffix-less distance (no 'ago')", () => {
    // The filter calls fromNow(true), which omits the suffix.
    const out = f("fromNow")(LONG_AGO);
    expect(out).to.match(/year/);
    expect(out).to.not.match(/ago/);
  });

  it("toNow -> 'in …' for a past date (inverse phrasing)", () => {
    expect(f("toNow")(LONG_AGO)).to.match(/^in .*year/);
  });
});

// ---------------------------------------------------------------------------
// sanitize — wraps contentSanitizer.sanitizeText (heavy logic tested in
// contentSanitizer.spec.js; here we just pin the wiring + string contract)
// ---------------------------------------------------------------------------
describe("filter: sanitize", () => {
  it("is registered and returns a string, preserving plain text", () => {
    const fn = f("sanitize");
    expect(fn).to.be.a("function");
    expect(fn("Hello world")).to.be.a("string");
    expect(fn("Hello world")).to.include("Hello");
  });
});
