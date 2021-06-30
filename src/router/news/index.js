const news = [
  {
    path: "/news",
    name: "News",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/News/News.vue"),
  },
  {
    path: "/news/:slug",
    name: "NewsSingle",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/News/NewsSingle.vue"),
  },
];

export { news };
