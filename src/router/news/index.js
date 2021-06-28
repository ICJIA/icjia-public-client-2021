const news = [
  {
    path: "/news",
    name: "News",
    component: () => import(/* webpackChunkName: "news" */ "@/views/News.vue"),
  },
  {
    path: "/news/:slug",
    name: "NewsSingle",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/NewsSingle.vue"),
  },
];

export { news };
