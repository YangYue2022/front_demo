import axios, { type AxiosResponse } from 'axios';
import { ElMessage } from 'element-plus';

import { useLoginStore } from '@/stores/login';

import router from '../router/index';

// 使用由库提供的配置的默认值来创建实例
// 此时超时配置的默认值是 `0`
const instance = axios.create({
    baseURL: 'http://localhost:8000'
    // baseURL:''
});

// 覆写库的超时默认值
// 现在，在超时前，所有请求都会等待 2.5 秒
instance.defaults.timeout = 3000;

//请求时需附加上token
// 添加请求拦截器
instance.interceptors.request.use(function (config) {
    // 在发送请求之前做些什么
    const loginStore = useLoginStore();
    config.headers.authorization = "Bearer " + loginStore.authorization;
    return config;
}, function (error) {
    // 对请求错误做些什么
    return Promise.reject(error);
});

//token过期拦截处理
instance.interceptors.response.use(function (response: AxiosResponse<any>) {
    return response;
}, function (error) {
    if (error.response.status == 401) {
        //提示登陆状态已失效，需要重新登陆
        ElMessage({
            message: '登陆状态已失效，请重新登陆',
            type: 'warning',
        });
        //自动转到登陆界面
        router.push('/login');
    }
    return Promise.reject(error);
});
export default instance;