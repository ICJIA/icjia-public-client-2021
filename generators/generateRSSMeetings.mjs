/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";
import { renderToHtml } from "./utils/Markdown.mjs";
const config = JSON.parse(fs.readFileSync("./src/config/config.json"));

let feed = new Feed({
  title: "ICJIA Meeting Feed",
  description: "This is ICJIA's RSS meeting feed.",
  id: config.api.baseClient + "/",
  link: config.api.baseClient + "/",
  language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: `https://agency.icjia.cloud/icjia-logo.png`,
  favicon: `${config.api.baseClient}/favicon.ico`,
  copyright:
    "All rights reserved 2021, Illinois Criminal Justice Information Authority",
  updated: new Date(), // optional, default = today
  generator: "Feed for Node.js", // optional, default = 'Feed for Node.js'
  feedLinks: {
    json: config.api.baseClient + "/meetings-json1.json",
    atom: config.api.baseClient + "/meetings-atom.xml",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: config.api.baseClient + "/",
  },
});

const init = async () => {
  const meetings = await axios.get(`${config.api.base}/meetings`);
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

  meetings.data.forEach((meeting) => {
    feed.addItem({
      title: `<h2>[${meeting.category.toUpperCase()}] ${meeting.title}</h2>`,
      id: `${config.api.baseClient}/news/meetings/${meeting.slug}/`,
      link: `${config.api.baseClient}/news/meetings/${meeting.slug}/`,
      description: renderToHtml(meeting.summary),
      content: generateFullContent(meeting),
      image: `https://agency.icjia-api.cloud/uploads/state_seal_color_e3ae3b7180.png`,
      date: new Date(meeting.end),
    });
  });

  let sortedItems = _.sortBy(feed.items, "date").reverse();
  feed.items = sortedItems;

  await fs.writeFile("./public/meetings-rss2.xml", feed.rss2());
  await fs.writeFile("./public/meetings-atom.xml", feed.atom1());
  await fs.writeFile("./public/meetings-json1.json", feed.json1());

  console.log("RSS meeting feeds generated.");
};

init();
