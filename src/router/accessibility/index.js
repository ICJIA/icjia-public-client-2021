const accessibility = [
  {
    path: "/accessibility/",
    name: "Accessibility",
    component: () =>
      import(
        /* webpackChunkName: "accessibility" */ "@/views/Accessibility/Accessibility.vue"
      ),
  },
];

export { accessibility };
