/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";
import { renderToHtml } from "./utils/Markdown.mjs";
const config = JSON.parse(fs.readFileSync("./src/config/config.json"));

let feed = new Feed({
  title: "ICJIA News and Information Feed",
  description: "This is ICJIA's RSS news and information feed.",
  id: config.api.baseClient + "/",
  link: config.api.baseClient + "/",
  language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: `${config.api.baseClient}/icjia-logo.png`,
  favicon: `${config.api.baseClient}/favicon.ico`,
  copyright:
    "All rights reserved 2021, Illinois Criminal Justice Information Authority",
  updated: new Date(), // optional, default = today
  generator: "Feed for Node.js", // optional, default = 'Feed for Node.js'
  feedLinks: {
    json: config.api.baseClient + "/news-json1.json",
    atom: config.api.baseClient + "/news-atom.xml",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: config.api.baseClient + "/",
  },
});

const init = async () => {
  const posts = await axios.get(`${config.api.base}/posts`);
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
  posts.data.forEach((post) => {
    //console.log(post.splash.url);
    let publicationDate =
      post.dateOverride && post.dateOverride.length
        ? post.dateOverride
        : post.published_at;

    feed.addItem({
      title: post.title,
      id: `${config.api.baseClient}/news/${post.slug}/`,
      link: `${config.api.baseClient}/news/${post.slug}/`,
      description: renderToHtml(post.summary),
      content: generateFullContent(post),
      date: new Date(publicationDate),
      image:
        post.splash && post.splash.url
          ? `${config.api.base}${post.splash.url}`
          : null,
    });
  });

  let sortedItems = _.sortBy(feed.items, "date").reverse();
  feed.items = sortedItems;

  await fs.writeFile("./public/news-rss2.xml", feed.rss2());
  await fs.writeFile("./public/news-atom.xml", feed.atom1());
  await fs.writeFile("./public/news-json1.json", feed.json1());

  console.log("RSS news feeds generated.");
};

init();
