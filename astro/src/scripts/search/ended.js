// When funding, a job or a meeting is over: the live site's rule
// (src/utils/ended.js, v1.5.104), without dayjs. Funding and jobs are open
// through their last day, to midnight in Chicago; a meeting is over when its
// end (or its start, the later of the two) has passed.
const ZONE = "America/Chicago";

// "2026-09-25", the day in Chicago: a date alone as it is, a time in Chicago.
function chicagoDay(value) {
  if (value === null || value === undefined || value === "") return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(time));
}

// True from the midnight that ends the last day, in Chicago.
export function isPastLastDay(lastDay, now = new Date()) {
  const day = chicagoDay(lastDay);
  if (!day) return false;
  return chicagoDay(new Date(now).toISOString()) > day;
}

export function isMeetingOver(meeting, now = new Date()) {
  const times = [meeting && meeting.start, meeting && meeting.end]
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((time) => !Number.isNaN(time));
  return times.length > 0 && new Date(now).getTime() > Math.max(...times);
}
