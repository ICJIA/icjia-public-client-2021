<template>
  <div>
    {{ $myApp.menus.menu }}
    <!-- Simple menu display -- no need for recursion here -->
    <div v-for="(menu, index) in $myApp.menus.menu" :key="index">
      {{ menu.main }}

      <div
        v-for="(child, index) in menu.children"
        :key="`child-${index}`"
        class="ml-2"
      >
        <div v-if="child.divider"><v-divider></v-divider></div>
        <div v-if="child.section">{{ child.section }}</div>
        {{ child.title }}
      </div>
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped></style>
