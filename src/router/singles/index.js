const singles = [
  //   {
  //     path: "/adultredeploy/",
  //     redirect: () => {
  //       window.location.href = "https://icjia.illinois.gov/adultredeploy/";
  //       //   return '/redirecting' // not important since redirecting
  //     },
  //   },
  {
    path: "/i2i/",
    name: "i2i",
    component: () =>
      import(/* webpackChunkName: "i2i" */ "@/views/Singles/i2i.vue"),
  },
];

export { singles };
