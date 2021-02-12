<template>
  <Casio msg="Hello Vue 3 + Vite" />
</template>

<script lang="ts">
import { inspect } from "@xstate/inspect";

inspect({
  iframe: false,
});
import { defineComponent } from "vue";
import Casio from "./components/Casio.vue";

export default defineComponent({
  name: "App",
  components: {
    Casio,
  },
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
