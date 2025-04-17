import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Navbar.css';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // 로그아웃 처리
    localStorage.removeItem('token');
    // axios 헤더에서 토큰 제거
    delete axios.defaults.headers.common['Authorization'];
    // 로그인 페이지로 이동
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>성서로데오전자담배</h1>
      </div>
      <ul className="navbar-menu">
        <li className={location.pathname === '/sales' ? 'active' : ''}>
          <Link to="/sales">판매장부</Link>
        </li>
        <li className={location.pathname === '/inventory' ? 'active' : ''}>
          <Link to="/inventory">재고확인</Link>
        </li>
        <li className={location.pathname === '/monthly' ? 'active' : ''}>
          <Link to="/monthly">월별매출</Link>
        </li>
        <li className={location.pathname === '/memo' ? 'active' : ''}>
          <Link to="/memo">메모</Link>
        </li>
        <li className={location.pathname === '/inventoryManagement' ? 'active' : ''}>
          <Link to="/inventoryManagement">재고수정</Link>
        </li>
      </ul>
      <div className="navbar-user">
        <div className="navbar-right">
          <button onClick={handleLogout} className="logout-button">
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;