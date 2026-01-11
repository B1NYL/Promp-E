import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActivity } from '../services/ActivityContext';
import { useTheme } from '../services/ThemeContext';
import { useGallery } from '../services/GalleryContext';
import { useCompletion } from '../services/CompletionContext';
import { useUser } from '../services/UserContext';
import { useMissions } from '../services/MissionContext';
import { api, BACKEND_URL } from '../services/api';
import '../css/Base.css';

// ZigZag SVG Path Component
const RoadmapPath = () => (
  <svg className="roadmap-svg" viewBox="0 0 100 400" preserveAspectRatio="none">
    <path
      d="M50,0 C50,0 50,20 50,40 C50,80 20,80 20,120 C20,160 80,160 80,200 C80,240 50,240 50,280"
      fill="none"
      stroke="#e5e5e5"
      strokeWidth="4"
      strokeLinecap="round"
      strokeDasharray="10 10"
    />
  </svg>
);

function Base() {
  const [activeMenu, setActiveMenu] = useState('learn');
  // Removed old sidebar toggle logic as we moved to a sticky layout

  const { activities } = useActivity();
  const { theme, setTheme } = useTheme();
  const { myCreations } = useGallery();
  const { isCompleted } = useCompletion();
  const navigate = useNavigate();

  const [sharingStates, setSharingStates] = useState({});
  const [socialCreations, setSocialCreations] = useState([]);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  const { gainExp, checkAndSetDailyLogin, todayCompletedCount, weekCompletedCount, level, exp, expForNextLevel } = useUser();
  const { missions, completeMission, isMissionCompleted } = useMissions();

  // --- Manual Claim Logic & State ---
  const [questTab, setQuestTab] = useState('daily');

  const handleClaim = (id, reward) => {
    completeMission(id);
    gainExp(reward, true); // true for confetti
  };

  const getMissionStatus = (id) => {
    if (isMissionCompleted(id)) return 'completed';

    let isClaimable = false;
    let progressText = '';
    let progressPercent = 0;

    switch (id) {
      case 'daily_login':
        isClaimable = checkAndSetDailyLogin();
        progressText = '1 / 1';
        progressPercent = 100;
        break;
      case 'complete_one_lesson':
        isClaimable = todayCompletedCount >= 1;
        progressText = `${Math.min(todayCompletedCount, 1)} / 1`;
        progressPercent = (Math.min(todayCompletedCount, 1) / 1) * 100;
        break;
      case 'complete_five_lessons':
        isClaimable = weekCompletedCount >= 5;
        progressText = `${Math.min(weekCompletedCount, 5)} / 5`;
        progressPercent = (Math.min(weekCompletedCount, 5) / 5) * 100;
        break;
      case 'achieve_level_5':
        isClaimable = level >= 5;
        progressText = `Lvl ${level} / 5`;
        progressPercent = (Math.min(level, 5) / 5) * 100;
        break;
      case 'share_first_creation':
        isClaimable = false;
        progressText = '0 / 1';
        progressPercent = 0;
        break;
      default:
        isClaimable = false;
    }

    if (isClaimable) return 'claimable';
    return { progressText, progressPercent };
  };

  // --- Mission Check Logic ---
  useEffect(() => {
    const checkMission = (id, condition, reward) => {
      if (condition && !isMissionCompleted(id)) {
        console.log(`Mission "${id}" Completed!`);
        completeMission(id);
        gainExp(reward, false);
      }
    };
    checkMission('daily_login', checkAndSetDailyLogin(), 10);
    checkMission('complete_one_lesson', todayCompletedCount >= 1, 20);
    checkMission('complete_five_lessons', weekCompletedCount >= 5, 100);
    checkMission('achieve_level_5', level >= 5, 200);
  }, [todayCompletedCount, weekCompletedCount, level, checkAndSetDailyLogin, completeMission, gainExp, isMissionCompleted]);

  // --- Fetch Social Data Logic ---
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

  // --- Share Logic ---
  const handleShare = async (creation) => {
    if (sharingStates[creation.id]) return;
    setSharingStates(prev => ({ ...prev, [creation.id]: 'sharing' }));
    try {
      await api.sharePost(creation.prompt, creation.imageUrl);
      setSharingStates(prev => ({ ...prev, [creation.id]: 'shared' }));
      const shareMissionId = 'share_first_creation';
      if (!isMissionCompleted(shareMissionId)) {
        completeMission(shareMissionId);
        gainExp(50, false);
      }
      alert('Published to Social Gallery!');
    } catch (error) {
      console.error("Failed to share creation:", error);
      alert('Share failed, please try again.');
      setSharingStates(prev => ({ ...prev, [creation.id]: undefined }));
    }
  };

  // --- Navigation Items ---
  const menuItems = [
    { id: 'learn', name: 'LEARN', icon: '🏠' },
    { id: 'gallery', name: 'GALLERY', icon: '🎨' },
    { id: 'social', name: 'SOCIAL', icon: '🌍' },
    { id: 'mission', name: 'QUESTS', icon: '📜' },
    { id: 'settings', name: 'SETTINGS', icon: '⚙️' },
  ];

  const stages = [
    { id: 'stage1', stage: 1, title: 'Intro to AI', colorClass: 'stage-color-1', icon: '🥚' },
    { id: 'stage2', stage: 2, title: 'Prompt Magic', colorClass: 'stage-color-2', icon: '🐣' },
    { id: 'stage3', stage: 3, title: 'Mastery', colorClass: 'stage-color-3', icon: '🦅' },
  ];

  // --- Render Functions ---
  const renderRoadmap = () => (
    <div className="roadmap-container">
      <div className="unit-header">
        <div className="unit-info">
          <h2>유닛 1</h2>
          <p>프롬프트 엔지니어링 기초</p>
        </div>
        <button className="btn-3d btn-secondary">가이드북</button>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '50px' }}>
        {/* SVG Background Path would go here, simplified layout for now */}

        {stages.map((stage, idx) => {
          // Unlock logic:
          // Stage 1 (idx 0): Always unlocked
          // Stage 2 (idx 1): Unlocked if Stage 1's last lesson ('s1-chat') is completed
          // Stage 3 (idx 2): Unlocked if Stage 2's last lesson ('s2-thinking') is completed
          let isUnlocked = false;
          if (idx === 0) {
            isUnlocked = true;
          } else if (idx === 1) {
            isUnlocked = isCompleted('s1-chat');
          } else if (idx === 2) {
            isUnlocked = isCompleted('s2-thinking');
          }

          const statusClass = isUnlocked ? stage.colorClass : 'stage-color-locked';

          return (
            <div key={stage.id} className="stage-node-wrapper">
              <button
                className={`stage-node-btn ${statusClass}`}
                onClick={() => {
                  if (isUnlocked) {
                    navigate(`/stage${stage.stage}`);
                  } else {
                    setShowLockedModal(true);
                  }
                }}
                disabled={false} // Always enable to show alert on click if locked, or use CSS to show disabled state
                style={{ opacity: isUnlocked ? 1 : 0.6, cursor: isUnlocked ? 'pointer' : 'not-allowed' }}
              >
                {stage.icon}
              </button>
              {/* Show crown if the stage's final lesson is done? Or simplified for now */}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeMenu) {
      case 'learn': return renderRoadmap();
      case 'gallery':
        return (
          <div className="gallery-content">
            <h2 className="welcome-title">나의 갤러리</h2>
            <div className="creations-grid">
              {myCreations.length > 0 ? myCreations.map(c => (
                <div key={c.id} className="creation-card">
                  <img src={c.imageUrl.startsWith('http') ? c.imageUrl : `${BACKEND_URL}${c.imageUrl}`} className="creation-image" alt="art" />
                  <div className="creation-overlay">
                    <p className="creation-prompt">{c.prompt}</p>
                    <div className="creation-actions">
                      <button className={`btn-3d btn-primary ${sharingStates[c.id] === 'shared' ? 'disabled' : ''}`} onClick={() => handleShare(c)}>
                        {sharingStates[c.id] === 'shared' ? '공유됨' : '공유하기'}
                      </button>
                      <button
                        className="btn-3d btn-secondary"
                        style={{ background: 'var(--accent)', boxShadow: '0 4px 0 var(--accent-shadow)' }}
                        onClick={() => {
                          setSelectedMerchImg(c.imageUrl.startsWith('http') ? c.imageUrl : `${BACKEND_URL}${c.imageUrl}`);
                          setShowMerchModal(true);
                        }}
                      >
                        🏪 굿즈
                      </button>
                    </div>
                  </div>
                </div>
              )) : <div className="empty-gallery">아직 작품이 없습니다. 학습을 시작해보세요!</div>}
            </div>

            {/* Merch Modal */}
            {showMerchModal && (
              <div className="modal-overlay" onClick={() => setShowMerchModal(false)}>
                <div className="modal-content merch-modal" onClick={e => e.stopPropagation()}>
                  <h2 className="modal-title">나만의 굿즈 만들기!</h2>
                  <p className="modal-description">AI 아트를 실제 상품으로 만들어보세요!</p>

                  <div className="merch-preview-container">
                    <div className="merch-item">
                      <div className="tshirt-mockup">
                        <img src={selectedMerchImg} className="mockup-design" alt="design" />
                      </div>
                      <p>티셔츠</p>
                      <button className="btn-3d btn-primary tiny">₩15,000</button>
                    </div>
                    <div className="merch-item">
                      <div className="mug-mockup">
                        <img src={selectedMerchImg} className="mockup-design" alt="design" />
                      </div>
                      <p>머그컵</p>
                      <button className="btn-3d btn-primary tiny">₩8,000</button>
                    </div>
                  </div>

                  <button className="btn-3d btn-outline" style={{ marginTop: '20px' }} onClick={() => setShowMerchModal(false)}>
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'social': return <div className="coming-soon-content"><h2>소셜 갤러리</h2><p>다른 프롬프터들과 소통해보세요!</p></div>;

      case 'mission':

        return (
          <div className="mission-content">
            <h2 className="welcome-title">퀘스트</h2>

            {/* Tabs */}
            <div className="quest-tabs">
              <button
                className={`quest-tab-btn ${questTab === 'daily' ? 'active' : ''}`}
                onClick={() => setQuestTab('daily')}
              >
                오늘
              </button>
              <button
                className={`quest-tab-btn ${questTab === 'weekly' ? 'active' : ''}`}
                onClick={() => setQuestTab('weekly')}
              >
                주간
              </button>
            </div>

            <div className="quest-list">
              {Object.entries(missions)
                .filter(([key]) => {
                  if (questTab === 'daily') return key.includes('daily') || key.includes('one_lesson');
                  return !key.includes('daily') && !key.includes('one_lesson');
                })
                .map(([key, mission]) => {
                  const status = isMissionCompleted(key) ? 'completed' : getMissionStatus(key);

                  const isClaimable = status === 'claimable';
                  const isCompletedState = status === 'completed';
                  const progress = typeof status === 'object' ? status : { progressText: 'Done', progressPercent: 100 };

                  return (
                    <div key={key} className={`quest-card ${isCompletedState ? 'completed' : ''} ${isClaimable ? 'claimable-glow' : ''}`}>
                      <div className="quest-icon">
                        {isCompletedState ? '✅' : (isClaimable ? '🎁' : '⚡')}
                      </div>
                      <div className="quest-info" style={{ flex: 1 }}>
                        <h3>{mission.description || key.replace(/_/g, ' ')}</h3>
                        {!isCompletedState && !isClaimable && (
                          <div className="quest-progress-bar-bg">
                            <div className="quest-progress-bar-fill" style={{ width: `${progress.progressPercent}%` }}></div>
                          </div>
                        )}
                        <p style={{ marginTop: '5px', fontSize: '0.85rem' }}>
                          {isCompletedState ? 'Completed' : (isClaimable ? 'Ready to Claim!' : progress.progressText)}
                          <span style={{ float: 'right', color: 'var(--accent)' }}>+{mission.reward} XP</span>
                        </p>
                      </div>

                      <div className="quest-action">
                        {isClaimable && (
                          <button className="btn-claim" onClick={() => handleClaim(key, mission.reward)}>
                            CLAIM
                          </button>
                        )}
                        {isCompletedState && <div className="quest-check">DONE</div>}
                        {!isClaimable && !isCompletedState && (
                          <div className="quest-locked">IN PROGRESS</div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="settings-content">
            <h2 className="welcome-title">Settings</h2>
            <div className="settings-card">
              <div className="setting-item">
                <label>Theme Mode</label>
                <button
                  className="btn-3d btn-secondary"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                >
                  Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                </button>
              </div>

              <div className="setting-item">
                <label>Sound Effects</label>
                <button className="btn-3d btn-outline">ON</button>
              </div>

              <div className="setting-item">
                <label style={{ color: 'var(--danger)' }}>Reset Progress</label>
                <button
                  className="btn-3d btn-primary"
                  style={{ backgroundColor: 'var(--danger)', boxShadow: '0 4px 0 var(--danger-shadow)' }}
                  onClick={() => {
                    if (window.confirm('Really reset all progress?')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                >
                  RESET EVERYTHING
                </button>
              </div>
            </div>
          </div>
        );
      default: return <div>Select a menu</div>;
    }
  };

  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [selectedMerchImg, setSelectedMerchImg] = useState(null);

  // ... (existing renderContent function) ...

  return (
    <div className="base-page-container">
      <div className="dashboard-layout">

        {/* Modal for Locked Stage */}
        {showLockedModal && (
          <div className="modal-overlay" onClick={() => setShowLockedModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
              <h2 className="modal-title">Locked!</h2>
              <p className="modal-description">
                이전 단계를 먼저 완료해주세요!<br />
                Complete the previous stage to unlock this one.
              </p>
              <button className="btn-3d btn-primary" onClick={() => setShowLockedModal(false)}>
                OKAY
              </button>
            </div>
          </div>
        )}

        {/* Left Navigation */}
        <nav className="sidebar-nav-left">
          <div className="nav-logo">PrompE</div>
          {menuItems.map(item => (
            <div
              key={item.id}
              className={`left-nav-item ${activeMenu === item.id ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
            </div>
          ))}
        </nav>

        {/* Main Feed */}
        <main className="main-feed">
          {renderContent()}
        </main>

        {/* Right Stats Sidebar */}
        <aside className="sidebar-right">
          <div className="stat-panel">
            <h3>My Progress</h3>
            <div className="xp-row">
              <span>🔥</span> <span>{level} Day Streak</span>
            </div>
            <div className="xp-row">
              <span>💎</span> <span>{exp} XP</span>
            </div>
          </div>

          <div className="stat-panel">
            <h3>Daily Quests</h3>
            <div style={{ fontSize: '0.9rem', color: '#777' }}>Complete 1 Lesson</div>
            <div className="xp-row" style={{ height: '6px', background: '#eee', borderRadius: '4px', width: '100%', marginTop: '5px' }}>
              <div style={{ width: '60%', background: 'var(--accent)', height: '100%', borderRadius: '4px' }}></div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}

export default Base;