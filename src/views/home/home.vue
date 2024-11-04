<template>
  <div class="full-page">
    <div class="flex items-center full-height">
      <div class="avatar-container">
        <img class="avatar" :src="avatar" alt="用户头像" />
      </div>
      <div class="user-info">
        <h2 class="greeting">
          你好，<span>{{ user }}</span>
        </h2>
        <p class="login-date">登录日期：{{ currentTime }}</p>
        <p class="soul-word">{{ soulWord }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { random } from 'lodash-es'
import dayjs from 'dayjs'
import { useLoginStore } from '@/stores/login'
import soulSoother from '@/assets/typings/home'
import avatar from '@/assets/icons/avatar.svg'

// 首页心灵鸡汤
const word = soulSoother[random(0, soulSoother.length - 1)]
const soulWord = ref(word)
const currentTime = ref(dayjs().format('YYYY-MM-DD'))

const userStore = useLoginStore()
const user = computed(() => userStore.username)
</script>

<style scoped>
/* 全屏页面样式 */
.full-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh; /* 让页面背景铺满整个视口高度 */
  width: 80vw; /* 让页面背景铺满整个视口宽度 */
  background-color: #f5f5f5; /* 设置背景颜色 */
  color: #000000; /* 设置字体颜色为黑色 */
}

/* 内容居中布局 */
.full-height {
  display: flex;
  flex-direction: row;
  align-items: center;
}

/* 头像容器样式 */
.avatar-container {
  width: 128px;
  height: 128px;
  margin-right: 40px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 用户信息样式 */
.user-info {
  padding: 0 20px;
  text-align: left;
}

.greeting {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  color: #000000; /* 字体颜色为黑色 */
}

.login-date,
.soul-word {
  color: #000000; /* 字体颜色为黑色 */
  padding-top: 16px;
  margin: 0;
}
</style>
