/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import _ from "lodash";

let feed = new Feed({
  title: "ICJIA Feed",
  description: "This is ICJIA's RSS feed!",
  id: "https://agency.icjia.cloud/",
  link: "https://agency.icjia.cloud/",
  language: "en", // optional, used only in RSS 2.0, possible values: http://www.w3.org/TR/REC-html40/struct/dirlang.html#langcodes
  image: "http://example.com/image.png",
  favicon: "http://example.com/favicon.ico",
  copyright:
    "All rights reserved 2021, Illinois Criminal Justice Information Authority",
  updated: new Date(), // optional, default = today
  generator: "Feed for Node.js", // optional, default = 'Feed for Node.js'
  feedLinks: {
    json: "https://agency.icjia.cloud/feeds/json1.json",
    atom: "https://agency.icjia.cloud/feeds/atom.xml",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: "https://agency.icjia.cloud/",
  },
});

//TODO: Render markdown for summary and body
const init = async () => {
  //console.log("init");
  //get posts from axios
  const posts = await axios.get("https://agency.icjia-api.cloud/posts");

  posts.data.forEach((post) => {
    //console.log(post.splash.url);
    let publicationDate =
      post.dateOverride && post.dateOverride.length
        ? post.dateOverride
        : post.published_at;
    feed.addItem({
      title: post.title,
      id: `https://agency.icjia.cloud/news/${post.slug}`,
      link: `https://agency.icjia.cloud/news/${post.slug}`,
      description: post.summary,
      // content: post.body,
      date: new Date(publicationDate),
      image:
        post.splash && post.splash.url
          ? `https://agency.icjia-api.cloud${post.splash.url}`
          : null,
    });
  });

  let sortedItems = _.sortBy(feed.items, "date").reverse();
  feed.items = sortedItems;

  await fs.writeFile("./public/feeds/rss2.xml", feed.rss2());
  await fs.writeFile("./public/feeds/atom.xml", feed.atom1());
  await fs.writeFile("./public/feeds/json1.json", feed.json1());

  console.log("RSS Feeds generated.");
};

init();
