// Mixin that replicates vue-apollo's `apollo: {}` component option
// using the fetch-based client in @/gql-client. Registered globally
// in main.js; it's a no-op on components that don't declare
// `apollo: {}`, so the cost is one boolean check per component create.
//
// Supported per-key spec (matching vue-apollo shape in use on this site):
//   query:       string           — required
//   variables:   fn()->obj | obj  — optional
//   result:      fn(apolloResult) — optional; receives { data, graphQLErrors? }
//   error:       fn(err)          — optional; err has .message, .graphQLErrors?
//   fetchPolicy: "no-cache"       — optional; anything else is cached
//   prefetch:    boolean          — accepted for syntax parity; no-op
//                                   (vue-apollo used it for SSR, which
//                                   is off in this codebase)
//
// Reactive helpers exposed to templates (vue-apollo parity):
//   this.$apollo.loading — boolean, true while any query on this
//                          component is in flight. ~21 components on
//                          this site use it to drive loading spinners
//                          (e.g. :loading="$apollo.loading" on
//                          BaseContent). Unused vue-apollo surface
//                          ($apollo.queries/mutate/subscribe/skipAll)
//                          is not replicated — grep confirmed zero
//                          usages.

import Vue from "vue";
import { runQuery } from "@/gql-client";

export default {
  beforeCreate() {
    if (!this.$options.apollo) return;
    // Vue.observable makes the nested booleans reactive so templates
    // re-render when loading flips. Counter is kept non-reactive on the
    // instance to track multiple concurrent queries (e.g. Home fires
    // one root query today but the mechanism handles N).
    this.$apollo = Vue.observable({ loading: false });
    this._gqlPending = 0;
  },
  created() {
    const opts = this.$options.apollo;
    if (!opts) return;

    for (const key of Object.keys(opts)) {
      const spec = opts[key];
      if (!spec || !spec.query) continue;

      const variables =
        typeof spec.variables === "function"
          ? spec.variables.call(this)
          : spec.variables;

      this._gqlPending++;
      this.$apollo.loading = true;

      // Per-query endpoint override (vue-apollo `context.uri`) — used
      // by the 3 Hub views (Articles/Datasets/Apps) that hit the
      // researchhub GraphQL server instead of the default agency one.
      const endpoint = spec.context && spec.context.uri;

      runQuery(spec.query, variables, spec.fetchPolicy, endpoint)
        .then((result) => {
          if (typeof spec.result === "function") {
            spec.result.call(this, result);
          } else if (result.data && result.data[key] !== undefined) {
            // Default assignment — matches vue-apollo's behavior when
            // no result() handler is provided.
            this[key] = result.data[key];
          }
        })
        .catch((err) => {
          if (typeof spec.error === "function") {
            spec.error.call(this, err);
          } else {
            // eslint-disable-next-line no-console
            console.error("GraphQL error:", err.message);
          }
        })
        .finally(() => {
          this._gqlPending--;
          if (this._gqlPending <= 0) this.$apollo.loading = false;
        });
    }
  },
};
