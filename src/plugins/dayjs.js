// Shared Day.js instance with the plugins the site actually uses:
//   - utc              prerequisite for timezone
//   - timezone         moment-timezone replacement, Intl-backed
//   - relativeTime     fromNow() / toNow()
//   - advancedFormat   Do ordinals (e.g. "April 12th 2026")
//   - duration         dayjs.duration(ms).asDays() pattern used in card
//                      components to compute "days since published"
//
// Plugins are registered once here and the extended dayjs is re-exported
// so every consumer gets the same configured instance. The site is a
// single-timezone state agency (America/Chicago), so the tz default is
// set here too — callers that don't explicitly chain .tz() still get
// Chicago-anchored formatting.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import relativeTime from "dayjs/plugin/relativeTime";
import advancedFormat from "dayjs/plugin/advancedFormat";
import duration from "dayjs/plugin/duration";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(advancedFormat);
dayjs.extend(duration);

dayjs.tz.setDefault("America/Chicago");

export default dayjs;
