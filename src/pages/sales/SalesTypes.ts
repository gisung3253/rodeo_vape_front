// 제품 타입 정의
export interface Product {
  id: number;        // 숫자형 ID
  name: string;      // 상품명
  category: string;  // 카테고리
  price: number;     // 가격
  quantity: number;  // 재고수량
}

// 결제 방식 타입
export type PaymentMethod = 'card' | 'transfer' | 'cash';

// 판매 항목 타입 정의 (하나의 상품)
export interface SaleItem {
  id?: string | number; // 프론트엔드 임시 ID 또는 백엔드에서 받은 ID
  inventory_id: number; // 재고 ID
  productName?: string; // 프론트엔드 표시용 (백엔드에 저장되지 않음)
  category?: string;    // 프론트엔드 표시용
  quantity: number;     // 수량
  item_total?: number;  // 항목별 합계 (optional로 변경)
}

// 백엔드에 전송할 판매 데이터 타입
export interface SaleData {
  sale_date: string;
  sale_time: string;
  total_amount: number;
  payment_method: string;
  note?: string;
}

// 판매 거래 타입 정의 (여러 상품을 포함하는 하나의 거래)
export interface SalesTransaction {
  id: number | string; // 백엔드에서는 숫자, 프론트엔드 임시 ID는 문자열
  items: SaleItem[];             // 판매 상품 목록
  totalAmount: number;           // 총 판매액
  paymentMethod: PaymentMethod;  // 결제 방식
  cardCompany: string;           // 카드사 (결제 방식이 카드일 경우)
  timestamp: string;             // 거래 시간
  expanded?: boolean;            // UI 용도: 상세 정보 펼치기/접기
}

// 카드사 목록
export const cardCompanies = [
  "KB국민", "삼성", "신한", "현대", "롯데", "우리", "하나", "농협", "BC", "기타"
];

// API 기본 URL 설정
export const API_URL = 'http://localhost:5002/api/sales';

// 기본 신규 아이템 초기값
export const initialNewItem = {
  inventory_id: 0,
  category: '',
  productName: '',
  quantity: 1
};

// 기본 트랜잭션 초기값
export const createInitialTransaction = () => ({
  id: Date.now().toString(),
  items: [],
  totalAmount: 0,
  paymentMethod: 'cash' as PaymentMethod,
  cardCompany: '',
  timestamp: new Date().toISOString()
});