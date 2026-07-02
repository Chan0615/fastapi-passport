import axios from 'axios';
import { message } from 'antd';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：自动注入 JWT 令牌
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：剥离 AxiosResponse，只返回 data；统一错误处理
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      if (window.location.pathname !== '/login') {
        message.error('登录已过期，请重新登录');
        window.location.href = '/login';
      }
    }
    const msg =
      error.response?.data?.detail ||
      error.message ||
      '请求失败';
    return Promise.reject(new Error(msg));
  }
);

const request = {
  get: <T = any>(url: string, config?: any): Promise<T> =>
    axiosInstance.get(url, config),
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    axiosInstance.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> =>
    axiosInstance.put(url, data, config),
  delete: <T = any>(url: string, config?: any): Promise<T> =>
    axiosInstance.delete(url, config),
};

export default request;
