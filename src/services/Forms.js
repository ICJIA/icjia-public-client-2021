//import { EventBus } from "@/event-bus";
// import NProgress from "nprogress";
let axios = require("axios");

const api = axios.create({
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  window.NProgress.start();
  return config;
});

api.interceptors.response.use((response) => {
  window.NProgress.done();
  return response;
});

// eslint-disable-next-line no-unused-vars
const dbInsert = async function ({ type, ...form }) {
  let axiosHeaders = {
    headers: {
      "Content-Type": "application/json",
      //   Authorization: `Bearer ${jwt}`,
    },
  };
  let axiosDBSubmitData = {
    type,

    form,
  };
  try {
    return await api.post(
      `https://agency.icjia-api.cloud/forms`,
      JSON.stringify(axiosDBSubmitData),
      axiosHeaders
    );
  } catch (e) {
    console.log(e);

    return `${e}`;
  }
};

export { dbInsert };
