// When a funding opportunity, a job or a meeting is over (v1.5.104).
//
// A funding opportunity and a job end on a date with no time ("2026-09-25")
// and are open through that day ("Accepting applications through September
// 25"): they are over at the midnight that ends it in Chicago, wherever the
// visitor is. Each page used to count a day from the date read as UTC
// (addOneDayToDate), which is 7 pm in Chicago on the last day, 6 pm in winter.
//
// A meeting's end is a moment, the time the meeting ends: it is over once that
// moment has passed.
import dayjs from "@/plugins/dayjs";

const ZONE = "America/Chicago";

// The Chicago day a value falls on: a date with no time is that day; a moment
// is the day it is in Chicago.
function chicagoDay(value) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim()))
    return value.trim();
  if (value === null || value === undefined || value === "") return null;
  const moment = dayjs(value);
  return moment.isValid() ? moment.tz(ZONE).format("YYYY-MM-DD") : null;
}

// True from the midnight that ends the last day, in Chicago. The next day is
// found by the calendar and its midnight read in Chicago, so the two days a
// year that are not 24 hours long are right too.
export function isPastLastDay(lastDay, now = new Date()) {
  const day = chicagoDay(lastDay);
  if (!day) return false;
  const next = dayjs.utc(day).add(1, "day").format("YYYY-MM-DD");
  return !dayjs(now).isBefore(dayjs.tz(next, ZONE));
}

// True once the meeting's end has passed. One meeting in the index ends before
// it starts, and a few have no end worth the name: the later of the two times
// counts, or the one there is.
export function isMeetingOver(meeting, now = new Date()) {
  const times = [meeting && meeting.start, meeting && meeting.end]
    .map((value) => (value ? new Date(value).getTime() : NaN))
    .filter((time) => !Number.isNaN(time));
  return times.length > 0 && new Date(now).getTime() > Math.max(...times);
}
