<template>
  <div class="fill-height" style="background-color: #f1f1f1">
    <v-row
      class="fill-height"
      align="center"
      justify="center"
      style="margin-top: -50px"
    >
      <v-card class="pt-1 pb-5 pl-3 pr-3" width="350px">
        <div class="text-center py-5">
          <h2>LOGIN</h2>
        </div>
        <v-form>
          <v-text-field
            prepend-icon="email"
            name="identifier"
            label="email"
            v-model="identifier"
            autocomplete="identifier"
            ref="identifier"
          ></v-text-field>
          <v-text-field
            prepend-icon="lock"
            name="password"
            label="password"
            :append-icon="e3 ? 'visibility' : 'visibility_off'"
            @click:append="() => (e3 = !e3)"
            :type="e3 ? 'password' : 'text'"
            v-model="password"
            autocomplete="password"
          ></v-text-field>
          <v-card-actions>
            <v-btn primary large block @click="login">Login</v-btn>
          </v-card-actions>

          <div
            class="text-center mt-5"
            style="color: red; font-size: 12px; font-weight: bold"
          >
            {{ $store.getters["auth/authStatus"] }}
          </div>
        </v-form>
      </v-card>
    </v-row>
  </div>
</template>

<script>
export default {
  created() {
    this.$store.dispatch("auth/logout");
  },

  mounted() {
    // console.log(this.$route.meta);
    // this.$nextTick(this.$refs.identifier.focus);
    // console.log(this.$myApp.config.underConstruction);
  },
  data() {
    return {
      identifier: "",
      password: "",
      e3: true,
      e4: true,
      sheet: true,
    };
  },
  computed: {},
  methods: {
    login() {
      let identifier = this.identifier.toLowerCase();
      let password = this.password;
      let payload = {};
      payload.identifier = identifier;
      payload.password = password;
      this.$store
        .dispatch("auth/login", payload)
        .then(() => {
          console.log("logged in");
          this.$router.push("/admin");
        })
        .catch((err) => console.log(err));
    },
  },
};
</script>

<style scoped>
.login-form {
  max-width: 500px;
}
a {
  color: #222;
}
</style>
