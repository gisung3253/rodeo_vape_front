import React, { useState, useRef, useEffect } from 'react';
import { 
  Product, 
  SaleItem, 
  SalesTransaction, 
  PaymentMethod, 
  cardCompanies,
  initialNewItem
} from './SalesTypes';
import { completeSaleTransaction } from './SalesService';

interface SalesModalProps {
  showModal: boolean;
  toggleModal: () => void;
  categories: string[];
  inventoryItems: Product[];
  currentTransaction: SalesTransaction;
  setCurrentTransaction: React.Dispatch<React.SetStateAction<SalesTransaction>>;
  salesDate: string;
  refreshData: () => Promise<void>;
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const SalesModal: React.FC<SalesModalProps> = ({
  showModal,
  toggleModal,
  categories,
  inventoryItems,
  currentTransaction,
  setCurrentTransaction,
  salesDate,
  refreshData,
  setAutoSaveStatus,
  isLoading,
  setIsLoading
}) => {
  // 새 판매 항목 입력 상태
  const [newItem, setNewItem] = useState<SaleItem & { productName?: string; category?: string; }>({...initialNewItem});
  
  // 드롭다운 상태
  const [showProductDropdown, setShowProductDropdown] = useState<boolean>(false);
  
  // 검색 결과
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // 검색 입력 참조
  const productInputRef = useRef<HTMLInputElement>(null);
  
  // 카테고리 변경 시 호출
  const handleCategoryChange = (category: string) => {
    setNewItem(prev => ({ ...prev, category, productName: '' }));
    
    // 카테고리 변경 시 드롭다운 초기화
    setFilteredProducts([]);
    setShowProductDropdown(false);
    
    // 상품명 필터링
    if (category) {
      const filtered = inventoryItems.filter(item => item.category === category);
      setFilteredProducts(filtered);
    }
  };
  
  // 상품명 변경 핸들러
  const handleProductNameChange = (input: string) => {
    setNewItem(prev => ({
      ...prev,
      productName: input,
      inventory_id: 0
    }));
    
    // 현재 선택된 카테고리의 제품 중에서 상품명으로 필터링
    const filtered = inventoryItems.filter(
      p => p.category === newItem.category && 
           p.name.toLowerCase().includes(input.toLowerCase())
    );
    setFilteredProducts(filtered);
    setShowProductDropdown(input.length > 0);
    
    // 정확히 일치하는 제품이 하나뿐이라면 해당 제품 정보로 자동 채우기
    if (filtered.length === 1 && filtered[0].name.toLowerCase() === input.toLowerCase()) {
      handleProductSelect(filtered[0]);
    }
  };
  
  // 상품 선택 핸들러
  const handleProductSelect = (product: Product) => {
    setNewItem(prev => ({
      ...prev,
      inventory_id: product.id,
      category: product.category,
      productName: product.name,
      quantity: prev.quantity
    }));
    
    // 드롭다운 닫기
    setTimeout(() => {
      setShowProductDropdown(false);
    }, 100); // 약간의 지연을 두어 이벤트 충돌 방지
  };
  
  // 수량 변경 핸들러
  const handleQuantityChange = (quantity: number) => {
    setNewItem(prev => ({
      ...prev,
      quantity
    }));
  };
  
  // 결제 방식 변경 핸들러
  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setCurrentTransaction(prev => ({
      ...prev,
      paymentMethod: method,
      // 카드가 아니면 카드사 정보 초기화
      cardCompany: method === 'card' ? prev.cardCompany : ''
    }));
  };
  
  // 카드사 변경 핸들러
  const handleCardCompanyChange = (company: string) => {
    setCurrentTransaction(prev => ({
      ...prev,
      cardCompany: company
    }));
  };
  
  // 결제 금액 입력 처리 핸들러
  const handleTotalAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 숫자와 쉼표만 허용
    let value = e.target.value.replace(/[^\d]/g, '');
    
    // 숫자가 있을 경우에만 처리
    if (value) {
      // 숫자를 정수로 변환
      const numberValue = parseInt(value);
      
      // 천 단위 쉼표 포맷팅
      const formattedValue = numberValue.toLocaleString('ko-KR');
      
      // 입력 필드에 쉼표가 포함된 형식으로 표시
      e.target.value = formattedValue;
      
      // 상태 업데이트 시에는 숫자만 저장
      setCurrentTransaction(prev => ({
        ...prev,
        totalAmount: numberValue
      }));
    } else {
      // 빈 값이면 0으로 설정
      e.target.value = '';
      setCurrentTransaction(prev => ({
        ...prev,
        totalAmount: 0
      }));
    }
  };
  
  // 거래에 항목 추가 (재고 수량 체크 추가)
  const addItemToTransaction = () => {
    if (!newItem.inventory_id || !newItem.productName || !newItem.quantity) {
      alert('상품과 수량을 모두 입력해주세요.');
      return;
    }
    
    // 선택한 상품의 현재 재고 확인
    const selectedProduct = inventoryItems.find(item => item.id === newItem.inventory_id);
    
    if (!selectedProduct) {
      alert('선택한 상품을 찾을 수 없습니다.');
      return;
    }
    
    // 이미 추가된 같은 상품의 수량 계산
    const alreadyAddedQuantity = currentTransaction.items
      .filter(item => item.inventory_id === newItem.inventory_id)
      .reduce((sum, item) => sum + item.quantity, 0);
    
    // 총 필요한 수량 (기존에 추가된 수량 + 새로 추가할 수량)
    const totalNeededQuantity = alreadyAddedQuantity + newItem.quantity;
    
    // 재고 부족 확인
    if (totalNeededQuantity > selectedProduct.quantity) {
      alert(`재고 부족: 현재 재고는 ${selectedProduct.quantity}개이며, 이미 ${alreadyAddedQuantity}개를 추가했습니다. 최대 ${selectedProduct.quantity - alreadyAddedQuantity}개만 추가할 수 있습니다.`);
      return;
    }
    
    // 새 항목에 고유 ID 추가
    const itemWithId = { 
      ...newItem, 
      id: Date.now().toString() 
    };
    
    // 새 항목을 배열 시작 부분에 추가
    setCurrentTransaction(prev => ({
      ...prev,
      items: [itemWithId, ...prev.items]
    }));
    
    // 입력 필드 초기화
    setNewItem({
      inventory_id: 0,
      category: '',
      productName: '',
      quantity: 1
    });
    
    // 자동완성 상태 초기화
    setShowProductDropdown(false);
    setFilteredProducts([]);
  };
  
  // 현재 거래 항목 삭제 핸들러
  const removeItemFromTransaction = (itemId: string | number) => {
    const updatedItems = currentTransaction.items.filter(item => item.id !== itemId);
    
    setCurrentTransaction(prev => ({
      ...prev,
      items: updatedItems
    }));
  };
  
  // 거래 완료 핸들러
  const completeTransaction = async () => {
    // 항목이 없으면 경고
    if (currentTransaction.items.length === 0) {
      alert('거래할 항목이 없습니다.');
      return;
    }
    
    // 총액이 입력되지 않았으면 경고
    if (!currentTransaction.totalAmount || currentTransaction.totalAmount <= 0) {
      alert('총 결제 금액을 입력해주세요.');
      return;
    }
    
    // 결제 방식이 카드인데 카드사가 선택되지 않았으면 경고
    if (currentTransaction.paymentMethod === 'card' && !currentTransaction.cardCompany) {
      alert('카드 결제 시 카드사를 선택해주세요.');
      return;
    }
    
    // 모든 상품의 재고 확인
    for (const item of currentTransaction.items) {
      const product = inventoryItems.find(p => p.id === item.inventory_id);
      
      if (!product) {
        alert(`상품 정보를 찾을 수 없습니다: ${item.productName}`);
        return;
      }
      
      // 같은 상품이 여러번 추가된 경우 총 수량 계산
      const totalQuantity = currentTransaction.items
        .filter(i => i.inventory_id === item.inventory_id)
        .reduce((sum, i) => sum + i.quantity, 0);
      
      if (totalQuantity > product.quantity) {
        alert(`재고 부족: ${product.name}의 현재 재고는 ${product.quantity}개이나, ${totalQuantity}개를 판매하려고 합니다.`);
        return;
      }
    }
    
    try {
      setIsLoading(true);
      
      // 판매 기록 저장 API 호출
      await completeSaleTransaction(currentTransaction, salesDate);
      
      // 데이터 새로고침
      await refreshData();
      
      // 새로운 거래 시작
      setCurrentTransaction(prev => ({
        id: Date.now().toString(),
        items: [],
        totalAmount: 0,
        paymentMethod: prev.paymentMethod, // 결제 방식은 유지
        cardCompany: prev.paymentMethod === 'card' ? prev.cardCompany : '',
        timestamp: new Date().toISOString()
      }));
      
      // 성공 메시지
      setAutoSaveStatus('거래가 성공적으로 저장되었습니다.');
      
    } catch (error: any) {
      console.error('판매 기록 저장 오류:', error);
      alert(error.message || '판매 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 클릭 이벤트 리스너
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productInputRef.current && !productInputRef.current.contains(event.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (!showModal) return null;

  return (
    <div className="sales-modal-overlay" onClick={toggleModal}>
      <div className="sales-modal-content" onClick={e => e.stopPropagation()}>
        <div className="sales-modal-header">
          <h2>판매 입력</h2>
          <button className="sales-modal-close" onClick={toggleModal}>✕</button>
        </div>
        
        <div className="sales-modal-body">
          {/* 카테고리, 상품명, 수량 입력 폼 */}
          <div className="sales-modal-form-row">
            {/* 카테고리 선택 */}
            <div className="sales-modal-form-group">
              <label>카테고리</label>
              <select 
                value={newItem.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="sales-modal-form-select"
              >
                <option value="">선택</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {/* 상품명 입력 */}
            <div className="sales-modal-form-group autocomplete">
              <label>상품명</label>
              <input 
                type="text"
                ref={productInputRef}
                value={newItem.productName}
                onChange={(e) => handleProductNameChange(e.target.value)}
                placeholder="상품명 입력"
                className="sales-modal-form-input"
                onFocus={() => {
                  if (newItem.category && !newItem.productName) {
                    setShowProductDropdown(true);
                  }
                }}
                autoComplete="off"
                disabled={!newItem.category}
              />
              
              {showProductDropdown && filteredProducts.length > 0 && (
                <ul className="dropdown-list">
                  {filteredProducts.map(product => (
                    <li 
                      key={product.id} 
                      className="dropdown-item"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleProductSelect(product);
                      }}
                    >
                      {product.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* 수량 입력 */}
            <div className="sales-modal-form-group">
              <label>수량</label>
              <input 
                type="number"
                value={newItem.quantity || ''}
                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                placeholder="수량"
                min="1"
                className="sales-modal-form-input"
              />
            </div>
            
            {/* 항목 추가 버튼 */}
            <button 
              className="sales-modal-add-item"
              onClick={addItemToTransaction}
            >
              항목 추가
            </button>
          </div>
          
          {/* 현재 거래 항목 영역 */}
          <div className="sales-modal-current-items-container">
            <div className="sales-modal-current-items">
              <div className="sales-modal-items-header">
                <h4>현재 거래 항목 ({currentTransaction.items.length}개)</h4>
              </div>
              {currentTransaction.items.length > 0 ? (
                <div className="sales-modal-items-list">
                  {currentTransaction.items.map(item => (
                    <div key={item.id} className="sales-modal-item-card">
                      <div className="sales-modal-item-info">
                        <span className="sales-modal-item-name">{item.productName}</span>
                        <span className="sales-modal-item-detail">
                          {item.category} | {item.quantity}개
                        </span>
                      </div>
                      <button 
                        className="sales-modal-remove-item"
                        onClick={() => removeItemFromTransaction(item.id!)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sales-modal-empty-message">
                  추가된 항목이 없습니다. 상품을 선택하고 항목 추가 버튼을 눌러주세요.
                </div>
              )}
            </div>
          </div>
          
          {/* 결제 섹션 */}
          <div className="sales-modal-payment-section">
            <h4 className="sales-modal-payment-title">결제 방식</h4>
            <div className="sales-modal-payment-row">
              {/* 결제 금액 입력 필드 부분 */}
              <div className="sales-modal-total-amount">
                <label>총 결제 금액</label>
                <input
                  type="text"
                  className="sales-modal-total-input"
                  placeholder="총액 입력"
                  value={currentTransaction.totalAmount ? currentTransaction.totalAmount.toLocaleString('ko-KR') : ''}
                  onChange={handleTotalAmountChange}
                />
              </div>
              
              <div className="sales-modal-payment-methods">
                <label>결제 방식</label>
                <div className="sales-modal-radio-group">
                  <label className="sales-modal-radio-label">
                    <input 
                      type="radio"
                      name="payment-method" 
                      checked={currentTransaction.paymentMethod === 'cash'}
                      onChange={() => handlePaymentMethodChange('cash')}
                    />
                    현금
                  </label>
                  <label className="sales-modal-radio-label">
                    <input 
                      type="radio"
                      name="payment-method" 
                      checked={currentTransaction.paymentMethod === 'card'}
                      onChange={() => handlePaymentMethodChange('card')}
                    />
                    카드
                  </label>
                  <label className="sales-modal-radio-label">
                    <input 
                      type="radio"
                      name="payment-method" 
                      checked={currentTransaction.paymentMethod === 'transfer'}
                      onChange={() => handlePaymentMethodChange('transfer')}
                    />
                    계좌이체
                  </label>
                </div>
              </div>
              
              {/* 카드사 선택 필드 - 항상 표시 */}
              <div className="sales-modal-card-company">
                <label>카드사</label>
                <select
                  value={currentTransaction.cardCompany}
                  onChange={(e) => handleCardCompanyChange(e.target.value)}
                  className="sales-modal-card-select"
                  disabled={currentTransaction.paymentMethod !== 'card'}
                >
                  <option value="">선택</option>
                  {cardCompanies.map(company => (
                    <option key={company} value={company}>{company}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="sales-modal-footer">
          <button 
            className="sales-modal-cancel-button"
            onClick={toggleModal}
          >
            취소
          </button>
          <button 
            className="sales-modal-complete-button"
            onClick={() => {
              completeTransaction().then(() => toggleModal());
            }}
            disabled={currentTransaction.items.length === 0 || isLoading}
          >
            {isLoading ? '처리중...' : '거래 완료'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesModal;