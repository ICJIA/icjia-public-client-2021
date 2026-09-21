/* eslint-env mocha */
// =============================================================================
// When funding, a job or a meeting is over, and the chip that says so (v1.5.104)
// The front page's Funding and Employment lists mark an expired item with a
// chip that its template made red; app.css standardizes every chip to black on
// white (v1.5.9), so it was one more black outline. The chip is a desaturated
// red again, by a class the standardization leaves room for, and a meeting
// that is over carries the same chip, "Ended".
// One rule says when (src/utils/ended.js), on every page that asks: funding
// and jobs are open through their last day, to midnight in Chicago; a meeting
// is over when its end has passed.
// =============================================================================
import { expect } from "chai";
import fs from "fs";
import path from "path";
import { isMeetingOver, isPastLastDay } from "@/utils/ended";

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const hours = (n) => new Date(Date.now() + n * 3600000).toISOString();

// WCAG relative luminance and contrast of two #rrggbb colours.
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// A funding opportunity and a job end on a date with no time ("2026-09-25"),
// and are open through that day: they are over at the midnight that ends it in
// Chicago, wherever the visitor is. The site counted a day from the date read
// as UTC, so they expired at 7 pm in Chicago on their last day (6 pm in
// winter), five or six hours early.
describe("A funding opportunity or a job that is over", () => {
  const at = (iso) => new Date(iso);

  it("is open through its last day, to midnight in Chicago", () => {
    // 25 September 2026 is in daylight time: midnight is 05:00 UTC.
    expect(isPastLastDay("2026-09-25", at("2026-09-26T00:30:00Z"))).to.equal(
      false
    ); // 7:30 pm in Chicago on the last day: the old rule said expired
    expect(isPastLastDay("2026-09-25", at("2026-09-26T04:59:59Z"))).to.equal(
      false
    );
    expect(isPastLastDay("2026-09-25", at("2026-09-26T05:00:00Z"))).to.equal(
      true
    );
    expect(isPastLastDay("2026-09-25", at("2026-09-25T12:00:00Z"))).to.equal(
      false
    );
  });

  it("keeps to midnight across the clock changes", () => {
    // 1 November 2026: clocks go back. The midnight that ends 31 October is
    // still daylight time (05:00 UTC); the one that ends 1 November is not.
    expect(isPastLastDay("2026-10-31", at("2026-11-01T04:59:59Z"))).to.equal(
      false
    );
    expect(isPastLastDay("2026-10-31", at("2026-11-01T05:00:00Z"))).to.equal(
      true
    );
    expect(isPastLastDay("2026-11-01", at("2026-11-02T05:59:59Z"))).to.equal(
      false
    );
    expect(isPastLastDay("2026-11-01", at("2026-11-02T06:00:00Z"))).to.equal(
      true
    );
    // 8 March 2026: clocks go forward.
    expect(isPastLastDay("2026-03-07", at("2026-03-08T05:59:59Z"))).to.equal(
      false
    );
    expect(isPastLastDay("2026-03-07", at("2026-03-08T06:00:00Z"))).to.equal(
      true
    );
    expect(isPastLastDay("2026-03-08", at("2026-03-09T04:59:59Z"))).to.equal(
      false
    );
    expect(isPastLastDay("2026-03-08", at("2026-03-09T05:00:00Z"))).to.equal(
      true
    );
  });

  it("takes a moment by the day it falls on in Chicago, and no date as not over", () => {
    // 11:59 pm on 25 September in Chicago
    expect(
      isPastLastDay("2026-09-26T04:59:00.000Z", at("2026-09-26T04:59:30Z"))
    ).to.equal(false);
    expect(
      isPastLastDay("2026-09-26T04:59:00.000Z", at("2026-09-26T05:00:00Z"))
    ).to.equal(true);
    expect(isPastLastDay(undefined)).to.equal(false);
    expect(isPastLastDay(null)).to.equal(false);
    expect(isPastLastDay("")).to.equal(false);
    expect(isPastLastDay("soon")).to.equal(false);
  });
});

// A meeting's end is a moment, the time the meeting ends: it is over once that
// moment has passed.
describe("A meeting that is over", () => {
  it("is over once its end has passed, and not before", () => {
    expect(isMeetingOver({ start: hours(-3), end: hours(-1) })).to.equal(true);
    expect(isMeetingOver({ start: hours(-1), end: hours(1) })).to.equal(false);
    expect(isMeetingOver({ start: hours(24), end: hours(26) })).to.equal(false);
    const meeting = {
      start: "2026-09-14T17:00:00.000Z",
      end: "2026-09-14T18:30:00.000Z",
    }; // noon to 1:30 pm in Chicago
    expect(isMeetingOver(meeting, new Date("2026-09-14T18:29:59Z"))).to.equal(
      false
    );
    expect(isMeetingOver(meeting, new Date("2026-09-14T18:30:01Z"))).to.equal(
      true
    );
  });

  // One meeting in the index ends before it starts, and four end as they
  // start: the later of the two times is the one that counts.
  it("goes by the later of its two times, and by the one it has", () => {
    expect(isMeetingOver({ start: hours(2), end: hours(-2) })).to.equal(false);
    expect(isMeetingOver({ start: hours(-2), end: hours(-4) })).to.equal(true);
    expect(isMeetingOver({ start: hours(-2) })).to.equal(true);
    expect(isMeetingOver({ start: hours(2), end: null })).to.equal(false);
    expect(isMeetingOver({})).to.equal(false);
    expect(isMeetingOver({ start: "not a date" })).to.equal(false);
    expect(isMeetingOver(undefined)).to.equal(false);
  });
});

describe("The chip for something that is over", () => {
  const tabs = read("src/components/HomeTabbed.vue");
  const chips = tabs.match(/<v-chip\b[\s\S]*?<\/v-chip\s*>/g) || [];
  const chip = (label) =>
    chips.filter((c) => new RegExp(`>\\s*${label}\\s*<`).test(c));

  it("marks an expired funding opportunity and an expired job", () => {
    expect(chip("Expired").length).to.equal(2);
    chip("Expired").forEach((c) =>
      expect(c).to.match(/class="[^"]*\bchip-over\b/)
    );
  });

  it("marks a meeting that is over, unless it was cancelled", () => {
    expect(chip("Ended").length).to.equal(1);
    expect(chip("Ended")[0]).to.match(/class="[^"]*\bchip-over\b/);
    const row = tabs.slice(
      tabs.indexOf('v-for="(meeting, index) in meetings"')
    );
    expect(row.slice(0, row.indexOf("</v-card>"))).to.match(
      /v-if="!meeting\.isCancelled && isMeetingOver\(meeting\)"[\s\S]*?>\s*Ended\s*</
    );
  });

  // The class comes after the rules that make every chip black on white, which
  // it has to outrank at the same weight, and it keeps its red under the
  // pointer, where a standard chip turns black.
  it("is a red that white text can be read on, after the standard chip's rules", () => {
    const css = read("src/assets/app.css");
    const standard = css.indexOf(
      ".v-chip.v-chip:not(.white--text):focus-visible {"
    );
    const own = css.indexOf(".v-chip.v-chip.chip-over,");
    expect(standard, "the standard chip's rules").to.be.above(-1);
    expect(own, "the chip's own rule, after them").to.be.above(standard);
    const rule = css.slice(own, css.indexOf("}", own));
    expect(rule).to.include(".v-chip.v-chip.chip-over:hover");
    const fill = (rule.match(/background-color: (#[0-9a-f]{6}) !important;/) ||
      [])[1];
    const text = (rule.match(/(?<![-\w])color: (#[0-9a-f]{6}) !important;/) ||
      [])[1];
    expect(fill, "the fill").to.match(/^#[0-9a-f]{6}$/);
    expect(text, "the text colour").to.equal("#ffffff");
    expect(contrast(text, fill)).to.be.at.least(7);
  });
});

// Eight pages and cards each counted a day from the date read as UTC, and two
// of them did not count it at all: FundingAll listed a grant as current and
// as expired on its last day, and the related-content card marked funding
// expired the evening before its last day. They ask the one rule now.
describe("Pages that ask whether funding or a job is over", () => {
  const roots = ["src/components", "src/views"].map((d) =>
    path.join(process.cwd(), d)
  );
  const vueFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return vueFiles(full);
      return entry.name.endsWith(".vue") ? [full] : [];
    });

  it("do not count the day themselves", () => {
    const offenders = roots
      .flatMap(vueFiles)
      .filter((file) => /addOneDayToDate\(/.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(process.cwd(), file));
    expect(offenders).to.deep.equal([]);
  });

  it("ask the shared rule", () => {
    [
      "src/components/HomeTabbed.vue",
      "src/components/JobCard.vue",
      "src/components/BaseCardExpandable.vue",
      "src/components/SearchCardAlt.vue",
      "src/views/Grants/GrantsHome.vue",
      "src/views/Grants/FundingSingle.vue",
      "src/views/Grants/FundingAll.vue",
      "src/views/About/EmploymentAll.vue",
    ].forEach((file) => {
      const source = read(file);
      expect(source, file).to.include('from "@/utils/ended"');
      expect(source, file).to.match(/isPastLastDay\(/);
    });
  });
});
