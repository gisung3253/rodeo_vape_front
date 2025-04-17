import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Monthly.css';

// API 응답 타입 정의
interface MonthlyDataItem {
  year: number;
  month: number;
  monthName: string;
  yearMonth: string;
  total_sales: number;
}

interface MonthlySummary {
  annualTotal: number;
  currentMonthSales: number;
  topMonth: {
    year: number;
    month: number;
    yearMonth: string;
    sales: number;
  }
}

interface MonthlyApiResponse {
  monthlyData: MonthlyDataItem[];
  summary: MonthlySummary;
}

// 숫자 포맷팅 함수 - 천 단위 구분자 추가 및 앞 0 제거
const formatNumber = (num: number | string): string => {
  // 문자열이 전달된 경우 먼저 숫자로 변환
  const numValue = typeof num === 'string' ? parseFloat(num) : num;
  
  // NaN이거나 0인 경우 "0원" 반환
  if (isNaN(numValue) || numValue === 0) return "0원";
  
  // 천 단위 구분자 추가
  return numValue.toLocaleString('ko-KR') + '원';
};

function Monthly() {
  const [activeTab, setActiveTab] = useState('chart');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 데이터 상태 관리
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [currentMonthSales, setCurrentMonthSales] = useState(0);
  const [topMonth, setTopMonth] = useState<{year: number, month: number, yearMonth: string, sales: number} | null>(null);

  // API에서 월별 매출 데이터 가져오기
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true);
        const response = await axios.get<MonthlyApiResponse>('http://localhost:5002/api/monthly', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // 데이터 변환 (sales 속성 추가)
        const formattedData = response.data.monthlyData.map((item, index) => ({
          id: index,
          year: item.year,
          month: item.monthName || `${item.month}월`,
          yearMonth: item.yearMonth,
          sales: item.total_sales,
          formattedSales: formatNumber(item.total_sales)
        }));
        
        // 최신 월이 위로 오도록 정렬
        const sortedData = [...formattedData].reverse();
        
        setMonthlyData(sortedData);
        setTotalSales(response.data.summary.annualTotal);
        setCurrentMonthSales(response.data.summary.currentMonthSales);
        setTopMonth(response.data.summary.topMonth);
        setLoading(false);
      } catch (error) {
        console.error('월별 매출 데이터 로드 오류:', error);
        setError('월별 매출 데이터를 불러오는 중 오류가 발생했습니다.');
        setLoading(false);
      }
    };
    
    fetchMonthlyData();
  }, []);
  
  // 최대 매출액 (그래프 스케일링을 위한 값)
  const maxSales = Math.max(...monthlyData.map(item => item.sales || 0), 1);
  
  // 로딩 상태 표시
  if (loading) {
    return (
      <div className="monthly-container">
        <h2 className="page-title">월별 매출</h2>
        <div className="loading-indicator">데이터를 불러오는 중...</div>
      </div>
    );
  }
  
  // 에러 상태 표시
  if (error) {
    return (
      <div className="monthly-container">
        <h2 className="page-title">월별 매출</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="monthly-container">
      <h2 className="page-title">월별 매출</h2>
      
      <div className="monthly-summary">
        <div className="summary-card">
          <h3>연간 총 매출</h3>
          <p className="summary-value">{formatNumber(totalSales)}</p>
        </div>
        <div className="summary-card">
          <h3>이번달 매출</h3>
          <p className="summary-value">{formatNumber(currentMonthSales)}</p>
        </div>
        <div className="summary-card">
          <h3>최고 매출 월</h3>
          <p className="summary-value">
            {topMonth?.yearMonth || "데이터 없음"}
          </p>
        </div>
      </div>
      
      <div className="monthly-tabs">
        <button 
          className={`tab-button ${activeTab === 'chart' ? 'active' : ''}`}
          onClick={() => setActiveTab('chart')}
        >
          그래프
        </button>
        <button 
          className={`tab-button ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          테이블
        </button>
      </div>
      
      <div className="monthly-content">
        {monthlyData.length === 0 ? (
          <div className="no-data-message">
            표시할 월별 매출 데이터가 없습니다.
          </div>
        ) : activeTab === 'chart' ? (
          <div className="monthly-chart">
            {monthlyData.map((item) => {
              // 숫자 값 확실히 변환
              const salesValue = typeof item.sales === 'string' 
                ? parseFloat(item.sales) 
                : item.sales;
                
              return (
                <div key={item.id} className="chart-bar-container">
                  <div className="chart-label">
                    {item.yearMonth}
                  </div>
                  <div className="chart-bar-wrapper">
                    <div 
                      className="chart-bar" 
                      style={{ width: `${(salesValue / maxSales) * 100}%` }}
                    >
                      <span className="chart-bar-value">{formatNumber(salesValue)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="monthly-table">
            <table>
              <thead>
                <tr>
                  <th>년도</th>
                  <th>월</th>
                  <th>매출액</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.year}년</td>
                    <td>{item.month}</td>
                    <td>{item.formattedSales}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>총 매출액</td>
                  <td>{formatNumber(totalSales)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Monthly;