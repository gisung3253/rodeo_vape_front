// src/components/PrivateRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = () => {
  const token = localStorage.getItem('token');
  
  // 토큰이 없으면 로그인 페이지로 리다이렉트
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // 토큰이 있으면 자식 컴포넌트 렌더링
  return <Outlet />;
};

export default PrivateRoute;