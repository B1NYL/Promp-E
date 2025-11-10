import React, { useState } from 'react'
import StageCard from '../components/StageCard'
import '../css/Base.css'

function Base() {
  const [activeMenu, setActiveMenu] = useState('learn') // 현재 활성화된 메뉴
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false) // 오른쪽 사이드바 상태
  
  const stages = [
    {
      stage: 1,
      title: 'AI와 프롬프트란?',
      description: 'AI 서비스 활용법, 바이브코딩, 인공지능 활용, 인공지능과 대화해보기, 인터랙티브 스토리텔링, 프롬프튜터링',
      icon: '🎯',
      color: '#00C8B3',
      locked: false
    },
    {
      stage: 2,
      title: '프롬프트 마스터링',
      description: '릴레이 프롬프트, 프롬프트 블록코딩, 5단계 미션 (인지→묘사→상황부여→추상화→언어화)',
      icon: '🎨',
      color: '#00C8B3',
      locked: false
    },
    {
      stage: 3,
      title: '리얼 AI 마스터링',
      description: '실전 프롬프트 엔지니어링으로 AI를 완벽하게 활용해보세요',
      icon: '🚀',
      color: '#00C8B3',
      locked: false
    }
  ]

  const menuItems = [
    { id: 'learn', name: '학습', icon: '📚' },
    { id: 'social', name: '소셜', icon: '🌐' },
    { id: 'mission', name: '미션', icon: '🚩' },
    { id: 'profile', name: '프로필', icon: '👤' },
  ]
  
  const recentActivities = [
    { icon: '🎯', title: 'Stage 1 - AI와 대화해보기 완료', time: '2시간 전' },
    { icon: '🎨', title: '프롬프트 블록코딩 도전!', time: '1일 전' },
    { icon: '✨', title: '5단계 미션 - 인지 단계 통과', time: '3일 전' },
  ]
  
  const renderContent = () => {
    switch (activeMenu) {
      case 'learn':
        return (
          <>
            <div className="welcome-section">
              <h2 className="welcome-title">안녕하세요! 👋</h2>
              <p className="welcome-text">오늘은 어떤 학습을 시작해볼까요?</p>
            </div>
            <div className="stages-grid">
              {stages.map((stage) => (
                <StageCard key={stage.stage} {...stage} />
              ))}
            </div>
          </>
        )
      case 'social':
        return <div>소셜 콘텐츠가 여기에 표시됩니다.</div>
      case 'mission':
        return <div>미션 콘텐츠가 여기에 표시됩니다.</div>
      case 'profile':
        return <div>프로필 콘텐츠가 여기에 표시됩니다.</div>
      default:
        return <div>콘텐츠를 선택해주세요.</div>
    }
  }

  return (
    <div className="base-page-container"> {/* 전체를 감싸는 새로운 div */}
      <div className="dashboard-layout">
        {/* 왼쪽 사이드바 */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1 className="logo">PrompE</h1>
            <span className="logo-sub">프롬피</span>
          </div>
          <nav className="sidebar-nav">
            <ul>
              {menuItems.map(item => (
                <li key={item.id}>
                  <button
                    className={`nav-button ${activeMenu === item.id ? 'active' : ''}`}
                    onClick={() => setActiveMenu(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="main-content-dashboard">
          {/* Base 페이지 전용 헤더 */}
          <header className="base-content-header">
            <div className="header-left">
              {/* 여기에 검색창 같은 걸 넣을 수 있습니다. */}
            </div>
            <div className="header-right">
              <button className="activity-toggle-btn" onClick={() => setIsActivitySidebarOpen(true)}>
                ☰
              </button>
            </div>
          </header>
          {renderContent()}
        </main>
      </div>

      {/* 오른쪽 최근 활동 사이드바 (토글) */}
      <aside className={`activity-sidebar ${isActivitySidebarOpen ? 'open' : ''}`}>
        <div className="activity-header">
          <h3 className="section-title">최근 활동</h3>
          <button className="close-btn" onClick={() => setIsActivitySidebarOpen(false)}>
            &times;
          </button>
        </div>
        <div className="activity-list">
          {recentActivities.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-content">
                <p className="activity-title">{activity.title}</p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </aside>
      
      {isActivitySidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setIsActivitySidebarOpen(false)} />
      )}
    </div>
  )
}

export default Base