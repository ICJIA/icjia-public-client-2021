const forms = [
  {
    path: "/forms/lap-request/",
    name: "LAPRequest",
    component: () =>
      import(
        /* webpackChunkName: "laprequest" */ "@/views/Forms/LapRequest.vue"
      ),
  },
  {
    path: "/forms/grant-status/",
    name: "GrantStatusRequest",
    component: () =>
      import(
        /* webpackChunkName: "laprequest" */ "@/views/Forms/GrantStatus.vue"
      ),
  },
];

export { forms };
