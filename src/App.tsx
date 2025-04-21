import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
