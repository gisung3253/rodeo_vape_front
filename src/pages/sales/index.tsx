import React, { useState, useEffect } from 'react';
import '../../styles/sales/index.css';
import { 
  Product, 
  SalesTransaction, 
  createInitialTransaction 
} from './SalesTypes';
import { 
  fetchInventoryItems, 
  extractCategories, 
  fetchSalesByDate 
} from './SalesService';
import SalesModal from './SalesModal';
import SalesTransactions from './SalesTransactions';

function Sales() {
  // 로컬 시간 기준 오늘 날짜 계산
  const localToday = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Seoul'
  }).split('. ').join('-').replace(/\.$/, '');
  
  
  // 재고 항목 목록 상태
  const [inventoryItems, setInventoryItems] = useState<Product[]>([]);
  
  // 판매 거래 목록 상태
  const [salesTransactions, setSalesTransactions] = useState<SalesTransaction[]>([]);
  
  // 현재 작성 중인 거래
  const [currentTransaction, setCurrentTransaction] = useState<SalesTransaction>(createInitialTransaction());
  
  // 판매 날짜 상태
  const [salesDate, setSalesDate] = useState<string>(localToday);
  
  // 임시저장 상태 표시
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>('');
  
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // 카테고리 목록
  const [categories, setCategories] = useState<string[]>([]);
  
  // 모달 상태
  const [showModal, setShowModal] = useState<boolean>(false);

  // 모달 토글 함수
  const toggleModal = () => {
    setShowModal(prev => !prev);
  };

  // 데이터 새로고침 함수
  const refreshData = async () => {
    await Promise.all([
      fetchSalesByDate(salesDate).then(setSalesTransactions),
      fetchInventoryItems().then(items => {
        setInventoryItems(items);
        setCategories(extractCategories(items));
      })
    ]);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    refreshData();
  }, [salesDate]);
  
  // 날짜 변경 핸들러
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSalesDate(newDate);
  };
  
  return (
    <div className="sales-container">
      <h2 className="page-title">판매장부</h2>
      
      {/* 판매 날짜 선택 */}
      <div className="sales-header">
        <div className="date-picker-container">
          <label className="date-label">판매 날짜:</label>
          <input
            type="date"
            className="date-input"
            value={salesDate}
            onChange={handleDateChange} // 선언한 함수 사용
            style={{ minWidth: "180px" }}
          />
        </div>
        <button className="add-sale-button" onClick={toggleModal}>
          판매 입력
        </button>
      </div>
      
      {/* 판매 입력 모달 */}
      <SalesModal
        showModal={showModal}
        toggleModal={toggleModal}
        categories={categories}
        inventoryItems={inventoryItems}
        currentTransaction={currentTransaction}
        setCurrentTransaction={setCurrentTransaction}
        salesDate={salesDate}
        refreshData={refreshData}
        setAutoSaveStatus={setAutoSaveStatus}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
      
      {/* 판매 내역 목록 */}
      <SalesTransactions
        salesTransactions={salesTransactions}
        setSalesTransactions={setSalesTransactions}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setAutoSaveStatus={setAutoSaveStatus}
        salesDate={salesDate}
        refreshData={refreshData}
      />
      
      {/* 실시간 상태 표시 */}
      {autoSaveStatus && (
        <div className="sales-actions">
          <div className="auto-save-status">{autoSaveStatus}</div>
        </div>
      )}
    </div>
  );
}

export default Sales;