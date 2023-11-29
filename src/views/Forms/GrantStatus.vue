<template>
  <div class="markdown-body page-form">
    <v-container :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm">
      <v-row>
        <v-col>
          <v-card class="py-5 px-5 mt-5">
            <v-container>
              <v-row>
                <v-col cols="12" class="text-center">
                  <h1 class="mb-6">Request Grant Status</h1>
                </v-col>
              </v-row>
            </v-container>
            <form style="margin-top: 0px">
              <!-- <v-container>
                <v-row>
                  <v-col cols="12">
                    <p>
                      Lorem markdownum famulus placere adulter, parabant deos,
                      exsaturanda natas, flumina primum tua nati Elateius.
                      Flectit pectora Trinacris o adverso viderat! Seque et fore
                      discedite agros, est Echo, nec luctu. Cocalus fugacibus in
                      tellus aniles vita sceptra? Deae et aspergine enim haesit
                      siqua quibus cratem et speciosoque. Coegi putas; i pelagi
                      poteras et resque dextra! Mitis modo fatalia, longa tibi,
                      mihi somni quamvis vivo libera pudorem reppulit ab.
                    </p>
                  </v-col>
                </v-row>
              </v-container> -->

              <v-container>
                <v-row>
                  <v-col cols="12" md="12">
                    <v-select
                      :items="subjects"
                      label="Select Type of Request"
                      dense
                      v-model="subject"
                      class="heavy"
                      aria-label="Select Type of Request"
                      :error-messages="subjectErrors"
                      @input="$v.subject.$touch()"
                      @change="$v.subject.$touch()"
                      @blur="$v.subject.$touch()"
                    ></v-select>
                  </v-col> </v-row
              ></v-container>

              <v-container
                ><v-row>
                  <v-col cols="12" md="12">
                    <v-text-field
                      v-model="number"
                      class="heavy"
                      :error-messages="numberErrors"
                      label="Grant Number"
                      aria-label="Grant Number"
                      required
                      @input="$v.number.$touch()"
                      @blur="$v.number.$touch()"
                      @click="clearAxiosError"
                    ></v-text-field> </v-col></v-row
              ></v-container>

              <v-container>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="firstName"
                      class="heavy"
                      :error-messages="firstNameErrors"
                      label="First Name"
                      aria-label="First Name"
                      required
                      @input="$v.firstName.$touch()"
                      @blur="$v.firstName.$touch()"
                      @click="clearAxiosError"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="lastName"
                      class="heavy"
                      :error-messages="lastNameErrors"
                      label="Last Name"
                      aria-label="Last Name"
                      required
                      @input="$v.lastName.$touch()"
                      @blur="$v.lastName.$touch()"
                      @click="clearAxiosError"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>

              <v-container>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="email"
                      class="heavy"
                      :error-messages="emailErrors"
                      label="E-mail"
                      aria-label="Email"
                      required
                      @input="$v.email.$touch()"
                      @blur="$v.email.$touch()"
                      @click="clearAxiosError"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="phone"
                      class="heavy"
                      :error-messages="phoneErrors"
                      label="Phone number"
                      aria-label="Phone"
                      required
                      @input="$v.phone.$touch()"
                      @blur="$v.phone.$touch()"
                      @click="clearAxiosError"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-container>

              <v-container>
                <v-row>
                  <v-col cols="12">
                    <v-textarea
                      v-model="comment"
                      auto-grow
                      filled
                      label="Please provide as much detail as possible about your grant status request."
                      rows="10"
                      class="mt-3"
                      @click="clearAxiosError"
                      ref="comment"
                      aria-label="Request"
                      :error-messages="commentErrors"
                      @input="$v.comment.$touch()"
                      @change="$v.comment.$touch()"
                      @blur="$v.comment.$touch()"
                    ></v-textarea>
                    <!-- <div v-if="formData">
                      {{ formData }}
                    </div> -->
                  </v-col>
                </v-row>
              </v-container>

              <div v-if="showSubmit" class="text-center">
                <v-btn @click="submit" dark color="blue darken-4">submit</v-btn>
                <v-btn @click="clear" class="ml-2">clear</v-btn>&nbsp;
                <span v-if="showLoader">
                  <v-progress-circular
                    indeterminate
                    aria-label="Progress bar: Loading"
                    color="primary"
                  ></v-progress-circular>
                </span>
              </div>

              <div v-if="!showSubmit" class="text-center" style="color: green">
                {{ successMessage }}
              </div>
              <div
                v-if="showAxiosError"
                style="color: red; font-size: 14px"
                class="mt-10 text-center"
              >
                <b style="font-size: 20px"
                  >ERROR: GRANT STATUS REQUEST NOT SENT</b
                >
                <br />
                <br />
                {{ axiosError }}
              </div>
              <div
                v-if="$v.$anyError"
                style="color: red; font-weight: bold"
                class="mt-5 text-center"
              >
                The form has errors.
              </div>
              .
            </form>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

import { validationMixin } from "vuelidate";
import { required, email } from "vuelidate/lib/validators";
import DOMPurify from "dompurify";
// import { generateHours } from "@/services/Utils";
import { dbInsert } from "@/services/Forms";
import NProgress from "nprogress";

//const config = require("@/config.json");
// eslint-disable-next-line no-unused-vars
import axios from "axios";

export default {
  mixins: [validationMixin],

  head() {
    return {};
  },
  mounted() {},

  validations: {
    firstName: { required },
    lastName: { required },
    subject: { required },
    number: { required },
    email: { required, email },
    phone: { required },

    comment: { required },
  },
  data() {
    return {
      subject: "",
      subjects: [
        "Contract status/updates",
        "Payment status/updates",
        "Documentation submission/request questions",
        "General program/grant questions",
        "Request for Technical Assistance",
      ],
      number: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      editor: "markdown",
      comment: "",

      form: null,
      showSubmit: true,
      showAxiosError: false,
      axiosError: "",
      showLoader: false,
      id: "",
      successMessage: "",
      isIE: null,
      units: null,
      render: false,
    };
  },
  computed: {
    title() {
      return "Grant Status Request";
    },

    permalink() {
      return null;
    },

    subjectErrors() {
      const errors = [];
      if (!this.$v.subject.$dirty) return errors;
      !this.$v.subject.required && errors.push("Type of request is required");
      return errors;
    },
    numberErrors() {
      const errors = [];
      if (!this.$v.number.$dirty) return errors;
      !this.$v.number.required && errors.push("Grant number is required.");
      return errors;
    },
    firstNameErrors() {
      const errors = [];
      if (!this.$v.firstName.$dirty) return errors;
      !this.$v.firstName.required && errors.push("First Name is required.");
      return errors;
    },
    lastNameErrors() {
      const errors = [];
      if (!this.$v.lastName.$dirty) return errors;
      !this.$v.lastName.required && errors.push("Last Name is required.");
      return errors;
    },
    emailErrors() {
      const errors = [];
      if (!this.$v.email.$dirty) return errors;
      !this.$v.email.email && errors.push("Must be valid e-mail");
      !this.$v.email.required && errors.push("E-mail is required");
      return errors;
    },

    commentErrors() {
      const errors = [];
      if (!this.$v.comment.$dirty) return errors;
      !this.$v.comment.required && errors.push("Comment is required");
      return errors;
    },

    phoneErrors() {
      const errors = [];
      if (!this.$v.phone.$dirty) return errors;
      !this.$v.phone.required && errors.push("Phone number is required");
      return errors;
    },

    // eslint-disable-next-line no-unused-vars
    isSuccess(v) {
      return !this.$v.$invalid && this.$v.$dirty;
    },
  },
  methods: {
    getFieldData(v) {
      this[v.refName] = v.value;
    },
    clearAxiosError() {
      return (this.showAxiosError = false);
    },
    async reload() {
      this.render = false;
      await this.$nextTick();
      this.render = true;
    },

    async submit() {
      this.$v.$touch();
      this.showAxiosError = false;
      if (this.isSuccess) {
        window.NProgress.start();
        this.showLoader = true;

        this.form = {
          site: "ICJIA Public (https://icjia.illinois.gov/forms/grant-status)",
          type: "Request Grant Status Information",
          subject: this.subject,
          number: DOMPurify.sanitize(this.number).replace(/(<([^>]+)>)/gi, ""),
          firstName: DOMPurify.sanitize(this.firstName).replace(
            /(<([^>]+)>)/gi,
            ""
          ),
          lastName: DOMPurify.sanitize(this.lastName).replace(
            /(<([^>]+)>)/gi,
            ""
          ),
          email: DOMPurify.sanitize(this.email).replace(/(<([^>]+)>)/gi, ""),
          phone: DOMPurify.sanitize(this.phone).replace(/(<([^>]+)>)/gi, ""),
          comment: DOMPurify.sanitize(this.comment).replace(
            /(<([^>]+)>)/gi,
            ""
          ),
        };
        console.log("Successful submit: ", this.form);
        let dbResponse = await dbInsert(this.form);
        console.log("dbinsert: ", dbResponse);

        let options = {
          method: "POST",
          data: this.form,
          url: "https://mail.icjia.cloud/internet/grant-status",
          headers: {
            "Content-Type": "application/json",
          },
        };

        try {
          let res = await axios(options);
          this.success(res);
          console.log("Email sent: ", res);
        } catch (err) {
          this.failed(err);
        }
      }
    },
    failed(res) {
      console.log("email failed: ", res);
      this.showAxiosError = true;
      this.axiosError = res;
      this.showLoader = false;
      window.NProgress.done();
      this.reload();
    },
    success(res) {
      console.log("email: ", res);
      this.showSubmit = false;
      this.showAxiosError = false;
      this.showError = "";
      this.successMessage = res.data.msg;
      this.showLoader = false;
      window.NProgress.done();
      this.reload();
    },
    clear() {
      this.$v.$reset();
      this.showSubmit = true;
      this.subject = null;
      this.number = null;
      this.firstName = null;
      this.lastName = null;
      this.phone = null;
      this.email = null;
      this.comment = "";
      this.showAxiosError = false;
      this.axiosError = "";
      this.showLoader = false;
      this.form = null;
      window.NProgress.done();
      this.reload();
    },
  },
};
</script>

<style></style>
