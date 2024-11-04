<script setup lang="ts">
import { useRouter } from 'vue-router';

//路由状态
const router = useRouter();
</script>
<template>
    <el-result icon="success" title="修改密码成功" sub-title="恭喜，修改密码成功">
        <template #extra>
            <el-button type="primary" @click="router.push('/login')">立即登陆</el-button>
        </template>
    </el-result>
</template>
<style scoped></style>