import { useState, useEffect } from 'react';
import '../styles/Memo.css';
import api from '../utils/api';

interface MemoItem {
  id: number;      
  content: string;
  created_at: string; 
  color: string;
};

function Memo() {
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [newMemo, setNewMemo] = useState('');
  const [selectedMemo, setSelectedMemo] = useState<MemoItem | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const colors = ['#fef68a', '#f8d7a4', '#e4ee91', '#d1f5ff', '#fff8b8', '#ffe4e1', '#d4f8e8'];
  
  // 메모 정렬 함수
  const sortMemos = (memosToSort: MemoItem[]): MemoItem[] => {
    return [...memosToSort].sort((a, b) => b.id - a.id);
  };

  useEffect(() => {
    const fetchMemos = async () => {
      setIsLoading(true);
      setError(null); // 에러 상태 초기화
      
      try {
        const response = await api.get('/api/memos');
        const memosWithColors = response.data.map((memo: any) => ({
          ...memo,
          color: colors[Math.floor(Math.random() * colors.length)],
          created_at: formatDate(new Date(memo.created_at))
        }));
        
        setMemos(sortMemos(memosWithColors));
      } catch (err: any) {
        console.error('메모 불러오기 오류:', err);
        setError('메모를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMemos();
  }, []);

  const formatDate = (date: Date) => {
    const koreanTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
    const hours = koreanTime.getHours();
    const minutes = koreanTime.getMinutes().toString().padStart(2, '0');
    return `${koreanTime.getFullYear()}년 ${koreanTime.getMonth() + 1}월 ${koreanTime.getDate()}일 ${hours}:${minutes}`;
  };

  // 메모 추가 함수
  const addMemo = async () => {
    if (!newMemo.trim()){
      setError('메모 내용을 입력해주세요.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/api/memos', { content: newMemo });
      const memoWithColor = {
        ...response.data,
        color: colors[Math.floor(Math.random() * colors.length)],
        created_at: formatDate(new Date(response.data.created_at))
      };
      
      setMemos(sortMemos([...memos, memoWithColor]));
      setNewMemo('');
    } catch (err: any) {
      console.error('메모 추가 오류:', err);
      setError('메모를 추가하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 메모 삭제 함수
  const deleteMemo = async (id: number) => {
    try {
      await api.delete(`/api/memos/${id}`);
      const updatedMemos = memos.filter(memo => memo.id !== id);
      setMemos(updatedMemos); // 이미 정렬된 상태이므로 다시 정렬할 필요 없음
    } catch (err: any) {
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
            onClick={(e) => e.stopPropagation()} 
          >
            <div className="memo-modal-content">{selectedMemo.content}</div>
            <div className="memo-modal-footer">
              <div className="memo-modal-date">{selectedMemo.created_at}</div>
              <button className="memo-delete-button" onClick={closeModal}>
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