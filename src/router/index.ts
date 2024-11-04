import {
  createRouter,
  createWebHistory,
} from 'vue-router';
import { useLoginStore } from '@/stores/login';
import MenuLayout from '@/layout/MenuLayout.vue'; 
import Login from '@/views/login/login.vue';
import Register from "@/views/register/register.vue";
import Home from '@/views/home/home.vue';
import File from '@/views/file/file.vue';
import Review from '@/views/review/review.vue';
import Request from '@/views/request/request.vue';
import MyApproval from '@/views/review/my_approval.vue';
import NotFound from '@/views/404.vue';
import ChangePassword from '@/views/change_password/index.vue';

// 声明元数据
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth: boolean
  }
}

// 路由信息
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/index',
    },
    {
      path: '/index',
      name: '系统主页',
      component: MenuLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          component: Home,
        },
        {
          path: 'file',
          name: '文件管理',
          component: File,
          meta: { requiresAuth: true },
        },
        {
          path: 'review',
          name: '审核管理',
          component: Review,
          meta: { requiresAuth: true },
        },
        {
          path:'request',
          name: '文件申请',
          component: Request,
          meta: { requiresAuth: true },
        },
        {
          path:'my_approval',
          name: '我的申请',
          component: MyApproval,
          meta: { requiresAuth: true },
        }
      ]
    },
    {
      path: '/login',
      name: '用户登陆',
      component: Login,
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: '用户注册',
      component: Register,
      meta: { requiresAuth: false },
    },
    {
      path: '/change_password',
      name: '修改密码',
      component: ChangePassword,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: '404',
      component: NotFound ,
      meta: { requiresAuth: false },
    },
  ]
});

// 添加路由的前置守卫
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    const loginStore = useLoginStore();
    if (!loginStore.isLogined()) {
      next('/login');
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
