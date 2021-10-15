/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";
import { renderToHtml } from "./utils/Markdown.mjs";
const config = JSON.parse(fs.readFileSync("./src/config/config.json"));

let feed = new Feed({
  title: "ICJIA Funding Feed",
  description: "This is ICJIA's RSS funding feed.",
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
  const grants = await axios.get(`${config.api.base}/grants`);
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
      title: `<h2>${grant.title}</h2>`,
      id: `${config.api.baseClient}/grants/funding/${grant.slug}/`,
      link: `${config.api.baseClient}/grants/funding/${grant.slug}/`,
      description: renderToHtml(grant.summary),
      content: generateFullContent(grant),
      date: new Date(grant.start),
      image: `https://agency.icjia-api.cloud/uploads/state_seal_color_e3ae3b7180.png`,
    });
  });

  let sortedItems = _.sortBy(feed.items, "date").reverse();
  feed.items = sortedItems;

  await fs.writeFile("./public/funding-rss2.xml", feed.rss2());
  await fs.writeFile("./public/funding-atom.xml", feed.atom1());
  await fs.writeFile("./public/funding-json1.json", feed.json1());

  console.log("RSS funding feeds generated.");
};

init();
