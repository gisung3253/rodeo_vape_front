import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import axios from 'axios';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Sales from './pages/sales/index';
import Inventory from './pages/Inventory';
import Monthly from './pages/Monthly';
import Memo from './pages/Memo';
import InventoryManagement from './pages/InventoryManagement';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  useEffect(() => {
    // 토큰이 있으면 모든 axios 요청에 헤더 추가
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    // axios 응답 인터셉터 추가 - 401 오류(인증 실패) 처리
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          // 토큰이 유효하지 않으면 로그인 정보 삭제 후 로그인 페이지로 리다이렉트
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }, []);

  return (
    <Router>
      <Routes>
        {/* 공개 라우트 */}
        <Route path="/login" element={<Login />} />
        
        {/* 보호된 라우트 */}
        <Route element={<PrivateRoute />}>
          <Route path="/sales" element={<Layout><Sales /></Layout>} />
          <Route path="/inventory" element={<Layout><Inventory /></Layout>} />
          <Route path="/monthly" element={<Layout><Monthly /></Layout>} />
          <Route path="/memo" element={<Layout><Memo /></Layout>} />
          <Route path="/inventoryManagement" element={<Layout><InventoryManagement /></Layout>} />
        </Route>
        
        {/* 기본 경로 - 토큰 유무에 따라 리다이렉트 */}
        <Route path="/" element={
          localStorage.getItem('token') ?
          <Navigate to="/sales" /> :
          <Navigate to="/login" />
        } />

        {/* 404 페이지 - 없는 경로는 루트로 리다이렉트 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
