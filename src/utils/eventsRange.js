// Time-range options + Strapi-3 `where` builders for the events page fetch.
//
// The events page used to fetch ALL events/meetings/jobs/grants (no date bound)
// and hide most of them client-side. This bounds the fetch IN THE QUERY: a
// `monthsBack` integer maps to a lower date bound (`end_gte`) so the API returns
// only the requested slice. monthsBack = 0 => current & ongoing only.
import dayjs from "@/plugins/dayjs";

const EVENT_RANGE_OPTIONS = [
  { label: "Current & ongoing", monthsBack: 0 },
  { label: "Past 6 months", monthsBack: 6 },
  { label: "Past 12 months", monthsBack: 12 },
  { label: "Past 18 months", monthsBack: 18 },
  { label: "Past 24 months", monthsBack: 24 },
];

// Lower bound (YYYY-MM-DD) for `end_gte`. monthsBack 0 => today; else today - N.
function sinceDate(monthsBack, now) {
  const base = now ? dayjs(now) : dayjs();
  const d = monthsBack > 0 ? base.subtract(monthsBack, "month") : base;
  return d.format("YYYY-MM-DD");
}

// Per-entity Strapi-3 `where` filters for GET_EVENTS.
function buildEventWheres(monthsBack, now) {
  const since = sinceDate(monthsBack, now);
  return {
    eventsWhere: { end_gte: since },
    meetingsWhere: { addToEventCalendar: true, end_gte: since },
    jobsWhere: { end_gte: since },
    grantsWhere: { end_gte: since },
  };
}

export { EVENT_RANGE_OPTIONS, sinceDate, buildEventWheres };
