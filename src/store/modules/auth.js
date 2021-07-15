/* eslint-disable no-unused-vars */
import config from "@/config/config.json";
import axios from "axios";
// import { ApolloClient } from "apollo-client";
// import { onLogout } from "@/vue-apollo";

const namespaced = true;

const state = {
  status: null,
  authError: null,
  errorMsg: null,
  jwt: localStorage.getItem("jwt") || null,
  userMeta: JSON.parse(localStorage.getItem("userMeta")) || null,
  user: null,
  isAuthenticated: null,
};

const mutations = {
  AUTH_LOGOUT(state) {
    state.status = null;
    state.jwt = null;
    state.user = null;
    state.isAuthenticated = null;
    state.userMeta = null;
    console.log("AUTH_LOGOUT");
  },
  AUTH_LOGIN(state, payload) {
    state.isAuthenticated = true;
    state.jwt = payload.jwt;
    state.userMeta = payload.userMeta;
    console.log("AUTH_LOGIN");
  },
  CLEAR_STATUS(state) {
    state.status = "";
    console.log("CLEAR_STATUS");
  },
  SET_STATUS(state, message) {
    state.status = message;
    console.log("SET_STATUS:", message);
  },
};

const actions = {
  // eslint-disable-next-line no-unused-vars
  logout({ commit, state }) {
    commit("CLEAR_STATUS");
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      //onLogout(ApolloClient);
      localStorage.removeItem("jwt");
      localStorage.removeItem("userMeta");
      delete axios.defaults.headers.common["Authorization"];
      commit("AUTH_LOGOUT");
      resolve("logged out successfully");
    });
  },
  login({ commit }, payload) {
    commit("CLEAR_STATUS");
    return new Promise((resolve, reject) => {
      axios({
        url: `${config.api.base}${config.api.login}`,
        data: payload,
        method: "POST",
        timeout: `${config.api.timeout}`,
      })
        .then((resp) => {
          const jwt = resp.data.jwt;
          const userMeta = resp.data.user;
          localStorage.setItem("jwt", jwt);
          localStorage.setItem("userMeta", JSON.stringify(userMeta));
          axios.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;
          let payload = {
            jwt,
            userMeta,
          };
          commit("AUTH_LOGIN", payload);

          resolve(resp);
        })
        .catch((err) => {
          let message;

          try {
            message = JSON.parse(
              JSON.stringify(
                err.response.data.message[0]["messages"][0]["message"]
              )
            );
          } catch {
            message = "NETWORK ERROR: Cannot access the API";
          }

          commit("SET_STATUS", `${message}`);
          reject(err);
        });
    });
  },
};

const getters = {
  isLoggedIn: (state) => !!state.jwt,
  authStatus: (state) => state.status,
  userMeta: (state) => state.userMeta,
};

export { namespaced, state, mutations, actions, getters };
