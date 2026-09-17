<template>
  <div class="markdown-body page-form">
    <v-container :fluid="$vuetify.breakpoint.xs || $vuetify.breakpoint.sm">
      <v-row>
        <v-col>
          <v-card class="py-5 px-5 mt-5">
            <v-container>
              <v-row>
                <v-col cols="12" class="text-center">
                  <h1 class="mb-6">Language Access Request</h1>
                </v-col>
              </v-row>
            </v-container>
            <form style="margin-top: 0px">
              <v-container>
                <v-row>
                  <v-col cols="12">
                    <!-- <h2>Information:</h2> -->
                    <p>
                      ICJIA would like to ensure that it provides Limited
                      English Proficiency (LEP) individuals with meaningful and
                      universal access to ICJIA services, programs, and
                      activities by all persons, including those who
                      self-identify as an LEP individual or have a preference
                      for information and materials in a language other than
                      English. To support its goals of being inclusive and
                      accessible to all, ICJIA provides free language assistance
                      services to individuals whose primary language is not
                      English. Language assistance services include providing
                      qualified interpreters and translating documents to ease
                      access to important information about ICJIA programs,
                      benefits, and activities.
                    </p>
                    <!-- Required fields are stated before the form is sent.
                         Fields carry autocomplete tokens for personal details
                         (WCAG 1.3.5), and aria-invalid and aria-describedby
                         point at a field's error while it has one (fieldState,
                         errorId). -->
                    <p class="mb-0">All fields are required.</p>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col cols="12" md="12">
                    <v-text-field
                      v-model="name"
                      class="heavy"
                      :error-messages="nameErrors"
                      label="Name"
                      autocomplete="name"
                      required
                      v-bind="fieldState('name', nameErrors)"
                      @input="$v.name.$touch()"
                      @blur="$v.name.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('name')">{{ message }}</span>
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
                  <v-col cols="12" md="12">
                    <v-text-field
                      v-model="language"
                      class="heavy"
                      :error-messages="languageErrors"
                      label="Requested Language"
                      autocomplete="language"
                      required
                      v-bind="fieldState('language', languageErrors)"
                      @input="$v.language.$touch()"
                      @blur="$v.language.$touch()"
                      @click="clearAxiosError"
                    >
                      <template v-slot:message="{ message }">
                        <span :id="errorId('language')">{{ message }}</span>
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
                      Please provide as much detail as possible about your
                      language access request.
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
                  <b style="font-size: 20px">SUPPORT REQUEST NOT SENT</b>
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
import NProgress from "@/services/Progress";

//const config = require("@/config.json");
// eslint-disable-next-line no-unused-vars
import axios from "axios";

export default {
  metaInfo: {
    title: "Language Access Request",
  },
  mixins: [validationMixin],

  head() {
    return {};
  },
  mounted() {
    // this.units = this.$myApp.units.map((unit) => {
    //   let obj = {};
    //   obj.text = `${unit.title}`;
    //   obj.value = unit.title;
    //   return obj;
    // });
    // this.pickup_intervals = generateHours();
  },

  validations: {
    name: { required },
    email: { required, email },
    phone: { required },
    language: { required },
    comment: { required },
  },
  data() {
    return {
      name: "",
      email: "",
      phone: "",
      editor: "markdown",
      comment: "",
      language: "",
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
      return "Language Access Request";
    },

    permalink() {
      return null;
    },
    nameErrors() {
      const errors = [];
      if (!this.$v.name.$dirty) return errors;
      !this.$v.name.required && errors.push("Name is required.");
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
    languageErrors() {
      const errors = [];
      if (!this.$v.language.$dirty) return errors;
      !this.$v.language.required && errors.push("Language is required");
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
      return `lap-request-${field}-error`;
    },
    instructionsId(field) {
      return `lap-request-${field}-instructions`;
    },
    getFieldData(v) {
      //console.log("value: ", v);
      this[v.refName] = v.value;
      //console.log(this[v.refName]);
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
        // sanitize comment, then strip html
        const cleanComment = DOMPurify.sanitize(this.comment).replace(
          /(<([^>]+)>)/gi,
          ""
        );
        this.comment = cleanComment;
        this.form = {
          site: "ICJIA Public (https://icjia.illinois.gov)",
          type: "Language Access Plan Request",
          name: this.name,
          email: this.email,
          phone: this.phone,
          language: this.language,
          comment: this.comment,
        };

        let options = {
          method: "POST",
          data: this.form,
          url: "https://mail.icjia.cloud/internet/lap",
        };

        let dbResponse = await dbInsert(this.form);
        console.log("dbinsert: ", dbResponse);

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
      console.log("email: ", res);
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
      this.name = "";
      this.email = null;
      this.comment = "";
      this.language = "";
      this.showAxiosError = false;
      this.axiosError = "";
      this.showLoader = false;
      this.form = null;
      this.reload();
    },
  },
};
</script>

<style></style>
