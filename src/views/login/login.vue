<script setup lang="ts">
import { reactive, ref } from 'vue'

import type { AxiosError, AxiosResponse } from 'axios'
import type { FormInstance, FormRules } from 'element-plus'
import { ElLoading, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import { useLoginStore } from '@/stores/login'
import api from '@/utils/api'

//登陆状态存储
const loginStore = useLoginStore()
//路由状态
const router = useRouter()

//登陆表单数据
const loginForm = reactive({
  username: '',
  password: ''
})
//校验规则
const rules = reactive<FormRules<typeof loginForm>>({
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输密码', trigger: 'blur' }]
})
//form表单的实例
const formRef = ref<FormInstance>()
/**
 * 提交
 */
const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((isValid: boolean) => {
    if (!isValid) {
      return
    }
    //显示加载动画
    const loading = ElLoading.service({
      lock: true,
      text: '正在登陆',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    // 请求接口，进行登录
    api
      .post('/login', {
        username: loginForm.username,
        password: loginForm.password
      })
      .then((response: AxiosResponse<any>) => {
        // 检查 API 返回的 code 字段
        if (response.data.code !== 0) {
          // 根据不同的错误码给出不同的反馈消息
          let message = '登录失败！'
          switch (response.data.code) {
            case 1001:
              message = '参数无效'
              break
            case 1009:
              message = '用户不存在'
              break
            case 1014:
              message = '密码错误'
              break
            case 1000:
              message = '服务繁忙，请稍后再试'
              break
          }
          ElMessage.error(message)
          return
        }

        // 存储 token 和其他登录信息
        loginStore.authorization = response.data.data.token
        loginStore.username = response.data.data.username
        loginStore.role = response.data.data.role
        loginStore.userId = response.data.data.id

        // 登录成功后跳转到首页
        router.push('/index')
      })
      .catch((error: AxiosError<any>) => {
        // 处理网络或其他错误
        if (error.response && error.response.data && error.response.data.msg) {
          ElMessage.error(`操作异常：${error.response.data.msg}`)
        } else {
          ElMessage.error(`操作异常：${error.message}`)
        }
      })
      .finally(() => {
        // 关闭加载动画
        loading.close()
      })
  })
}
</script>

<template>
  <div class="loginPage">
    <el-card class="loginPanel">
      <div class="loginPanelInner">
        <div class="logo">
          <img src="../../assets/images/logo.jpg" />
        </div>
        <el-divider direction="vertical" border-style="dashed" class="split" />
        <div class="loginForm">
          <div class="systemName">用户登陆</div>
          <el-form
            ref="formRef"
            size="large"
            :model="loginForm"
            status-icon
            :rules="rules"
            label-width="120px"
            class="form"
          >
            <el-form-item label="账号：" prop="username">
              <el-input
                v-model="loginForm.username"
                placeholder="请输入账号"
                autocomplete="off"
                suffix-icon="UserFilled"
              />
            </el-form-item>
            <el-form-item label="密码：" prop="password">
              <el-input
                v-model="loginForm.password"
                placeholder="请输入密码"
                type="password"
                autocomplete="off"
                suffix-icon="Lock"
              />
            </el-form-item>
            <div class="registerBtn">
              <router-link to="/register" class="register-link"> 去账户？点击注册 </router-link>
            </div>
            <el-form-item>
              <el-button type="primary" @click="submitForm(formRef)" class="loginBtn">
                登陆
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-card>
    <div class="footer">@Copyright sfd文件管理系统 备案信息：京123123123</div>
  </div>
</template>

<style scoped>
.loginPage {
  width: 100%;
  height: 100%;
  display: flex;
  justify-items: center;
  justify-content: center;
  align-items: center;
  background: linear-gradient(133deg, #1994bb, #19acbb, #19b4bb, #2a89db);
}

.loginPage .loginPanel {
  width: 60%;
  height: 60%;
  min-width: 600px;
  max-width: 1000px;
  min-height: 400px;
  max-height: 500px;
  margin: 0 auto;
}

.loginPage .loginPanel:deep(.el-card__body) {
  width: 100%;
  height: 100%;
}

.loginPage .loginPanel .loginPanelInner {
  width: 100%;
  height: 100%;
  display: flex;
}

.loginPage .loginPanel .loginPanelInner .logo {
  width: 40%;
  text-align: center;
  display: flex;
  justify-items: center;
  justify-content: center;
  align-items: center;
}

.loginPage .loginPanel .loginPanelInner .logo img {
  width: 50%;
}

.loginPage .loginPanel .loginPanelInner .split {
  height: calc(100% - 40px);
}

.loginPage .loginPanel .loginPanelInner .loginForm {
  flex: 1;
}

.loginPage .loginPanel .loginPanelInner .loginForm .systemName {
  text-align: center;
  font-size: 30px;
  line-height: 60px;
  letter-spacing: 3px;
  margin-bottom: 20px;
}

.loginPage .loginPanel .loginPanelInner .loginForm .form {
  width: 80%;
}

.loginPage .loginPanel .loginPanelInner .loginForm .form .loginBtn {
  width: 100%;
}

.loginPage .loginPanel .loginPanelInner .loginForm .form .registerBtn {
  text-align: right;
  line-height: 40px;
  margin-bottom: 5px;
}

.footer {
  position: fixed;
  bottom: 0px;
  line-height: 40px;
  text-align: center;
  font-size: 14px;
  color: #fff;
}
</style>
