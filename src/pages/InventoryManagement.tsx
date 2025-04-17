import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../styles/InventoryManagement.css';

// 제품 타입 정의 (회사명 제거)
interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

// 모달 유형 정의
type ModalType = 'add' | 'edit' | 'delete' | null;

// 환경변수에서 API URL 가져오기
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

// API 호출에 사용할 axios 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
});

// 요청 보내기 전에 토큰 추가하는 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function InventoryManagement() {
  // 상품 목록 상태
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  
  // 검색 및 필터링 상태
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  // 모달 관련 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  
  // 로딩 및 에러 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 새 상품 또는 수정된 상품 정보
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    category: '',
    price: 0,
    quantity: 0
  });
  
  // 모달 외부 클릭 감지를 위한 ref
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 카테고리 목록
  const [categories, setCategories] = useState<string[]>([]);
  
  // 재고 부족 기준 설정 함수
  const isLowStock = (item: InventoryItem): boolean => {
    if (item.category === "코일팟") {
      return item.quantity <= 10;
    } else {
      return item.quantity <= 5;
    }
  };
  
  // 카테고리 목록 가져오기
  const fetchCategories = async () => {
    try {
      const response = await api.get('/api/inventory-manage/categories');
      setCategories(response.data);
    } catch (err: any) {
      console.error('카테고리 조회 오류:', err);
    }
  };
  
  // 모든 재고 항목 가져오기
  const fetchInventoryItems = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/inventory-manage');
      setInventoryItems(response.data);
      setError(null);
    } catch (err: any) {
      console.error('재고 목록 조회 오류:', err);
      setError('재고 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchCategories(); // 고정된 카테고리 목록 로드
    fetchInventoryItems();
    
    // 모달 외부 클릭 이벤트 처리
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        closeModal();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // 재고 부족 상품 필터링
  const lowStockItems = inventoryItems.filter(item => isLowStock(item));
  
  // 카테고리별, 검색어별 필터링
  const filteredItems = inventoryItems.filter(item => {
    // 카테고리 필터링
    if (activeCategory === "low-stock") {
      if (!isLowStock(item)) return false;
    } else if (activeCategory !== "all" && item.category !== activeCategory) {
      return false;
    }
    
    // 검색어 필터링
    if (searchTerm) {
      return item.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    
    return true;
  });
  
  // 모달 열기
  const openModal = (type: ModalType, item?: InventoryItem) => {
    setModalType(type);
    
    if (item) {
      setSelectedItem(item);
      setFormData({
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: item.quantity
      });
    } else {
      setSelectedItem(null);
      setFormData({
        name: '',
        category: '',
        price: 0,
        quantity: 0
      });
    }
  };
  
  // 모달 닫기
  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
  };
  
  // 폼 입력값 변경 처리
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'quantity' ? Number(value) : value
    }));
  };
  
  // 신규 물품 추가
  const handleAddItem = async () => {
    try {
      await api.post('/api/inventory-manage/item', formData);
      await fetchInventoryItems();
      closeModal();
      alert('새 상품이 추가되었습니다.');
    } catch (err: any) {
      console.error('상품 추가 오류:', err);
      alert(err.response?.data?.error || '상품 추가에 실패했습니다.');
    }
  };
  
  // 재고 변경
  const handleUpdateItem = async () => {
    if (!selectedItem) return;
    try {
      await api.put(`/api/inventory-manage/item/${selectedItem.id}`, formData);
      await fetchInventoryItems();
      closeModal();
      alert('상품 정보가 수정되었습니다.');
    } catch (err: any) {
      console.error('상품 수정 오류:', err);
      alert(err.response?.data?.error || '상품 수정에 실패했습니다.');
    }
  };
  
  // 재고 삭제
  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    try {
      await api.delete(`/api/inventory-manage/item/${selectedItem.id}`);
      await fetchInventoryItems();
      closeModal();
      alert('상품이 삭제되었습니다.');
    } catch (err: any) {
      console.error('상품 삭제 오류:', err);
      alert(err.response?.data?.error || '상품 삭제에 실패했습니다.');
    }
  };
  
  return (
    <div className="inventory-management-container">
      <h2 className="page-title">재고관리</h2>
      
      {/* 오류 메시지 표시 */}
      {error && <div className="error-message">{error}</div>}
      
      {/* 상단 컨트롤 영역 */}
      <div className="management-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="상품명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button 
          className="add-item-button"
          onClick={() => openModal('add')}
          disabled={isLoading}
        >
          신규 물품 추가 +
        </button>
      </div>
      
      {/* 카테고리 탭 - 고정된 순서로 표시 */}
      <div className="category-tabs">
        <button
          key="all"
          className={`category-tab ${activeCategory === 'all' ? 'active' : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          전체
        </button>
        
        {/* 카테고리 목록을 고정된 순서대로 표시 */}
        {categories.map(category => (
          <button
            key={category}
            className={`category-tab ${activeCategory === category ? 'active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
        
        <button
          key="low-stock"
          className={`category-tab warning-tab ${activeCategory === 'low-stock' ? 'active' : ''}`}
          onClick={() => setActiveCategory('low-stock')}
        >
          재고부족
          <span className="badge">{lowStockItems.length}</span>
        </button>
      </div>
      
      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="loading-message">데이터를 불러오는 중입니다...</div>
      ) : (
        /* 재고 테이블 */
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>분류</th>
                <th>상품명</th>
                <th>가격</th>
                <th>현재 재고</th>
                <th>상태</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map(item => (
                  <tr key={item.id} className={isLowStock(item) ? 'low-stock' : ''}>
                    <td>{item.category}</td>
                    <td>{item.name}</td>
                    <td>{item.price.toLocaleString()}원</td>
                    <td>{item.quantity}개</td>
                    <td>
                      <span className={`stock-status ${isLowStock(item) ? 'warning' : 'normal'}`}>
                        {isLowStock(item) ? '재고 부족' : '정상'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="edit-button"
                        onClick={() => openModal('edit', item)}
                      >
                        수정
                      </button>
                      <button 
                        className="delete-button"
                        onClick={() => openModal('delete', item)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-data">검색 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 모달 - 신규 추가, 수정, 삭제 */}
      {modalType && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <div className="modal-header">
              {modalType === 'add' && <h3>신규 물품 추가</h3>}
              {modalType === 'edit' && <h3>재고 정보 수정</h3>}
              {modalType === 'delete' && <h3>재고 삭제</h3>}
              <button className="close-button" onClick={closeModal}>×</button>
            </div>
            
            <div className="modal-body">
              {modalType === 'delete' ? (
                <div className="delete-confirmation">
                  <p><strong>{selectedItem?.name}</strong> 상품을 정말 삭제하시겠습니까?</p>
                  <p>이 작업은 되돌릴 수 없습니다.</p>
                </div>
              ) : (
                <div className="form-container">
                  <div className="form-group">
                    <label htmlFor="name">상품명 *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="상품명을 입력하세요"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="category">카테고리 *</label>
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">카테고리 선택</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group half">
                      <label htmlFor="price">가격(원) *</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="가격을 입력하세요"
                      />
                    </div>
                    
                    <div className="form-group half">
                      <label htmlFor="quantity">재고 수량 *</label>
                      <input
                        type="number"
                        id="quantity"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleInputChange}
                        required
                        min="0"
                        placeholder="수량을 입력하세요"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              {modalType === 'add' && (
                <button 
                  className="primary-button"
                  onClick={handleAddItem}
                >
                  상품 추가
                </button>
              )}
              
              {modalType === 'edit' && (
                <button 
                  className="primary-button"
                  onClick={handleUpdateItem}
                >
                  정보 업데이트
                </button>
              )}
              
              {modalType === 'delete' && (
                <button 
                  className="delete-button"
                  onClick={handleDeleteItem}
                >
                  삭제 확인
                </button>
              )}
              
              <button 
                className="secondary-button"
                onClick={closeModal}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;