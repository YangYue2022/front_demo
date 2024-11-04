<script setup lang="ts">
import { defineEmits, reactive, ref } from 'vue'

import type { AxiosError, AxiosResponse } from 'axios'
import type { FormInstance, FormRules } from 'element-plus'
import { ElLoading, ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useLoginStore } from '@/stores/login'

import api from '@/utils/api'

const loginStore = useLoginStore()

// 路由控制器
const router = useRouter()

//自定义事件
const emit = defineEmits(['next'])
// 表单数据
const account = reactive({
  username: loginStore.username,
  password: '',
  new_password: '',
})
//表单的实例
const formRef = ref()
//数据校验
const rules = reactive<FormRules<typeof account>>({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 15, message: '用户名长度必须在3到15个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
  ]
})

//提交表单
const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((isValid: boolean) => {
    if (!isValid) {
      return
    }
    //显示加载动画
    const loading = ElLoading.service({
      lock: true,
      text: '正在处理',
      background: 'rgba(0, 0, 0, 0.7)'
    })
    //请求接口，进行登陆
    api
      .put('/user/password', {
        username: account.username,
        password: account.password,
        new_password: account.new_password
      })
      .then((response: AxiosResponse<any>) => {
        // 检查 HTTP 状态码和响应中的 code
        if (response.status !== 200 || response.data.code !== 0) {
          // 显示来自后端的错误消息
          ElMessage.error(`处理失败: ${response.data.msg}`)
          return
        }
        // 成功后执行下一步
        emit('next', {
          account: account.username,
          password: account.password,
          new_password: account.new_password
        })
      })
      .catch((error: AxiosError<any>) => {
        // 处理错误响应
        if (error.response && error.response.data) {
          ElMessage.error(`操作异常：${error.response.data.msg}`)
        } else {
          ElMessage.error(`操作异常：${error.message}`)
        }
      })
      .finally(() => {
        loading.close() // 关闭加载动画
      })
  })
}
//取消
const cancel = () => {
  router.push('/login')
}
</script>

<template>
  <!-- 校验 -->
  <el-form
    ref="formRef"
    :model="account"
    :rules="rules"
    size="large"
    label-width="80"
    class="accountForm"
    status-icon
  >
    <el-form-item label="用户名：" prop="username">
      <el-input v-model="account.username" placeholder="请输入用户名" suffix-icon="UserFilled" />
    </el-form-item>
    <el-form-item label="密码：" prop="password">
      <el-input
        v-model="account.password"
        type="password"
        placeholder="请输入密码"
        suffix-icon="Lock"
      />
    </el-form-item>
    <el-form-item label="新密码：" prop="new_password">
      <el-input
        v-model="account.new_password"
        type="password"
        placeholder="请输入新密码"
        suffix-icon="Lock"
      />
    </el-form-item>

    <el-form-item label="">
      <div class="formBtns">
        <el-button type="danger" @click="cancel">取消</el-button>
        <el-button type="primary" @click="submitForm(formRef)"> 下一步 </el-button>
      </div>
    </el-form-item>
  </el-form>
</template>

<style scoped>
.accountForm {
  width: 50%;
  margin: 0 auto;
}

.accountForm .formBtns {
  margin: 0 auto;
}

.accountForm .formBtns .el-button {
  width: 150px;
}

.flex {
  display: flex;
  width: 100%;
}

.flex .flexItem {
  flex: 1;
}

.captchaPanel {
  width: 110px;
  padding-left: 10px;
}

.captchaPanel img {
  width: 100px;
  cursor: pointer;
}

.smscodePanel {
  width: 110px;
  padding-left: 10px;
}

.smscodePanel .el-button {
  width: 100px;
}
</style>
