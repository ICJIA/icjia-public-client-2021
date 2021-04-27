/* eslint-disable no-unused-vars */

const slug = require("slug");
const axios = require("axios");
const dotenv = require("dotenv").config();

let axiosConfig = {
  headers: {
    "Content-Type": "application/json",
  },
};

function titleCase(str) {
  str = str.toLowerCase().split(" ");
  for (var i = 0; i < str.length; i++) {
    str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
  }
  return str.join(" ");
}

(async function () {
  let { data } = await axios.get(process.env.MOCKAROO_POSTS_API);

  const posts = data.map((post) => {
    post.title = titleCase(post.title);
    post.splash = null;
    post.slug = slug(post.title);
    return post;
  });

  console.dir(posts);

  //   posts.forEach(async (post) => {
  //     let response = await axios.post(
  //       `${process.env.BASE_API}/posts`,
  //       JSON.stringify(post),
  //       axiosConfig
  //     );
  //     console.log(response.data);
  //   });

  // console.log(posts);
})();
