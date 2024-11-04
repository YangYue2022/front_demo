import { defineStore } from 'pinia';

/**
 * 存储状态的处理
 */
export const useLoginStore = defineStore('loginStore', {
    state: () => {
        return {
            authorization: '',
            username: '',
            role: '',
            userId: ''
        }
    },
    actions: {
        /**
         * 更新登陆凭证
         */
        setToken(value: string) {
            this.authorization = value
        },
        /**
         * 检测当前是否已经登陆
         */
        isLogined(): boolean {
            return this.authorization ? true : false;
        },
        isAdmin(): boolean {  // 检测是否为管理员
            return this.role.includes('管理员');
        },
        isAuditor(): boolean {  // 检测是否为审核员
            return this.role.includes('审核员');
        },
        logout(){
            this.$reset();
        }
    },
    persist: true,
})