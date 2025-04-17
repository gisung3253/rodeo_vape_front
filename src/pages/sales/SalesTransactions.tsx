import React from 'react';
import { SalesTransaction, PaymentMethod } from './SalesTypes';
import { deleteSaleTransaction } from './SalesService';

interface SalesTransactionsProps {
  salesTransactions: SalesTransaction[];
  setSalesTransactions: React.Dispatch<React.SetStateAction<SalesTransaction[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoSaveStatus: React.Dispatch<React.SetStateAction<string>>;
  salesDate: string;
  refreshData: () => Promise<void>;
}

const SalesTransactions: React.FC<SalesTransactionsProps> = ({
  salesTransactions,
  setSalesTransactions,
  isLoading,
  setIsLoading,
  setAutoSaveStatus,
  salesDate,
  refreshData
}) => {
  // 오늘 날짜 가져오기
  const today = new Date().toISOString().split('T')[0];
  
  // 총 판매액 계산
  const totalSales = salesTransactions.reduce((sum, transaction) => sum + transaction.totalAmount, 0);
  
  // 거래 삭제 핸들러
  const deleteTransaction = async (transactionId: string | number) => {
    if (window.confirm('정말로 이 거래를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        setIsLoading(true);
        
        // API 호출하여 판매 기록 삭제
        await deleteSaleTransaction(transactionId);
        
        // 삭제 성공 시 판매 내역 다시 로드
        await refreshData();
        
        // 성공 메시지
        setAutoSaveStatus('거래가 삭제되었습니다.');
        
      } catch (error: any) {
        console.error('판매 기록 삭제 오류:', error);
        alert(error.message || '판매 기록 삭제 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  // 거래 펼치기/접기 토글
  const toggleTransactionExpand = (transactionId: string | number) => {
    setSalesTransactions(prev => 
      prev.map(transaction => 
        transaction.id === transactionId
          ? { ...transaction, expanded: !transaction.expanded }
          : transaction
      )
    );
  };
  
  // 결제 방식 표시
  const getPaymentDisplay = (method: PaymentMethod, cardCompany = '') => {
    switch(method) {
      case 'card': return `카드(${cardCompany})`;
      case 'transfer': return '계좌이체';
      case 'cash': return '현금';
      default: return '';
    }
  };

  return (
    <div className="sales-items-section">
      <div className="sales-items-header">
        <div className="sales-items-title">
          {salesDate === today ? '오늘의 거래 목록' : `${salesDate} 거래 목록`}
        </div>
        <div className="total-display">총 판매액: <strong>{totalSales.toLocaleString()}원</strong></div>
      </div>
      
      <div className="transactions-container">
        {isLoading ? (
          <div className="loading-message">데이터를 불러오는 중입니다...</div>
        ) : salesTransactions.length > 0 ? (
          <div className="transactions-list">
            {salesTransactions.map((transaction) => (
              <div key={transaction.id} className="transaction-card">
                {/* 거래 헤더: 클릭 시 펼침/접기 */}
                <div 
                  className="transaction-header" 
                  onClick={() => toggleTransactionExpand(transaction.id)}
                >
                  <div className="transaction-summary">
                    <div className="transaction-main-info">
                      {/* 거래의 첫 번째 상품 표시 */}
                      <span className="transaction-first-item">
                        {transaction.items[0]?.productName} ({transaction.items[0]?.quantity}개)
                        {transaction.items.length > 1 && 
                          <span className="transaction-more-items"> 외 {transaction.items.length - 1}개 상품</span>
                        }
                      </span>
                    </div>
                    <div className="transaction-meta">
                      <span className="transaction-time">
                        {transaction.timestamp}
                      </span>
                      <span className="transaction-payment">
                        {getPaymentDisplay(transaction.paymentMethod, transaction.cardCompany)}
                      </span>
                      <span className="transaction-amount">
                        {transaction.totalAmount.toLocaleString()}원
                      </span>
                    </div>
                  </div>
                  <div className="transaction-toggle">
                    {transaction.expanded ? '▼' : '▶'}
                  </div>
                </div>
                
                {/* 거래 상세 내용: 펼쳤을 때만 표시 */}
                {transaction.expanded && (
                  <div className="transaction-details">
                    <table className="transaction-items-table">
                      <thead>
                        <tr>
                          <th>카테고리</th>
                          <th>상품명</th>
                          <th>수량</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaction.items.map(item => (
                          <tr key={item.id}>
                            <td>{item.category}</td>
                            <td>{item.productName}</td>
                            <td>{item.quantity}개</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="item-total-label">총액</td>
                          <td className="item-total-amount">{transaction.totalAmount.toLocaleString()}원</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <div className="transaction-actions">
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTransaction(transaction.id);
                        }}
                        disabled={isLoading}
                      >
                        거래 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-transactions">
            등록된 판매 내역이 없습니다.
          </div>
        )}
      </div>
      
      {salesTransactions.length > 0 && (
        <div className="transactions-summary">
          <div className="total-label">
            {salesDate === today ? '오늘' : salesDate} 총 판매액
          </div>
          <div className="total-amount">{totalSales.toLocaleString()}원</div>
        </div>
      )}
    </div>
  );
};

export default SalesTransactions;