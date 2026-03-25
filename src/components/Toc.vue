<template>
  <div
    class="toc"
    :class="{
      'pl-2': $vuetify.breakpoint.xs || $vuetify.breakpoint.xs,
      'pl-10':
        $vuetify.breakpoint.md ||
        $vuetify.breakpoint.lg ||
        $vuetify.breakpoint.xl,
      shaded: $vuetify.breakpoint.xs || $vuetify.breakpoint.xs,
    }"
    style=""
  >
    <h3
      style="
        margin-left: -3px;
        font-weight: bold;
        font-size: inherit;
        margin-top: 0;
      "
      ref="anchor"
      class="mb-4 hover"
      @click="$vuetify.goTo(0)"
      v-if="tocHeading.length"
    >
      {{ tocHeading | upperCase }}
    </h3>
    <div class="divider">
      <ul class="toc-list">
        <li
          v-for="(item, index) in toc"
          :key="index"
          @click="scrollTo(item.id)"
          class="tocListItem"
        >
          <span :id="`scrollTo-${item.id}`" class="tocItem">{{
            item.text
          }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      toc: [],
    };
  },
  props: {
    scrollOffset: {
      type: Number,
      default: 100,
    },
    selector: {
      type: String,
      default: "#scrollArea",
    },
    tocHeading: {
      type: String,
      default: "CONTENTS",
    },
    top: {
      type: String,
      default: "#baseContentTop",
    },
    mini: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    scrollTo(id) {
      //console.log(id);

      this.$vuetify.goTo(`#${id}`, { offset: 88 });
    },
    setToc() {
      this.$nextTick(() => {
        const sections = Array.from(document.querySelectorAll("h2"));
        sections.forEach((section) => {
          let obj = {};
          obj.text = section.innerText;
          obj.id = section.id;
          this.toc.push(obj);
        });
      });
    },
  },
  async mounted() {
    await this.setToc();
    var section = document.querySelectorAll("h2");
    if (section) {
      var sections = {};
      var i = 0;
      this.$refs["anchor"].classList.add("visible");
      section.forEach((e) => {
        sections[e.id] = e.offsetTop;
      });

      window.onscroll = () => {
        var scrollPosition =
          document.documentElement.scrollTop || document.body.scrollTop;
        scrollPosition = scrollPosition + this.scrollOffset + 35;
        const tocItems = document.querySelectorAll(".tocItem");
        //console.log(scrollPosition);
        if (scrollPosition < 150) {
          tocItems.forEach((toc) => {
            toc.classList.remove("visible");
          });
          this.$refs["anchor"].classList.add("visible");
        } else {
          this.$refs["anchor"].classList.remove("visible");
        }
        //console.log(scrollPosition);
        for (i in sections) {
          if (sections[i] <= scrollPosition) {
            const sectionItem = document.getElementById(`scrollTo-${i}`);

            tocItems.forEach((toc) => {
              toc.classList.remove("visible");
            });
            sectionItem.classList.add("visible");
          }
        }
      };
    }
  },
  beforeDestroy() {
    window.onscroll = () => {};
  },
};
</script>

<style>
.divider {
  border-left: 1px solid #ccc;
}

.visible {
  color: #0d4474;
  font-weight: bold;
}
.anchor {
  padding: 2px 5px 2px 5px;
}
.anchor:hover {
  color: #0d4474;
  background: #eee;
}

.shaded {
  background: #eee;
  padding: 15px;
  margin-bottom: 25px;
}

.toc {
  position: -webkit-sticky !important;
  position: sticky !important;
  top: 185px !important;
  font-size: 20px;
}

ul.toc-list {
  list-style-type: none;
}

ul.toc-list li {
  color: #333;

  padding: 2px 5px 2px 5px;
  cursor: pointer;
  margin-bottom: 3px;
  font-size: 14px;
}

ul.toc-list li:hover {
  color: #000;
  background: #eee;
}

.tocListItem {
  margin-left: -20px !important;
}

/* .tocItem {
} */
@media only screen and (max-width: 1024px) {
  /* .divider {
    border-left: 0px solid #ccc;
  } */

  ul.toc-list li:hover {
    color: #fff;
    background: #aaa;
  }
}
</style>
