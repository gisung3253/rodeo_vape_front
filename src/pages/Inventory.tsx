import { useState, useEffect, useMemo } from 'react';
import api from '../utils/api';
import '../styles/Inventory.css';

// 제품 타입 정의
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

function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // 재고 데이터 가져오기
  useEffect(() => {
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
    fetchInventory();
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

  return (
    <div className="inventory-container">
      <h2 className="page-title">재고확인</h2>
      
      <div className="inventory-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="상품명 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
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
      </div>
      
      <div className="inventory-table-container">
        {isLoading ? (
          <div className="loading-message">재고 정보를 불러오는 중...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>분류</th>
                <th>상품명</th>
                <th>가격</th>
                <th>현재 재고</th>
                <th>상태</th>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="no-data">검색 결과가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Inventory;