<template>
  <el-container>
    <!-- 头部 -->
    <el-header>
      <div class="header-content">
        <div class="logo">文件管理系统</div>
        <el-dropdown class="user-dropdown">
          <span class="user-name">
            {{ store.username }} <el-icon><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              <el-dropdown-item @click="handlePasswordChange">修改密码</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 侧边菜单栏 -->
    <el-aside width="180px">
      <el-menu
        class="menu-container"
        :default-active="menuStore.activeMenu"
        :unique-opened="true"
        @select="handleMenuSelect"
      >
        <!-- 首页菜单项 -->
        <el-menu-item index="1" @click="handleMenuSelect('1', '/index')">
          <img src="@/assets/icons/home.svg" alt="首页" class="menu-icon" />
          首页
        </el-menu-item>

        <!-- 文件管理和审核管理子菜单 -->
        <el-sub-menu v-if="store.role.length > 0" index="2">
          <template #title>
            <img src="@/assets/icons/manage.svg" alt="管理" class="menu-icon" />
            <span>管理</span>
          </template>
          <el-menu-item index="2-1" @click="handleMenuSelect('2-1', '/index/file')">
            <img src="@/assets/icons/file.svg" alt="文件管理" class="menu-icon" />
            文件管理
          </el-menu-item>
          <el-menu-item index="2-2" @click="handleMenuSelect('2-2', '/index/review')">
            <img src="@/assets/icons/review.svg" alt="审核管理" class="menu-icon" />
            审核管理
          </el-menu-item>
        </el-sub-menu>

        <!-- 文件申请和我的申请子菜单 -->
        <el-sub-menu index="3">
          <template #title>
            <img src="@/assets/icons/user.svg" alt="用户" class="menu-icon" />
            <span>申请</span>
          </template>
          <el-menu-item index="3-1"  @click="handleMenuSelect('3-1', '/index/request')">
            <img src="@/assets/icons/file.svg" alt="文件申请" class="menu-icon" />
            文件申请
          </el-menu-item>
          <el-menu-item index="3-2"  @click="handleMenuSelect('3-2', '/index/my_approval')">
            <img src="@/assets/icons/review.svg" alt="我的申请" class="menu-icon" />
            我的申请
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-main>
      <router-view />
    </el-main>
  </el-container>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useLoginStore } from '@/stores/login'
import { useMenuStore } from '@/stores/menu' // 引入新的 menuStore

const router = useRouter()
const store = useLoginStore()
const menuStore = useMenuStore() // 使用 menuStore

// 处理菜单选中
const handleMenuSelect = (index: string, name: string) => {
  menuStore.setActiveMenu(index,name) // 更新菜单选中的状态
  router.push(name)
}

const handleLogout = () => {
  ElMessageBox.confirm('确认退出当前账户吗？', '提示', {
    type: 'warning'
  }).then(() => {
    store.logout()
    menuStore.logout()
    router.push('/login')
  })
}

const handlePasswordChange = () => {
  router.push('/change_password')
}

onMounted(() => {
  if (menuStore.activeRouter) {
    router.push(menuStore.activeRouter); // 根据存储的菜单状态导航
  }
});
</script>



<style scoped lang="scss">
.el-container {
  height: 100%;
}

.el-header {
  position: fixed;
  width: 100%;
  z-index: 1501;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #fff;
  background-color: #162746;
  padding: 0 20px;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
}

.logo {
  font-size: 20px;
}

.user-dropdown {
  margin-left: auto;
  cursor: pointer; /* 鼠标悬停时显示为可点击 */

  &:hover {
    background: none; /* 去掉悬浮时的背景 */
    border: none; /* 去掉悬浮时的边框 */
  }
}

.user-name {
  color: #fff; /* 设置用户名为白色 */
}

.el-aside {
  position: fixed;
  top: 60px;
  bottom: 0;
  z-index: 2000;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.menu-container {
  height: 100%;
}

.menu-icon {
  width: 20px;
  height: 20px;
  margin-right: 10px;
}

.el-main {
  margin-top: 60px;
  margin-left: 180px;
  height: calc(100% - 60px);
  padding: 0;
  transition: margin-left 0.3s ease-in-out;

  &.isCollapse {
    margin-left: 64px;
  }
}
</style>
