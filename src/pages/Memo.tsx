import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Memo.css';

// 메모 타입 정의 (백엔드 응답 구조에 맞게 수정)
interface MemoItem {
  id: number;       // 백엔드 DB에서는 숫자형 ID 사용
  content: string;
  created_at: string; // DB에서 사용하는 필드명
  color: string;    // 이 필드는 프론트엔드에서만 관리
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

// API 호출에 사용할 axios 인스턴스 생성
const api = axios.create({
    baseURL: API_URL,
});

// 요청 보내기 전에 토큰 확인 및 추가하는 인터셉터
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function Memo() {
  // 메모 목록 상태
  const [memos, setMemos] = useState<MemoItem[]>([]);
  // 새 메모 내용 상태
  const [newMemo, setNewMemo] = useState('');
  // 선택된 메모 상태 (모달용)
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 오류 메시지
  const [error, setError] = useState<string | null>(null);
  // 랜덤 컬러 배열
  const colors = ['#fef68a', '#f8d7a4', '#e4ee91', '#d1f5ff', '#fff8b8', '#ffe4e1', '#d4f8e8'];
  
  // 메모 정렬 함수 - 항상 일관된 정렬 방식 사용
  const sortMemos = (memosToSort: MemoItem[]): MemoItem[] => {
    // ID를 기준으로 내림차순 정렬 (최근 추가된 메모가 맨 앞에 오도록)
    return [...memosToSort].sort((a, b) => b.id - a.id);
    
    // 또는 생성 날짜 기준으로 정렬하고 싶다면:
    // return [...memosToSort].sort((a, b) => 
    //   new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    // );
  };

  // 컴포넌트 마운트 시 API에서 메모 불러오기
  useEffect(() => {
    const fetchMemos = async () => {
      setIsLoading(true);
      setError(null); // 에러 상태 초기화
      
      try {
        // 토큰이 있는지 확인
        const token = localStorage.getItem('token');
        if (!token) {
          // 토큰이 없으면 로그인 페이지로 리디렉션
          window.location.href = '/login';
          return;
        }
        
        // axios 인스턴스 사용 (인터셉터가 토큰 추가)
        const response = await api.get('/api/memos');
        
        // 메모에 색상 추가 및 날짜 형식 변환
        const memosWithColors = response.data.map((memo: any) => ({
          ...memo,
          color: colors[Math.floor(Math.random() * colors.length)],
          created_at: formatDate(new Date(memo.created_at))
        }));
        
        // 정렬 함수 적용하여 동일한 순서로 표시
        setMemos(sortMemos(memosWithColors));
      } catch (err: any) {
        // 401 에러 처리
        if (err.response && err.response.status === 401) {
          console.error('인증 실패: 토큰이 만료되었거나 유효하지 않습니다.');
          // 로그인 페이지로 리디렉션
          localStorage.removeItem('token'); // 만료된 토큰 제거
          window.location.href = '/login';
          return;
        }
        
        console.error('메모 불러오기 오류:', err);
        setError('메모를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemos();
  }, []);

  // 날짜 형식화 함수
  const formatDate = (date: Date) => {
    // 한국 시간대로 조정 (UTC+9)
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    
    // 시간 및 분 형식 맞추기
    const hours = koreanTime.getHours();
    const minutes = koreanTime.getMinutes().toString().padStart(2, '0');
    
    return `${koreanTime.getFullYear()}년 ${koreanTime.getMonth() + 1}월 ${koreanTime.getDate()}일 ${hours}:${minutes}`;
  };

  // 메모 추가 함수
  const addMemo = async () => {
    if (!newMemo.trim()) return; // 빈 메모 추가 방지
    
    setIsLoading(true);
    try {
      // 새 메모를 서버에 저장 (api 인스턴스 사용)
      const response = await api.post('/api/memos', { content: newMemo });
      
      // 서버 응답에 색상 추가
      const memoWithColor = {
        ...response.data,
        color: colors[Math.floor(Math.random() * colors.length)],
        created_at: formatDate(new Date(response.data.created_at))
      };
      
      // 메모 목록 업데이트 (정렬 함수 적용)
      setMemos(sortMemos([...memos, memoWithColor]));
      // 입력 필드 초기화
      setNewMemo('');
    } catch (err: any) {
      // 401 에러 처리
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token'); // 만료된 토큰 제거
        window.location.href = '/login';
        return;
      }
      
      console.error('메모 추가 오류:', err);
      setError('메모를 추가하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메모 삭제 함수
  const deleteMemo = async (id: number) => {
    try {
      // 서버에서 메모 삭제 (api 인스턴스 사용)
      await api.delete(`/api/memos/${id}`);
      
      // 화면에서 메모 제거 (정렬 유지)
      const updatedMemos = memos.filter(memo => memo.id !== id);
      setMemos(updatedMemos); // 이미 정렬된 상태이므로 다시 정렬할 필요 없음
      
      // 선택된 메모가 있고 그 메모가 삭제되면 모달 닫기
      if (selectedMemo && selectedMemo.id === id) {
        setSelectedMemo(null);
      }
    } catch (err: any) {
      // 401 에러 처리
      if (err.response && err.response.status === 401) {
        localStorage.removeItem('token'); // 만료된 토큰 제거
        window.location.href = '/login';
        return;
      }
      
      console.error('메모 삭제 오류:', err);
      setError('메모를 삭제하는 중 오류가 발생했습니다.');
    }
  };

  // 엔터키 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addMemo();
    }
  };

  // 메모 카드 클릭 핸들러
  const handleMemoClick = (memo: MemoItem) => {
    setSelectedMemo(memo);
  };

  // 모달 닫기 핸들러
  const closeModal = () => {
    setSelectedMemo(null);
  };

  // 오류 메시지 초기화
  const clearError = () => {
    setError(null);
  };

  return (
    <div className="memo-container">
      <h2 className="page-title">메모</h2>
      
      {error && (
        <div className="error-message" onClick={clearError}>
          {error}
          <button className="close-error">×</button>
        </div>
      )}
      
      <div className="memo-input-container">
        <textarea
          className="memo-input"
          placeholder="메모를 입력하세요..."
          value={newMemo}
          onChange={(e) => setNewMemo(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button 
          className={`memo-add-button ${isLoading ? 'loading' : ''}`} 
          onClick={addMemo}
          disabled={isLoading}
        >
          {isLoading ? '처리 중...' : '추가하기'}
        </button>
      </div>
      
      <div className="memo-list">
        {isLoading && memos.length === 0 ? (
          <div className="loading-message">메모를 불러오는 중...</div>
        ) : memos.length === 0 ? (
          <div className="no-memos">
            <p>작성된 메모가 없습니다.</p>
            <p>중요한 내용을 메모해 보세요!</p>
          </div>
        ) : (
          memos.map((memo) => (
            <div 
              className="memo-card" 
              style={{ backgroundColor: memo.color }}
              key={memo.id}
              onClick={() => handleMemoClick(memo)}
            >
              <div className="memo-content">{memo.content}</div>
              <div className="memo-footer">
                <div className="memo-date">{memo.created_at}</div>
                <button 
                  className="memo-delete-button"
                  onClick={(e) => {
                    e.stopPropagation(); // 부모 요소 클릭 이벤트 전파 방지
                    deleteMemo(memo.id);
                  }}
                >
                  확인
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메모 상세 모달 */}
      {selectedMemo && (
        <div className="memo-modal-overlay" onClick={closeModal}>
          <div 
            className="memo-modal"
            style={{ backgroundColor: selectedMemo.color }}
            onClick={(e) => e.stopPropagation()} // 모달 내부 클릭 시 닫히지 않도록
          >
            <div className="memo-modal-content">{selectedMemo.content}</div>
            <div className="memo-modal-footer">
              <div className="memo-modal-date">{selectedMemo.created_at}</div>
              <button className="memo-modal-close-button" onClick={closeModal}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Memo;