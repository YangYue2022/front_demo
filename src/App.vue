<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="full-page">
    <RouterView />
  </div>
</template>

<style scoped>
.full-page {
  width: 100vw;  /* 设置宽度为视口的100% */
  height: 100vh; /* 设置高度为视口的100% */
  background-color: rgba(255, 255, 255, 0.95); /* 设置淡白色背景 */
  display: flex;
  justify-content: center; /* 如果有内容需要居中，可以使用 */
  align-items: center; /* 垂直居中 */
}
</style>
