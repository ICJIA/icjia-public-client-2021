<template>
  <div class="markdown-body page-form">
    <v-container :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm">
      <v-row>
        <v-col>
          <v-card class="py-5 px-5 mt-5">
            <v-container>
              <v-row>
                <v-col cols="12" class="text-center">
                  <h1 class="mb-6">Grant Status Request</h1>
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

              <!-- Required fields are stated before the form is sent. Fields
                   carry autocomplete tokens for personal details (WCAG 1.3.5),
                   and aria-invalid and aria-describedby point at a field's
                   error while it has one (fieldState, errorId). -->
              <v-container>
                <v-row>
                  <v-col cols="12" md="12">
                    <p class="mb-0">All fields are required.</p>
                  </v-col>
                  <v-col cols="12" md="12">
                    <v-select
                      :items="subjects"
                      label="Select Type of Request"
                      dense
                      v-model="subject"
                      class="heavy"
                      aria-label="Select Type of Request"
                      required
                      v-bind="fieldState('subject', subjectErrors)"
                      :error-messages="subjectErrors"
                      @input="$v.subject.$touch()"
                      @change="$v.subject.$touch()"
                      @blur="$v.subject.$touch()"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('subject')">{{ message }}</span>
                      </template>
                    </v-select>
                  </v-col>
                </v-row></v-container
              >

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
                      v-bind="fieldState('number', numberErrors)"
                      @input="$v.number.$touch()"
                      @blur="$v.number.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('number')">{{ message }}</span>
                      </template>
                    </v-text-field>
                  </v-col></v-row
                ></v-container
              >

              <v-container>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="firstName"
                      class="heavy"
                      :error-messages="firstNameErrors"
                      label="First Name"
                      aria-label="First Name"
                      autocomplete="given-name"
                      required
                      v-bind="fieldState('firstName', firstNameErrors)"
                      @input="$v.firstName.$touch()"
                      @blur="$v.firstName.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('firstName')">{{ message }}</span>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="lastName"
                      class="heavy"
                      :error-messages="lastNameErrors"
                      label="Last Name"
                      aria-label="Last Name"
                      autocomplete="family-name"
                      required
                      v-bind="fieldState('lastName', lastNameErrors)"
                      @input="$v.lastName.$touch()"
                      @blur="$v.lastName.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('lastName')">{{ message }}</span>
                      </template>
                    </v-text-field>
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
                      autocomplete="email"
                      required
                      v-bind="fieldState('email', emailErrors)"
                      @input="$v.email.$touch()"
                      @blur="$v.email.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('email')">{{ message }}</span>
                      </template>
                    </v-text-field>
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field
                      v-model="phone"
                      class="heavy"
                      :error-messages="phoneErrors"
                      label="Phone number"
                      autocomplete="tel"
                      required
                      v-bind="fieldState('phone', phoneErrors)"
                      @input="$v.phone.$touch()"
                      @blur="$v.phone.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('phone')">{{ message }}</span>
                      </template>
                    </v-text-field>
                  </v-col>
                </v-row>
              </v-container>

              <v-container>
                <v-row>
                  <v-col cols="12">
                    <!-- The instruction is a paragraph, tied to the field as
                         its description, and the field has a short label. As
                         the label it was one line that could not wrap: at
                         320 px only its first 198 of 509 px showed, and some
                         was lost at 200% zoom (WCAG 1.4.10, 1.4.4). -->
                    <p :id="instructionsId('comment')" class="mt-3 mb-2">
                      Please provide as much detail as possible about your grant
                      status request.
                    </p>
                    <v-textarea
                      v-model="comment"
                      auto-grow
                      filled
                      label="Request details"
                      rows="10"
                      @click="clearAxiosError"
                      ref="comment"
                      required
                      v-bind="
                        fieldState(
                          'comment',
                          commentErrors,
                          instructionsId('comment')
                        )
                      "
                      :error-messages="commentErrors"
                      @input="$v.comment.$touch()"
                      @change="$v.comment.$touch()"
                      @blur="$v.comment.$touch()"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('comment')">{{ message }}</span>
                      </template>
                    </v-textarea>
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

              <!-- After sending, focus moves to the confirmation, a status
                   message (WCAG 4.1.3). It replaces the Submit button, and
                   focus used to be lost with the button. -->
              <div
                v-if="!showSubmit"
                ref="successMessage"
                role="status"
                tabindex="-1"
                class="text-center"
                style="color: green"
              >
                {{ successMessage }}
              </div>
              <!-- Errors are announced as they appear (WCAG 4.1.3). Error text
                   is #b00020, 7.33:1 on white (WCAG 1.4.3). -->
              <div role="status">
                <div
                  v-if="showAxiosError"
                  style="color: #b00020; font-size: 14px"
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
                  style="color: #b00020; font-weight: bold"
                  class="mt-5 text-center"
                >
                  The form has errors.
                </div>
              </div>
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
import NProgress from "@/services/Progress";
import { EventBus } from "@/event-bus";

//const config = require("@/config.json");
// eslint-disable-next-line no-unused-vars
import axios from "axios";

export default {
  metaInfo: {
    title: "Grant Status Request",
  },
  mixins: [validationMixin],

  head() {
    return {};
  },
  mounted() {
    // EventBus.$emit("context-label", "Grant Status Request");
  },

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
      // In the words of the field's label, "Request details" (WCAG 3.3.1).
      !this.$v.comment.required && errors.push("Request details are required");
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
    // Validation state for a field's input: aria-invalid while it has an
    // error, and aria-describedby pointing at its instructions, if it has
    // any, and at its error message.
    fieldState(field, errors, instructions) {
      const describedBy = [instructions, errors.length && this.errorId(field)]
        .filter(Boolean)
        .join(" ");
      return {
        ...(errors.length ? { "aria-invalid": "true" } : {}),
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
      };
    },
    errorId(field) {
      return `grant-status-${field}-error`;
    },
    instructionsId(field) {
      return `grant-status-${field}-instructions`;
    },
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
      if (!this.isSuccess) {
        // Take the user to the first field that needs fixing.
        this.$nextTick(() => {
          const field = this.$el.querySelector('form [aria-invalid="true"]');
          if (field) field.focus();
        });
      }
      if (this.isSuccess) {
        NProgress.start();
        this.showLoader = true;

        this.form = {
          site: "ICJIA Public (https://icjia.illinois.gov/forms/grant-status)",
          type: "Grant Status Request",
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
      NProgress.done();
      this.reload();
    },
    success(res) {
      console.log("email: ", res);
      this.showSubmit = false;
      this.showAxiosError = false;
      this.showError = "";
      this.successMessage = res.data.msg;
      this.showLoader = false;
      NProgress.done();
      this.reload();
      this.$nextTick(() => {
        if (this.$refs.successMessage) this.$refs.successMessage.focus();
      });
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
      NProgress.done();
      this.reload();
    },
  },
};
</script>

<style></style>
