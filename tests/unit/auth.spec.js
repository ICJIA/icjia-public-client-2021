// =============================================================================
// Auth store module tests
// Validates Vuex auth mutations, getters, and logout action.
// Note: The auth module accesses localStorage at import time, so we must
// ensure a polyfill exists before importing.
// =============================================================================
import { expect } from "chai";

// Polyfill localStorage for the test environment (mochapack/jsdom may not have it)
if (typeof localStorage === "undefined") {
  const store = {};
  global.localStorage = {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, val) => {
      store[key] = String(val);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
}

// Import AFTER localStorage polyfill is in place
const authModule = require("@/store/modules/auth");
const { mutations, getters, actions } = authModule;

describe("Auth mutations", () => {
  describe("AUTH_LOGIN", () => {
    it("sets isAuthenticated to true", () => {
      const state = { isAuthenticated: null, jwt: null, userMeta: null };
      mutations.AUTH_LOGIN(state, {
        jwt: "test-token",
        userMeta: { email: "test@example.com" },
      });
      expect(state.isAuthenticated).to.be.true;
    });

    it("stores JWT token", () => {
      const state = { isAuthenticated: null, jwt: null, userMeta: null };
      mutations.AUTH_LOGIN(state, {
        jwt: "my-jwt-token",
        userMeta: { email: "test@example.com" },
      });
      expect(state.jwt).to.equal("my-jwt-token");
    });

    it("stores user metadata", () => {
      const state = { isAuthenticated: null, jwt: null, userMeta: null };
      const meta = { email: "test@example.com", username: "admin" };
      mutations.AUTH_LOGIN(state, { jwt: "token", userMeta: meta });
      expect(state.userMeta).to.deep.equal(meta);
    });
  });

  describe("AUTH_LOGOUT", () => {
    it("clears all auth state", () => {
      const state = {
        status: "active",
        jwt: "token",
        user: { id: 1 },
        isAuthenticated: true,
        userMeta: { email: "test@example.com" },
      };
      mutations.AUTH_LOGOUT(state);
      expect(state.status).to.be.null;
      expect(state.jwt).to.be.null;
      expect(state.user).to.be.null;
      expect(state.isAuthenticated).to.be.null;
      expect(state.userMeta).to.be.null;
    });
  });

  describe("SET_STATUS", () => {
    it("sets status message", () => {
      const state = { status: null };
      mutations.SET_STATUS(state, "Login failed");
      expect(state.status).to.equal("Login failed");
    });
  });

  describe("CLEAR_STATUS", () => {
    it("clears status to empty string", () => {
      const state = { status: "some error" };
      mutations.CLEAR_STATUS(state);
      expect(state.status).to.equal("");
    });
  });
});

describe("Auth getters", () => {
  describe("isLoggedIn", () => {
    it("returns true when JWT exists", () => {
      const state = { jwt: "some-token" };
      expect(getters.isLoggedIn(state)).to.be.true;
    });

    it("returns false when JWT is null", () => {
      const state = { jwt: null };
      expect(getters.isLoggedIn(state)).to.be.false;
    });

    it("returns false when JWT is empty string", () => {
      const state = { jwt: "" };
      expect(getters.isLoggedIn(state)).to.be.false;
    });
  });

  describe("authStatus", () => {
    it("returns current status", () => {
      const state = { status: "error message" };
      expect(getters.authStatus(state)).to.equal("error message");
    });
  });

  describe("userMeta", () => {
    it("returns user metadata", () => {
      const meta = { email: "admin@icjia.cloud", username: "admin" };
      const state = { userMeta: meta };
      expect(getters.userMeta(state)).to.deep.equal(meta);
    });

    it("returns null when no user", () => {
      const state = { userMeta: null };
      expect(getters.userMeta(state)).to.be.null;
    });
  });
});

describe("Auth actions", () => {
  describe("logout", () => {
    it("clears localStorage tokens", async () => {
      localStorage.setItem("jwt", "test-token");
      localStorage.setItem("userMeta", '{"email":"test@test.com"}');

      const committed = [];
      const commit = (type) => committed.push(type);
      const state = { jwt: "test-token" };

      await actions.logout({ commit, state });

      expect(localStorage.getItem("jwt")).to.be.null;
      expect(localStorage.getItem("userMeta")).to.be.null;
    });

    it("commits CLEAR_STATUS and AUTH_LOGOUT", async () => {
      const committed = [];
      const commit = (type) => committed.push(type);
      const state = {};

      await actions.logout({ commit, state });

      expect(committed).to.include("CLEAR_STATUS");
      expect(committed).to.include("AUTH_LOGOUT");
    });

    it("resolves with success message", async () => {
      const commit = () => {};
      const state = {};
      const result = await actions.logout({ commit, state });
      expect(result).to.equal("logged out successfully");
    });
  });
});
