// Unit tests for the events time-range fetch helper (src/utils/eventsRange.js).
import { expect } from "chai";
import {
  EVENT_RANGE_OPTIONS,
  sinceDate,
  buildEventWheres,
} from "@/utils/eventsRange";

describe("eventsRange", () => {
  it("offers Current + 6/12/18/24 months, capped at 24", () => {
    expect(EVENT_RANGE_OPTIONS.map((o) => o.monthsBack)).to.deep.equal([
      0, 6, 12, 18, 24,
    ]);
    expect(EVENT_RANGE_OPTIONS[0].label).to.match(/current/i);
  });

  it("sinceDate(0) is the reference day (current & ongoing)", () => {
    expect(sinceDate(0, "2026-06-23")).to.equal("2026-06-23");
  });

  it("sinceDate(N) is N months earlier", () => {
    expect(sinceDate(6, "2026-06-23")).to.equal("2025-12-23");
    expect(sinceDate(24, "2026-06-23")).to.equal("2024-06-23");
  });

  it("buildEventWheres sets end_gte on events/jobs/grants", () => {
    const w = buildEventWheres(6, "2026-06-23");
    expect(w.eventsWhere).to.deep.equal({ end_gte: "2025-12-23" });
    expect(w.jobsWhere).to.deep.equal({ end_gte: "2025-12-23" });
    expect(w.grantsWhere).to.deep.equal({ end_gte: "2025-12-23" });
  });

  it("meetingsWhere keeps addToEventCalendar AND adds end_gte", () => {
    const w = buildEventWheres(0, "2026-06-23");
    expect(w.meetingsWhere).to.deep.equal({
      addToEventCalendar: true,
      end_gte: "2026-06-23",
    });
  });
});
