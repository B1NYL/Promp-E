import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { api } from '../../services/api';
import { Wand2, Loader2, Award, Zap, RefreshCw, ArrowRight } from 'lucide-react';
import { useGallery } from '../../services/GalleryContext';
import '../../css/Verbalization.css';

function Verbalization() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addActivity } = useActivity();
  const { completeLesson, isCompleted } = useCompletion();
  const { gainExp, incrementCompletionCounts } = useUser();
  const { addCreation } = useGallery();

  const [fullPrompt, setFullPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);

  const [dynamicHints, setDynamicHints] = useState({
    adjectives: { name: "DESCRIPTION", color: "#4ade80", items: [] },
    verbs: { name: "CONTEXT", color: "#3b82f6", items: [] },
    styles: { name: "STYLE", color: "#d946ef", items: [] },
  });
  const [isLoadingHints, setIsLoadingHints] = useState(true);
  const lastHintPromptRef = useRef(null);

  const previousPrompt = location.state?.objectDescription || '';

  useEffect(() => {
    if (previousPrompt) { setFullPrompt(previousPrompt); }
    const fetchHints = async () => {
      try {
        if (!previousPrompt) return;
        if (lastHintPromptRef.current === previousPrompt) return;
        lastHintPromptRef.current = previousPrompt;
        setIsLoadingHints(true);
        const response = await api.generateHints(previousPrompt);
        setDynamicHints({
          adjectives: { name: "DESCRIPTION", color: "#4ade80", items: response.adjectives || [] },
          verbs: { name: "CONTEXT", color: "#3b82f6", items: response.verbs || [] },
          styles: { name: "STYLE", color: "#d946ef", items: response.styles || [] },
        });
      } catch (error) {
        console.error(error);
        setDynamicHints({
          adjectives: { name: "DESCRIPTION", color: "#4ade80", items: ["반짝이는", "거대한", "신비로운", "오래된"] },
          verbs: { name: "CONTEXT", color: "#3b82f6", items: ["춤추고 있는", "날아다니는", "잠자고 있는"] },
          styles: { name: "STYLE", color: "#d946ef", items: ["사이버펑크 스타일", "수채화 스타일", "3D 렌더링", "픽셀 아트"] },
        });
      } finally {
        setIsLoadingHints(false);
      }
    };
    fetchHints();
  }, [previousPrompt]);

  const handleHintClick = (word) => {
    setFullPrompt(prev => prev ? `${prev.trim()}, ${word}` : word);
  };

  const handleSubmit = async () => {
    if (!fullPrompt.trim()) { alert('프롬프트를 작성해주세요!'); return; }
    setIsProcessing(true);
    try {
      const result = await api.generateImage(fullPrompt, null);
      setAiGeneratedImage(result.image_url);
      addCreation({ prompt: fullPrompt, imageUrl: result.image_url });
    } catch (error) { alert("Error generating image"); } finally { setIsProcessing(false); }
  };

  const handleFinish = () => {
    const lessonId = 's3-promptutoring';
    const wasAlreadyCompleted = isCompleted(lessonId);
    gainExp(250, wasAlreadyCompleted);
    if (!wasAlreadyCompleted) {
      addActivity({ icon: '🎓', title: `[프롬프튜터링] 5단계 미션 완료!`, time: '방금 전' });
      completeLesson(lessonId);
    }
    incrementCompletionCounts();
    navigate('/stage3');
  };

  // --- Styles ---
  const pageStyle = { background: '#0f0f13', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard', sans-serif" };
  const headerStyle = { padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(20,20,30,0.8)', backdropFilter: 'blur(10px)' };
  const containerStyle = { flex: 1, display: 'flex', padding: '40px', gap: '40px', alignItems: 'stretch', maxWidth: '1600px', margin: '0 auto', width: '100%', height: 'calc(100vh - 100px)' };
  const canvasSectionStyle = { flex: 2, background: '#1a1a23', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', minWidth: '600px', minHeight: '600px' };
  const controlPanelStyle = { flex: 1, background: 'rgba(30, 30, 40, 0.6)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '350px' };
  const sectionTitleStyle = { color: '#3b82f6', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' };

  return (
    <div className="verbalization-page" style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/stage3')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', padding: 0 }}>
          <ArrowRight size={24} style={{ transform: 'rotate(180deg)' }} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            프롬프튜터링: 언어화 (Verbalization)
          </h1>
          <ProgressTracker currentStep={5} />
        </div>
      </header>

      <main style={containerStyle}>

        {/* Main Text Content (Replaces Canvas) */}
        <div style={canvasSectionStyle}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={sectionTitleStyle}>FINAL PROMPT SCRIPT</h3>
              <button
                onClick={() => setFullPrompt('')}
                style={{ padding: '8px 12px', background: '#333', border: '1px solid #444', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                지우개
              </button>
            </div>
            <textarea
              value={fullPrompt}
              onChange={e => setFullPrompt(e.target.value)}
              placeholder="최종적으로 완성된 프롬프트가 여기에 표시됩니다."
              style={{ flex: 1, width: '100%', background: '#0f172a', border: 'none', color: '#fff', fontSize: '1.5rem', lineHeight: '1.6', outline: 'none', resize: 'none', padding: '30px', borderRadius: '16px', fontFamily: 'monospace' }}
            />
          </div>
        </div>

        {/* Hints Panel */}
        <div style={controlPanelStyle}>
          {/* Info Section */}
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px', color: '#4ade80' }}>🎯 MISSION</h3>
            <p style={{ color: '#fff', lineHeight: '1.4', margin: 0 }}>
              AI가 장면을 완성할 수 있도록<br /><strong>마지막 디테일</strong>을 더해주세요.
            </p>
          </div>

          {/* AI Suggestions (Tools) */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', marginBottom: '15px' }}>
              <Zap size={20} fill="#f59e0b" color="#f59e0b" />
              <h3 style={{ ...sectionTitleStyle, color: '#4ade80', margin: 0 }}>AI SUGGESTIONS</h3>
            </div>
            {isLoadingHints && (
              <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '15px' }}>AI가 추천을 만드는 중...</p>
            )}

            {Object.values(dynamicHints).map((cat, idx) => (
              <div key={idx} style={{ marginBottom: '20px' }}>
                <div style={{ color: cat.color, fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px', textTransform: 'uppercase' }}>{cat.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {cat.items.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleHintClick(item)}
                      style={{
                        background: '#333',
                        border: '1px solid #444',
                        color: '#fff',
                        padding: '8px 12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = cat.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = '#444'}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !fullPrompt.trim() || !!aiGeneratedImage}
              style={{
                width: '100%', padding: '16px',
                background: !fullPrompt.trim() ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
                color: !fullPrompt.trim() ? '#666' : '#fff',
                border: 'none', borderRadius: '12px', fontWeight: 'bold',
                cursor: !fullPrompt.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: !fullPrompt.trim() ? 'none' : '0 4px 20px rgba(59, 130, 246, 0.4)'
              }}
            >
              {isProcessing ? <><Loader2 className="animate-spin" /> GENERATING...</> : <><Wand2 size={20} /> FINAL GENERATE</>}
            </button>
          </div>
        </div>
      </main>

      {/* Result Modal */}
      {aiGeneratedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a23', padding: '40px', borderRadius: '30px', border: '1px solid #4ade80', boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)', maxWidth: '1100px', width: '90%', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <img src={aiGeneratedImage} style={{ width: '100%', borderRadius: '16px', border: '2px solid #333' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                🎉 MISSION ACCOMPLISHED
              </div>
              <h2 style={{ fontSize: '2.5rem', margin: 0, marginBottom: '20px', lineHeight: 1.2 }}>
                언어화(Verbalization) <br /><span style={{ color: '#4ade80' }}>과정 완료!</span>
              </h2>

              <div style={{ background: '#222', padding: '20px', borderRadius: '16px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>💡 Final Prompt</h4>
                <p style={{ color: '#fff', fontFamily: 'monospace', lineHeight: '1.5' }}>
                  "{fullPrompt}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => { setAiGeneratedImage(null); setFullPrompt(''); }} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: '#333', color: '#fff', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <RefreshCw size={18} /> 다시 하기
                </button>
                <button onClick={handleFinish} style={{ flex: 1, padding: '16px', borderRadius: '12px', border: 'none', background: '#4ade80', color: '#000', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  과정 수료하기 <Award size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Verbalization;
