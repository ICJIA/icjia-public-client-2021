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
  applyBy,
  campaignLink,
  copyrightLine,
} from "./utils/feedItems.js";
const config = JSON.parse(fs.readFileSync("./src/config/config.json"));

let feed = new Feed({
  title: "ICJIA Employment Feed",
  description: "This is ICJIA's RSS Employment feed.",
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
    rss: config.api.baseClient + "/employment-rss2.xml",
    json: config.api.baseClient + "/employment-json1.json",
    atom: config.api.baseClient + "/employment-atom.xml",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: config.api.baseClient + "/",
  },
});

const init = async () => {
  const jobs = await axios.get(allRecords(config.api.base, "jobs"));
  const generateFullContent = (item) => {
    const body = renderToHtml(item.body);
    // iterate through attachments
    let attachments = "";
    if (item.attachments && item.attachments.length) {
      attachments = "<div><h2>Attachments</h2><ul>";
      item.attachments.forEach((attachment) => {
        let attachmentUrl = `<li><a href="${config.api.base}${attachment.url}">${attachment.name}</a></li>`;
        attachments += attachmentUrl;
      });
      attachments += "</ul></div>";
    }
    return body + attachments;
  };

  jobs.data.forEach((job) => {
    feed.addItem({
      title: plainTitle(`[${job.category.toUpperCase()}] ${job.title}`),
      id: `${config.api.baseClient}/about/employment/${job.slug}/`,
      link: campaignLink(
        `${config.api.baseClient}/about/employment/${job.slug}/`,
        "employment"
      ),
      description: applyBy(job.end) + renderToHtml(job.summary),
      content: applyBy(job.end) + generateFullContent(job),
      // The posting date. It was the closing date, which dated a new posting
      // in the future.
      date: new Date(job.start || job.published_at),
      image: `${config.api.baseClient}/icjia-logo.png`,
    });
  });

  feed.items = newestItems(feed.items);

  await fs.writeFile("./public/employment-rss2.xml", feed.rss2());
  await fs.writeFile("./public/employment-atom.xml", feed.atom1());
  await fs.writeFile("./public/employment-json1.json", feed.json1());

  console.log("RSS employment feeds generated.");
};

init();
