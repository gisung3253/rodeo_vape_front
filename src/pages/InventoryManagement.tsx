import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../utils/api';
import '../styles/InventoryManagement.css';
import '../styles/Inventory.css';

// 제품 타입 정의 (회사명 제거)
interface InventoryItem {
  id: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

// 재고 부족 기준 설정 함수
const isLowStock = (item: InventoryItem): boolean => {
  if (item.category === "코일팟") {
    return item.quantity <= 10;
  } else {
    return item.quantity <= 5;
  }
};

// 모달 유형 정의
type ModalType = 'add' | 'edit' | 'delete' | null;

function InventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // 모달 관련 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  // 새 상품 또는 수정된 상품 정보
  const [formData, setFormData] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    category: '',
    price: 0,
    quantity: 0
  });
  
  // 재고 데이터 가져오기
  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/inventory');
      setInventory(response.data);
      setError(null);
    } catch (err: any) {
      setError('재고 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }; 
  
  // 모달 외부 클릭 감지를 위한 ref
  const modalRef = useRef<HTMLDivElement>(null);
  
  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchInventory();
    
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
    const lowStockItems = useMemo(() => {
      return inventory.filter(item => isLowStock(item));
    }, [inventory]);
    
    // 카테고리별 필터링
    const filteredItems = useMemo(() => {
      let items = inventory;
      
      // 카테고리 필터링
      if (activeCategory === "low-stock") {
        items = lowStockItems;
      } else if (activeCategory !== "all") {
        items = items.filter(item => item.category === activeCategory);
      }
      
      // 검색어 필터링 (상품명만)
      if (searchTerm) {
        items = items.filter(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return items;
    }, [activeCategory, searchTerm, lowStockItems, inventory]);

    // 모든 카테고리
  const categories = ["all", "입호흡액상", "폐호흡액상", "폐호흡기기", "입호흡기기", "코일팟", "기타", "low-stock"];
  
  // 카테고리별 이름 표시
  const getCategoryDisplayName = (category: string): string => {
    switch(category) {
      case "all": return "전체";
      case "low-stock": return "재고부족";
      default: return category;
    }
  };
  
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
      await fetchInventory();
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
      await fetchInventory();
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
      await fetchInventory();
      closeModal();
      alert('상품이 삭제되었습니다.');
    } catch (err: any) {
      console.error('상품 삭제 오류:', err);
      alert(err.response?.data?.error || '상품 삭제에 실패했습니다.');
    }
  };
  
  return (
    <div className="inventory-container">
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
      
      <div className="category-tabs">
          {categories.map(category => (
            <button
              key={category}
              className={`category-tab ${activeCategory === category ? 'active' : ''} ${category === 'low-stock' ? 'warning-tab' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {getCategoryDisplayName(category)}
              {category === 'low-stock' && <span className="badge">{lowStockItems.length}</span>}
            </button>
          ))}
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
                      {categories
                        .filter(category => category !== "all" && category !== "low-stock")
                        .map(category => (
                          <option key={category} value={category}>{getCategoryDisplayName(category)}</option>
                        ))
                      }
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