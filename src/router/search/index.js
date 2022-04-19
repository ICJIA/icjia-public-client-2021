const search = [
  {
    path: "/search",
    name: "Search1",
    component: () =>
      import(
        /* webpackChunkName: "search" */ "@/views/Search/SearchStatic.vue"
      ),
  },
  {
    path: "/search/:query",
    name: "Search2",
    component: () =>
      import(
        /* webpackChunkName: "search" */ "@/views/Search/SearchStatic.vue"
      ),
  },
];

export { search };
