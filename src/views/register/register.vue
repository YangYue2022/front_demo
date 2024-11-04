<script setup lang="ts">
import {
  reactive,
  ref,
} from 'vue';

//自组件的引入
import account from './components/account.vue';
import success from './components/success.vue';

//步骤条的进度
const step = ref(1);
//账号信息
const accountInfo = reactive({
    username: '',
    password: '',
});
//转到信息完善界面
const toInfo = (data: any) => {
    Object.assign(accountInfo, data);
    step.value = 2;
}
</script>

<template>
    <div class="registerPage">
        <el-card class="registerPanel">
            <!-- 步骤条 -->
            <el-steps class="registerStep" :active="step" align-center>
                <el-step title="账号验证" description="" />
                <el-step title="注册完成" description="" />
            </el-steps>
            <!-- 每一步的内容 -->
            <div class="registerContent">
                <!-- 账号校验 -->
                <account v-if="step === 1" @next="toInfo"></account>
               <!-- 注册完成 -->
                <success v-else></success>
            </div>
        </el-card>
        <div class="footer">@Copyright sfd文件管理系统 备案信息：京123123213</div>
    </div>
</template>

<style scoped>
.registerPage {
    display: flex;
    justify-content: center;
    justify-items: center;
    align-items: center;
    height: 100%;
    width: 80%;
}

.registerPage .registerPanel {
    width: 80%;
    height: 60%;
    max-width: 1024px;
    max-height: 800px;
    margin: 0 auto;
}

.registerPage .registerPanel .registerStep {
    width: 80%;
    margin: 0 auto;
    margin-top: 40px;
}

.registerPage .registerPanel .registerContent {
    margin-top: 40px;
}

.footer {
    position: fixed;
    bottom: 0px;
    line-height: 40px;
    text-align: center;
    font-size: 14px;
    color: #999;
}
</style>