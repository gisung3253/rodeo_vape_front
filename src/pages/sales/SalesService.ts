import axios, { AxiosError } from 'axios';
import { 
  API_URL, 
  Product, 
  SaleData,  
  SalesTransaction,
  PaymentMethod 
} from './SalesTypes';

// 인증 정보를 모든 요청에 추가하는 함수
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 에러 타입 검사 함수
function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError)?.isAxiosError === true;
}

// 재고 상품 목록 가져오기
export const fetchInventoryItems = async (): Promise<Product[]> => {
  try {
    // import.meta.env.VITE_API_URL를 사용하여 API URL 구성
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
    const response = await axios.get(`${baseUrl}/api/inventory`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: unknown) {
    // 오류 처리 개선 - 401 오류 특별 처리
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('인증이 필요합니다');
    }
    throw new Error('재고 목록을 불러오는 중 오류가 발생했습니다.');
  }
};

// 카테고리 목록 추출
export const extractCategories = (inventoryItems: Product[]): string[] => {
  return Array.from(
    new Set(inventoryItems.map(item => item.category))
  ) as string[];
};

// 날짜별 판매 내역 가져오기
export const fetchSalesByDate = async (date: string): Promise<SalesTransaction[]> => {
  try {
    const response = await axios.get(`${API_URL}/date/${date}`, {
      headers: getAuthHeaders()
    });
    
    // 백엔드 응답을 프론트엔드 형식으로 변환
    const transactions: SalesTransaction[] = response.data.map((sale: any) => {
      // formattedTime 선언 후 초기값 설정
      let formattedTime = "시간 정보 없음";

      try {
        if (sale.sale_time) {
          const timeParts = sale.sale_time.split(':');
          if (timeParts.length >= 2) {
            formattedTime = `${timeParts[0]}:${timeParts[1]}`;
          }
        }
      } catch (timeError) {
        // 시간 파싱 오류 무시
      }

      return {
        id: sale.id,
        items: sale.items.map((item: any) => ({
          id: item.id,
          inventory_id: item.inventory_id,
          productName: item.name,
          category: item.category,
          quantity: item.quantity,
          item_total: item.item_total
        })),
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method as PaymentMethod,
        cardCompany: sale.payment_method === 'card' ? (sale.note || '') : '',
        timestamp: formattedTime,
        expanded: false
      };
    });
    
    return transactions;
  } catch (error: unknown) {
    // 401 오류 특별 처리
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('인증이 필요합니다');
    }
    throw new Error('판매 내역을 불러오는 중 오류가 발생했습니다.');
  }
};

// 거래 완료 (판매 기록 저장)
export const completeSaleTransaction = async (
  currentTransaction: SalesTransaction,
  salesDate: string
): Promise<void> => {
  // 현재 시간 가져오기
  const now = new Date();
  const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS 형식
  
  // 백엔드에 전송할 데이터 구성
  const saleData: SaleData = {
    sale_date: salesDate,
    sale_time: currentTime,
    total_amount: currentTransaction.totalAmount,
    payment_method: currentTransaction.paymentMethod,
    note: currentTransaction.paymentMethod === 'card' ? currentTransaction.cardCompany : ''
  };
  
  // 판매 항목 데이터 구성 (총액을 항목 수에 비례하여 분배)
  const totalQuantity = currentTransaction.items.reduce((sum, item) => sum + item.quantity, 0);
  const saleItems = currentTransaction.items.map(item => {
    // 각 항목의 수량 비율에 따라 총액 분배
    const ratio = item.quantity / totalQuantity;
    const itemTotal = Math.round(currentTransaction.totalAmount * ratio);
    
    return {
      inventory_id: item.inventory_id,
      quantity: item.quantity,
      price_per_unit: Math.round(itemTotal / item.quantity), // 단가 계산
      item_total: itemTotal
    };
  });
  
  // API 호출하여 판매 기록 저장
  try {
    await axios.post(API_URL, {
      sale_data: saleData,
      sale_items: saleItems
    }, {
      headers: getAuthHeaders()
    });
  } catch (error: unknown) {
    // 401 오류 특별 처리
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('인증이 필요합니다');
    }
    throw new Error('판매 기록 저장 중 오류가 발생했습니다.');
  }
};

// 판매 기록 삭제
export const deleteSaleTransaction = async (transactionId: string | number): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/${transactionId}`, {
      headers: getAuthHeaders()
    });
  } catch (error: unknown) {
    // 401 오류 특별 처리
    if (isAxiosError(error) && error.response?.status === 401) {
      throw new Error('인증이 필요합니다');
    }
    throw new Error('판매 기록 삭제 중 오류가 발생했습니다.');
  }
};
