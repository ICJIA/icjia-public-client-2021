<template>
  <div
    class="home-splash"
    style="
      border-bottom: 1px solid #d8d8d8;
      margin-top: -15px;
      position: relative;
      height: 600px;
      overflow: hidden;
    "
  >
    <img
      src="/home-splash.jpg"
      alt=""
      role="presentation"
      width="1000"
      height="667"
      style="
        width: 100%;
        height: 600px;
        object-fit: cover;
        filter: grayscale(100%);
        display: block;
      "
    />
    <div
      style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(55, 90, 127, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <div
        class="px-10 pt-4 pb-7"
        style="
          width: 65%;
          background: rgba(100, 100, 100, 0.9);
          text-align: center;
        "
      >
        <div class="text-center px-5" style="min-width: 350px">
          <h1
            class="nofo-title mt-3"
            style="color: #fff; font-size: 24px; font-weight: bold"
          >
            Illinois Criminal Justice Information Authority
          </h1>
          <div class="nofo-tagline mt-4" style="font-size: 14px; color: #fff">
            Created in 1983, the Illinois Criminal Justice Information Authority
            (ICJIA) is a state agency dedicated to improving the administration
            of criminal justice. ICJIA works to ensure the criminal justice
            system in Illinois is efficient, effective, and equitable.
          </div>
          <div class="mt-7 hidden-md-and-up">
            <v-container>
              <v-row>
                <v-col>
                  <v-btn dark small color="#0d4474" to="/grants/"
                    >Apply for funding</v-btn
                  >
                </v-col>
                <v-col>
                  <v-btn
                    dark
                    small
                    color="#0d4474"
                    to="/forms/grant-status/"
                    class="splash-button py-0 ml-11"
                    >Grant Status Request
                  </v-btn>
                  <v-chip
                    class="ma-2"
                    style="
                      color: #fff;
                      background: purple;
                      margin-top: -19px !important;
                      margin-left: -14px !important;
                      padding-top: 3px;
                    "
                    x-small
                    >NEW!</v-chip
                  >
                </v-col>
              </v-row>
            </v-container>
          </div>
          <div class="hidden-sm-and-down mt-7">
            <v-btn
              dark
              small
              color="#0d4474"
              to="/grants/"
              class="splash-button mr-2"
              >Apply for funding</v-btn
            >
            <v-btn
              dark
              small
              color="#0d4474"
              to="/forms/grant-status/"
              class="splash-button py-0 ml-11"
              >Grant Status Request
            </v-btn>
            <v-chip
              class="ma-2"
              style="
                color: #fff;
                background: purple;
                margin-top: -19px !important;
                margin-left: -14px !important;
                padding-top: 3px;
              "
              x-small
              >NEW!</v-chip
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    slider: {
      type: Object,
      default: () => {},
    },
    buttons: {
      type: Array,
      default: () => [],
    },
  },
};
</script>

<style>
.heavy {
  font-weight: 900;
}

.splash-button:hover {
  color: #fff !important;
}
</style>
