import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../services/ActivityContext';
import { useTheme } from '../services/ThemeContext';
import { useGallery } from '../services/GalleryContext';
import { useCompletion } from '../services/CompletionContext';
import { useUser } from '../services/UserContext';
import { useMissions } from '../services/MissionContext';
import { api, BACKEND_URL } from '../services/api'; // BACKEND_URL import 추가
import '../css/Base.css';

function Base() {
  const [activeMenu, setActiveMenu] = useState('learn');
  const [isActivitySidebarOpen, setIsActivitySidebarOpen] = useState(false);
  
  const { activities } = useActivity();
  const { theme, setTheme } = useTheme();
  const { myCreations } = useGallery();
  const { isCompleted } = useCompletion();
  const navigate = useNavigate();

  const [sharingStates, setSharingStates] = useState({});
  const [socialCreations, setSocialCreations] = useState([]);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  const { gainExp, checkAndSetDailyLogin, todayCompletedCount, weekCompletedCount, level } = useUser();
  const { missions, completeMission, isMissionCompleted } = useMissions();

  useEffect(() => {
    const checkMission = (id, condition, reward) => {
      if (condition && !isMissionCompleted(id)) {
        console.log(`미션 "${id}" 완료!`);
        completeMission(id);
        gainExp(reward, false);
      }
    };
    checkMission('daily_login', checkAndSetDailyLogin(), 10);
    checkMission('complete_one_lesson', todayCompletedCount >= 1, 20);
    checkMission('complete_five_lessons', weekCompletedCount >= 5, 100);
    checkMission('achieve_level_5', level >= 5, 200);
  }, [todayCompletedCount, weekCompletedCount, level, checkAndSetDailyLogin, completeMission, gainExp, isMissionCompleted]);

  const stages = [
    { id: 'stage1', stage: 1, title: 'AI와 프롬프트란?', description: 'AI의 기본 원리와 프롬프트의 중요성을 배웁니다.', icon: '🎯' },
    { id: 'stage2', stage: 2, title: '프롬프트 마스터링', description: '그림과 텍스트로 AI와 소통하는 5가지 기술을 익힙니다.', icon: '🎨' },
    { id: 'stage3', stage: 3, title: '리얼 AI 마스터링', description: '실전 프롬프트 엔지니어링 기법을 학습합니다.', icon: '🚀', locked: true },
  ];

  const menuItems = [
    { id: 'learn', name: '학습', icon: '📚' },
    { id: 'gallery', name: '나의 작품집', icon: '🖼️' },
    { id: 'social', name: '소셜 갤러리', icon: '🌐' },
    { id: 'mission', name: '미션', icon: '🚩' },
    { id: 'settings', name: '설정', icon: '⚙️' },
  ];

  useEffect(() => {
    if (activeMenu === 'social') {
      const fetchSocialCreations = async () => {
        setIsLoadingSocial(true);
        try {
          const posts = await api.getSharedPosts();
          setSocialCreations(posts.reverse());
        } catch (error) {
          console.error("Failed to fetch social creations:", error);
        } finally {
          setIsLoadingSocial(false);
        }
      };
      fetchSocialCreations();
    }
  }, [activeMenu]);

  const handleShare = async (creation) => {
    if (sharingStates[creation.id]) return;
    setSharingStates(prev => ({ ...prev, [creation.id]: 'sharing' }));
    try {
      await api.sharePost(creation.prompt, creation.imageUrl);
      setSharingStates(prev => ({ ...prev, [creation.id]: 'shared' }));
      
      const shareMissionId = 'share_first_creation';
      if (!isMissionCompleted(shareMissionId)) {
        console.log("첫 작품 공유 업적 완료!");
        completeMission(shareMissionId);
        gainExp(50, false);
      }
      
      alert('작품이 소셜 갤러리에 공유되었습니다!');
    } catch (error) {
      console.error("Failed to share creation:", error);
      alert('공유에 실패했습니다. 다시 시도해주세요.');
      setSharingStates(prev => ({ ...prev, [creation.id]: undefined }));
    }
  };
  
  const renderContent = () => {
    switch (activeMenu) {
      case 'learn':
        return (
          <div className="learn-content">
            <div className="welcome-section"><h2 className="welcome-title">학습 여정 🗺️</h2><p className="welcome-text">PrompE와 함께 AI 전문가가 되어보세요!</p></div>
            <div className="stage-map">
              {stages.map((stage, index) => (
                <React.Fragment key={stage.stage}>
                  <div className={`stage-node ${isCompleted(stage.id) ? 'completed' : ''} ${stage.locked ? 'locked' : ''}`} onClick={() => !stage.locked && navigate(`/stage${stage.stage}`)}>
                    <div className="stage-icon-wrapper"><span className="stage-node-icon">{stage.icon}</span>{isCompleted(stage.id) && <div className="completed-check">✓</div>}</div>
                    <div className="stage-info"><span className="stage-number-badge">STAGE {stage.stage}</span><h3 className="stage-node-title">{stage.title}</h3><p className="stage-node-desc">{stage.description}</p></div>
                  </div>
                  {index < stages.length - 1 && <div className="stage-path"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>
        );
      case 'gallery':
        return (
          <div className="gallery-content">
            <h2 className="welcome-title">나의 작품집 🖼️</h2><p className="welcome-text">지금까지 만든 멋진 작품들을 감상하고 공유해보세요.</p>
            <div className="creations-grid">
              {myCreations.length > 0 ? (
                myCreations.map(creation => {
                  const status = sharingStates[creation.id];
                  // '나의 작품집'에서는 생성된 임시 URL 또는 저장된 영구 URL을 모두 보여줄 수 있음
                  const imageUrl = creation.imageUrl.startsWith('http') ? creation.imageUrl : `${BACKEND_URL}${creation.imageUrl}`;
                  return (<div key={creation.id} className="creation-card"><img src={imageUrl} alt={creation.prompt} className="creation-image" /><div className="creation-overlay"><p className="creation-prompt">{creation.prompt}</p><button className={`share-btn ${status ? status : ''}`} onClick={() => handleShare(creation)} disabled={!!status}>{status === 'sharing' ? '공유 중...' : status === 'shared' ? '공유 완료 ✓' : '소셜에 공유하기'}</button></div></div>)
                })
              ) : (<div className="empty-gallery"><p>아직 완성된 작품이 없어요.</p><p>학습을 통해 멋진 작품을 만들어보세요!</p></div>)}
            </div>
          </div>
        );
      case 'social':
        return (
          <div className="gallery-content">
            <h2 className="welcome-title">소셜 갤러리 🌐</h2><p className="welcome-text">다른 친구들이 만든 멋진 작품들을 구경해보세요!</p>
            {isLoadingSocial ? (<div className="loading-gallery">작품을 불러오는 중...</div>) : (
              <div className="creations-grid">
                {socialCreations.length > 0 ? (
                  socialCreations.map(creation => (
                    <div key={creation.id} className="creation-card">
                      {/* ★★★ 이미지 src 경로 수정 ★★★ */}
                      <img src={`${BACKEND_URL}${creation.image_url}`} alt={creation.prompt} className="creation-image" />
                      <div className="creation-overlay"><p className="creation-prompt">{creation.prompt}</p></div>
                    </div>
                  ))
                ) : (<div className="empty-gallery"><p>아직 공유된 작품이 없어요.</p><p>'나의 작품집'에서 첫 번째로 작품을 공유해보세요!</p></div>)}
              </div>
            )}
          </div>
        );
      case 'mission':
        const dailyMissions = missions.filter(m => m.type === 'daily');
        const weeklyMissions = missions.filter(m => m.type === 'weekly');
        const achievements = missions.filter(m => m.type === 'achievement');
        return (
          <div className="mission-content">
            <h2 className="welcome-title">미션 보드 🚩</h2><p className="welcome-text">다양한 미션을 완료하고 보상을 획득하세요!</p>
            <div className="mission-section"><h3>일일 미션</h3>{dailyMissions.map(mission => (<div key={mission.id} className={`mission-card ${isMissionCompleted(mission.id) ? 'completed' : ''}`}><span className="mission-icon">{mission.icon}</span><div className="mission-info"><h4>{mission.title}</h4><p>{mission.description}</p></div><div className="mission-reward"><span>+{mission.reward} EXP</span>{isMissionCompleted(mission.id) ? (<button className="claim-btn completed" disabled>완료</button>) : (<button className="claim-btn">진행중</button>)}</div></div>))}</div>
            <div className="mission-section"><h3>주간 미션</h3>{weeklyMissions.map(mission => (<div key={mission.id} className={`mission-card ${isMissionCompleted(mission.id) ? 'completed' : ''}`}><span className="mission-icon">{mission.icon}</span><div className="mission-info"><h4>{mission.title}</h4><p>{mission.description}</p></div><div className="mission-reward"><span>+{mission.reward} EXP</span>{isMissionCompleted(mission.id) ? (<button className="claim-btn completed" disabled>완료</button>) : (<button className="claim-btn">진행중</button>)}</div></div>))}</div>
            <div className="mission-section"><h3>업적</h3>{achievements.map(mission => (<div key={mission.id} className={`mission-card ${isMissionCompleted(mission.id) ? 'completed' : ''}`}><span className="mission-icon">{mission.icon}</span><div className="mission-info"><h4>{mission.title}</h4><p>{mission.description}</p></div><div className="mission-reward"><span>+{mission.reward} EXP</span>{isMissionCompleted(mission.id) ? (<button className="claim-btn completed" disabled>완료</button>) : (<button className="claim-btn">진행중</button>)}</div></div>))}</div>
          </div>
        );
      case 'settings':
        return (
          <div className="settings-content">
            <h2 className="welcome-title">설정</h2>
            <div className="setting-item"><h3 className="setting-title">👤 프로필 정보</h3><div className="profile-details"><span className="profile-avatar">👤</span><div className="profile-info"><span className="profile-name">김단아</span><span className="profile-email">prompe-user@example.com</span></div><button className="logout-btn">로그아웃</button></div></div>
            <div className="setting-item"><h3 className="setting-title">🎨 화면 테마 설정</h3><p className="setting-description">앱의 전체적인 테마를 변경합니다.</p><div className="theme-toggle-group"><button className={`theme-btn ${theme === 'light' ? 'active' : ''}`} onClick={() => setTheme('light')}><span className="theme-icon">☀️</span> 라이트</button><button className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}><span className="theme-icon">🌙</span> 다크</button><button className={`theme-btn ${theme === 'system' ? 'active' : ''}`} onClick={() => setTheme('system')}><span className="theme-icon">💻</span> 시스템</button></div></div>
            <div className="setting-item danger-zone"><h3 className="setting-title">🚨 데이터 초기화</h3><p className="setting-description">주의: 모든 레벨, 경험치, 학습 완료 기록, 나의 작품집이 영구적으로 삭제됩니다.</p><button className="reset-btn" onClick={() => { if(window.confirm("정말로 모든 진행 상황을 초기화하시겠어요?")) { localStorage.clear(); window.location.reload(); } }}>모든 진행 상황 초기화하기</button></div>
          </div>
        );
      default:
        return <div>콘텐츠를 선택해주세요.</div>;
    }
  };

  return (
    <div className="base-page-container">
      <div className="dashboard-layout">
        <aside className="sidebar"><div className="sidebar-logo"><h1 className="logo">PrompE</h1><span className="logo-sub">프롬피</span></div><nav className="sidebar-nav"><ul>{menuItems.map(item => (<li key={item.id}><button className={`nav-button ${activeMenu === item.id ? 'active' : ''}`} onClick={() => setActiveMenu(item.id)}><span className="nav-icon">{item.icon}</span><span className="nav-text">{item.name}</span></button></li>))}</ul></nav></aside>
        <main className="main-content-dashboard"><header className="base-content-header"><div className="header-left"></div><div className="header-right"><button className="activity-toggle-btn" onClick={() => setIsActivitySidebarOpen(true)}>☰</button></div></header>{renderContent()}</main>
      </div>
      <aside className={`activity-sidebar ${isActivitySidebarOpen ? 'open' : ''}`}>
        <div className="activity-header"><h3 className="section-title">최근 활동</h3><button className="close-btn" onClick={() => setIsActivitySidebarOpen(false)}>&times;</button></div>
        <div className="activity-list">{activities.map((activity, index) => (<div key={index} className="activity-item"><span className="activity-icon">{activity.icon}</span><div className="activity-content"><p className="activity-title">{activity.title}</p><span className="activity-time">{activity.time}</span></div></div>))}</div>
      </aside>
      {isActivitySidebarOpen && (<div className="sidebar-overlay" onClick={() => setIsActivitySidebarOpen(false)} />)}
    </div>
  );
}

export default Base;