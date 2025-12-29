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
          <h2>Unit 1</h2>
          <p>Basics of Prompt Engineering</p>
        </div>
        <button className="btn-3d btn-secondary">Guidebook</button>
      </div>

      <div style={{ position: 'relative', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '50px' }}>
        {/* SVG Background Path would go here, simplified layout for now */}

        {stages.map((stage, idx) => {
          const isUnlocked = idx === 0 || isCompleted(stages[idx - 1].id);
          const statusClass = isUnlocked ? stage.colorClass : 'stage-color-locked';

          return (
            <div key={stage.id} className="stage-node-wrapper">
              <button
                className={`stage-node-btn ${statusClass}`}
                onClick={() => isUnlocked && navigate(`/stage${stage.stage}`)}
                disabled={!isUnlocked}
              >
                {stage.icon}
              </button>
              {isCompleted(stage.id) && <div className="stage-star-crown">👑</div>}
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
            <h2 className="welcome-title">My Gallery</h2>
            <div className="creations-grid">
              {myCreations.length > 0 ? myCreations.map(c => (
                <div key={c.id} className="creation-card">
                  <img src={c.imageUrl.startsWith('http') ? c.imageUrl : `${BACKEND_URL}${c.imageUrl}`} className="creation-image" alt="art" />
                  <div className="creation-overlay">
                    <p className="creation-prompt">{c.prompt}</p>
                    <button className={`btn-3d btn-primary ${sharingStates[c.id] === 'shared' ? 'disabled' : ''}`} onClick={() => handleShare(c)}>
                      {sharingStates[c.id] === 'shared' ? 'SHARED' : 'SHARE'}
                    </button>
                  </div>
                </div>
              )) : <div className="empty-gallery">No art yet. Start learning!</div>}
            </div>
          </div>
        );
      case 'social': return <div className="coming-soon-content"><h2>Social Gallery</h2><p>Connect with other prompters!</p></div>; // Simplified for brevity in this specific task
      case 'mission': return <div className="mission-content"><h2>Active Quests</h2></div>;
      case 'settings': return <div className="settings-content"><h2>Settings</h2></div>;
      default: return <div>Select a menu</div>;
    }
  };

  return (
    <div className="base-page-container">
      <div className="dashboard-layout">

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