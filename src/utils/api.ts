import axios from 'axios';

// 환경 변수에서 API URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_URL;
console.log('API URL:', API_BASE_URL);

// API 클라이언트 생성
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 - 401 오류 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;