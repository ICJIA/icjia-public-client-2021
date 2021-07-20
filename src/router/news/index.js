const news = [
  {
    path: "/news",
    name: "News",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/News/News.vue"),
  },
  {
    path: "/news/meetings/",
    name: "NewsMeetings",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/Meetings/MeetingsAll.vue"),
  },
  {
    path: "/news/events/",
    name: "NewsEvents",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/Events/EventsAll.vue"),
  },
  {
    path: "/news/funding/",
    name: "NewsFunding",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/Grants/FundingAll.vue"),
  },
  {
    path: "/news/employment",
    name: "ICJIAAllEmployment",
    // eslint-disable-next-line no-unused-vars

    component: () =>
      import(/* webpackChunkName: "hub" */ "@/views/About/EmploymentAll.vue"),
  },
  {
    path: "/news/:slug",
    name: "NewsSingle",
    component: () =>
      import(/* webpackChunkName: "news" */ "@/views/News/NewsSingle.vue"),
  },
];

export { news };
