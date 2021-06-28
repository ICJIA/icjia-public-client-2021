const fourOhFour = [
  {
    path: "*",
    name: "FourOhFour",
    component: () => import(/* webpackChunkName: '404' */ "@/views/404.vue"),
    meta: {},
  },
];

export { fourOhFour };
