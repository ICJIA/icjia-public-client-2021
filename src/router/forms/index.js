const forms = [
  {
    path: "/forms/lap-request/",
    name: "LAPRequest",
    component: () =>
      import(
        /* webpackChunkName: "laprequest" */ "@/views/Forms/LapRequest.vue"
      ),
  },
];

export { forms };
