/* eslint-disable no-unused-vars */
/* https://github.com/jpmonette/feed */

import { Feed } from "feed";
import axios from "axios";
import fs from "fs-extra";
import xml from "xml";

const feed = new Feed({
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
    json: "https://agency.icjia.cloud/json",
    atom: "https://agency.icjia.cloud/atom",
  },
  author: {
    name: "Illinois Criminal Justice Information Authority",
    email: "cja.info@illinois.gov",
    link: "https://agency.icjia.cloud/",
  },
});

console.log(feed);

const init = async () => {
  console.log("init");
  //get posts from axios
  const posts = await axios.get("https://agency.icjia-api.cloud/posts");
  feed.addCategory("News & Information");
  posts.data.forEach((post) => {
    //console.log(post.splash.url);

    feed.addItem({
      title: post.title,
      id: `https://agency.icjia.cloud/news/${post.slug}`,
      link: `https://agency.icjia.cloud/news/${post.slug}`,
      description: post.summary,
      // content: post.body,
      date: new Date(post.published_at),
      image:
        post.splash && post.splash.url
          ? `https://agency.icjia-api.cloud${post.splash.url}`
          : null,
    });
  });

  await fs.writeFile("./public/feeds/rss2.xml", feed.rss2());
  await fs.writeFile("./public/feeds/atom.xml", feed.atom1());
  await fs.writeFile("./public/feeds/json1.json", feed.json1());
  //console.log(feed.rss2());
  // // Output: RSS 2.0

  //console.log(feed.atom1());
  // // Output: Atom 1.0

  //console.log(feed.json1());
  // // Output: JSON Feed 1.0
};

init();
// posts.forEach((post) => {
//   feed.addItem({
//     title: post.title,
//     id: post.url,
//     link: post.url,
//     description: post.description,
//     content: post.content,
//     author: [
//       {
//         name: "Jane Doe",
//         email: "janedoe@example.com",
//         link: "https://example.com/janedoe",
//       },
//       {
//         name: "Joe Smith",
//         email: "joesmith@example.com",
//         link: "https://example.com/joesmith",
//       },
//     ],
//     contributor: [
//       {
//         name: "Shawn Kemp",
//         email: "shawnkemp@example.com",
//         link: "https://example.com/shawnkemp",
//       },
//       {
//         name: "Reggie Miller",
//         email: "reggiemiller@example.com",
//         link: "https://example.com/reggiemiller",
//       },
//     ],
//     date: post.date,
//     image: post.image,
//   });
// });

// feed.addCategory("Technologie");

// feed.addContributor({
//   name: "Johan Cruyff",
//   email: "johancruyff@example.com",
//   link: "https://example.com/johancruyff",
// });

// console.log(feed.rss2());
// // Output: RSS 2.0

// console.log(feed.atom1());
// // Output: Atom 1.0

// console.log(feed.json1());
// // Output: JSON Feed 1.0
