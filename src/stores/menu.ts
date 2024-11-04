// stores/menuStore.ts
import { defineStore } from 'pinia'

export const useMenuStore = defineStore('menu', {
  state: () => ({
    activeMenu: '1', // 默认选中的菜单项
    activeRouter: '/index' // 默认选中的路由
  }),
  actions: {
    setActiveMenu(menuIndex: string, router: string) {
      this.activeMenu = menuIndex // 更新选中的菜单项
      this.activeRouter = router // 更新选中的路由
    },
    logout() {
      this.$reset();
    }
  },
  persist: true
})
