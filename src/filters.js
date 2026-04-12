import Vue from "vue";
import dayjs from "@/plugins/dayjs";

import appConfig from "@/config/config.json";

Vue.filter("format", function (d) {
  var monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  function pad(n) {
    return n < 10 ? "0" + n : n;
  }
  const t = new Date(d);
  /**
   *
   * Timezone offset correction:
   * https://stackoverflow.com/questions/7556591/is-the-javascript-date-object-always-one-day-off/31732581#31732581
   *
   */
  const target = new Date(
    t.getTime() + Math.abs(t.getTimezoneOffset() * 60000)
  );
  const date = target.getDate();
  const month = target.getMonth();
  const year = target.getFullYear();
  //const monthDateYear = pad(month + 1) + '/' + pad(date) + '/' + year
  const dateWithFullMonthName =
    monthNames[month] + " " + pad(date) + ", " + year;
  return dateWithFullMonthName;
});

Vue.filter("titleCase", function (str) {
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
});

Vue.filter("upperCase", function (str) {
  return str.toUpperCase();
});

Vue.filter("lowerCase", function (str) {
  return str.toLowerCase();
});

Vue.filter("truncate", function (string, maxWords) {
  var strippedString = string.trim();
  var array = strippedString.split(" ");
  var wordCount = array.length;
  string = array.splice(0, maxWords).join(" ");

  if (wordCount > maxWords) {
    string += "...";
  }

  return string;
});

Vue.filter(
  "truncateBySentence",
  function (string, sentCount = 2, moreText = "") {
    //match ".","!","?" - english ending sentence punctuation
    // eslint-disable-next-line no-useless-escape
    var sentences = string.match(/[^\.!\?]+[\.!\?]+/g);
    if (sentences) {
      //console.log(sentences.length);
      if (sentences.length >= sentCount && sentences.length > sentCount) {
        //has enough sentences
        return sentences.slice(0, sentCount).join(" ") + moreText;
      }
    }
    //return full text if nothing else
    return string;
  }
);

Vue.filter("localTime", function (timestamp) {
  const tstamp = dayjs(timestamp);
  return tstamp.tz(appConfig.timezone).format("h:mm a");
});

Vue.filter("month", function (timestamp) {
  return dayjs(timestamp).format("MMMM");
});

Vue.filter("shortMonth", function (timestamp) {
  return dayjs(timestamp).format("MMM");
});

Vue.filter("day", function (timestamp) {
  return dayjs(timestamp).format("D");
});

Vue.filter("timeDateFormat", function (timestamp) {
  return dayjs(timestamp).format("h:mm:ss a, MMMM Do YYYY ");
});

Vue.filter("timeFormat", function (timestamp) {
  return dayjs(timestamp).format("h:mm a");
});

Vue.filter("dateTimeFormat", function (timestamp) {
  return dayjs(timestamp).format("MM/DD/YY, h:mm:ss a ");
});

Vue.filter("dateFormat", function (timestamp) {
  return dayjs(timestamp).format("MMMM DD, YYYY");
});

Vue.filter("dateFormatShort", function (timestamp) {
  return dayjs(timestamp).format("MM/DD/YY");
});

Vue.filter("dateFormatAlt", function (timestamp) {
  return dayjs(timestamp).format("MMM DD, YYYY");
});

Vue.filter("dateFormatFull", function (timestamp) {
  return dayjs(timestamp).format("dddd, MMM DD, YYYY");
});

Vue.filter("timeAgoFormat", function (timestamp) {
  return dayjs(timestamp).fromNow();
});

Vue.filter("yearFormat", function (timestamp) {
  return dayjs(timestamp).format("YYYY");
});

Vue.filter("dayName", function (timestamp) {
  return dayjs(timestamp).format("dddd");
});

Vue.filter("toNow", function (timestamp) {
  return dayjs(timestamp).toNow();
});

Vue.filter("fromNow", function (timestamp) {
  // Default tz (America/Chicago) is set once in @/plugins/dayjs.
  return dayjs(timestamp).fromNow(true);
});

// ── Content pipeline filter ──────────────────────────────────────
// Sanitize CMS text (titles, summaries) before display.
// Usage in templates:  {{ item.title | sanitize }}
import { sanitizeText } from "@/utils/contentSanitizer";
Vue.filter("sanitize", sanitizeText);
