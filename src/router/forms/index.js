const forms = [
  {
    path: "/forms/lap-request/",
    name: "Sandbox",
    component: () =>
      import(/* webpackChunkName: "sandbox" */ "@/views/Forms/LapRequest.vue"),
  },
];

export { forms };
