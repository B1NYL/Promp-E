import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../services/UserContext';
import '../css/Header.css';

// onToggleActivitySidebar는 Base 페이지에서만 필요하므로, 여기서는 선택적으로 받도록 합니다.
function Header({ onToggleActivitySidebar }) {
  const navigate = useNavigate();
  const { level, exp, expForNextLevel } = useUser();
  const expPercentage = expForNextLevel > 0 ? (exp / expForNextLevel) * 100 : 0;

  return (
    <header className="main-header">
      {/* 로고와 텍스트 */}
      <div className="logo-text" onClick={() => navigate('/base')}>
        <h1 className="logo">PrompE</h1>
        <span className="logo-sub">프롬피</span>
      </div>
      
      {/* 오른쪽 요소들 */}
      <div className="header-right">
        {/* 경험치 바 */}
        <div className="user-exp-bar">
          <div className="level-badge">LV.{level}</div>
          <div className="exp-bar-wrapper">
            <div className="exp-bar-fill" style={{ width: `${expPercentage}%` }}></div>
          </div>
          <div className="exp-text">{exp} / {expForNextLevel}</div>
        </div>

        {/* 프로필 버튼 */}
        <button className="profile-button" onClick={() => navigate('/base')}>👤</button>
        
        {/* Base 페이지에서만 전달되는 햄버거 버튼 토글 함수가 있을 경우에만 버튼을 렌더링 */}
        {onToggleActivitySidebar && (
          <button className="activity-toggle-btn" onClick={onToggleActivitySidebar}>
            ☰
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;