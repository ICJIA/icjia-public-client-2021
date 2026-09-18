/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import { renderToHtml } from "./utils/Markdown.mjs";
import {
  allRecords,
  plainTitle,
  newestItems,
  campaignLink,
  copyrightLine,
} from "./utils/feedItems.js";
const config = JSON.parse(fs.readFileSync("./src/config/config.json"));

let feed = new Feed({
  title: "ICJIA Funding Feed",
  description: "This is ICJIA's RSS funding feed.",
  id: config.api.baseClient + "/",
  link: config.api.baseClient + "/",
  language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: `${config.api.baseClient}/icjia-logo.png`,
  favicon: `${config.api.baseClient}/favicon.ico`,
  copyright: copyrightLine(),
  updated: new Date(), // optional, default = today
  generator: "Feed for Node.js", // optional, default = 'Feed for Node.js'
  feedLinks: {
    // The RSS file names itself (atom:link rel="self"), as the W3C validator
    // recommends.
    rss: config.api.baseClient + "/funding-rss2.xml",
    json: config.api.baseClient + "/funding-json1.json",
    atom: config.api.baseClient + "/funding-atom.xml",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: config.api.baseClient + "/",
  },
});

const init = async () => {
  const grants = await axios.get(allRecords(config.api.base, "grants"));
  const generateFullContent = (item) => {
    const body = renderToHtml(item.body);
    let attachments = "";
    // iterate through attachments
    if (item.attachments && item.attachments.length > 0) {
      attachments = "<div><h2>Attachments</h2><ul>";
      item.attachments.forEach((attachment) => {
        let attachmentUrl = `<li><a href="${config.api.base}${attachment.url}">${attachment.name}</a></li>`;
        attachments += attachmentUrl;
      });
      attachments += "</ul></div>";
    }
    return body + attachments;
  };
  grants.data.forEach((grant) => {
    feed.addItem({
      title: plainTitle(grant.title),
      id: `${config.api.baseClient}/grants/funding/${grant.slug}/`,
      link: campaignLink(
        `${config.api.baseClient}/grants/funding/${grant.slug}/`,
        "funding"
      ),
      description: renderToHtml(grant.summary),
      content: generateFullContent(grant),
      date: new Date(grant.start),
      image: `${config.api.baseClient}/icjia-logo.png`,
    });
  });

  feed.items = newestItems(feed.items);

  await fs.writeFile("./public/funding-rss2.xml", feed.rss2());
  await fs.writeFile("./public/funding-atom.xml", feed.atom1());
  await fs.writeFile("./public/funding-json1.json", feed.json1());

  console.log("RSS funding feeds generated.");
};

init();
