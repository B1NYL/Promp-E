import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, RotateCcw, ImageIcon, LogOut, Loader2, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { useActivity } from '../../services/ActivityContext';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useGallery } from '../../services/GalleryContext';
import '../../css/BlockCoding.css';
import AiGuidePanel from '../../components/AiGuidePanel';

function BlockResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addActivity } = useActivity();
  const { completeLesson, isCompleted } = useCompletion();
  const { gainExp, incrementCompletionCounts } = useUser(); // ★★★ incrementCompletionCounts 가져오기 ★★★
  const { addCreation } = useGallery();
  const { assembledPrompt } = location.state || {};

  const [generatedImage, setGeneratedImage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState(null);

  const hasGenerated = useRef(false);

  useEffect(() => {
    if (assembledPrompt && assembledPrompt !== "정보 없음" && !hasGenerated.current) {
      hasGenerated.current = true;
      const generate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
          const result = await api.generateImage(assembledPrompt, null);
          setGeneratedImage(result.image_url);

          addCreation({
            prompt: assembledPrompt,
            imageUrl: result.image_url,
          });

        } catch (err) {
          setError("이미지를 만드는 데 실패했어요. 다시 시도해 주세요. 😥");
          console.error(err);
          hasGenerated.current = false;
        } finally {
          setIsGenerating(false);
        }
      };
      generate();
    } else if (!assembledPrompt || assembledPrompt === "정보 없음") {
      setIsGenerating(false);
      setError("프롬프트 정보가 없어요. 처음부터 다시 시작해주세요.");
    }
  }, [assembledPrompt, addCreation]);

  // 공통 완료 처리 함수
  const handleCompleteAndMove = (path) => {
    const lessonId = 's3-block-coding';
    const wasAlreadyCompleted = isCompleted(lessonId);

    gainExp(100, wasAlreadyCompleted);

    if (!wasAlreadyCompleted) {
      addActivity({
        icon: '🧩',
        title: `[블록코딩] "${assembledPrompt.substring(0, 15)}..." 완성`,
        time: '방금 전'
      });
      completeLesson(lessonId);

      // ★★★ 오늘/이번 주 학습 카운트 +1 ★★★
      incrementCompletionCounts();
    }

    navigate(path);
  };

  const handleReset = () => {
    handleCompleteAndMove('/stage3/block-drawing');
  };

  const handleExit = () => {
    handleCompleteAndMove('/stage3');
  };

  // --- Tech Studio UI ---
  return (
    <div className="block-coding-page" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0f0f13', color: '#fff' }}>

      {/* Header */}
      <header className="block-header-modern" style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(20,20,30,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <ImageIcon size={28} color="#4ade80" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              작품 확인
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>AI가 만든 그림을 확인해보세요</p>
          </div>
        </div>
      </header>

      <main className="result-workspace" style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '40px',
        padding: '40px',
        overflow: 'hidden'
      }}>

        {/* Left: Image Display (Holographic Style) */}
        <div className="image-section" style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          background: 'rgba(20,20,30,0.5)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
        }}>
          <div className="holo-frame" style={{
            position: 'relative',
            padding: '10px',
            background: 'rgba(0,0,0,0.8)',
            borderRadius: '16px',
            border: '2px solid rgba(74, 222, 128, 0.3)',
            boxShadow: '0 0 30px rgba(74, 222, 128, 0.1), inset 0 0 20px rgba(74, 222, 128, 0.1)',
            maxWidth: '100%',
            maxHeight: '100%',
            overflow: 'hidden'
          }}>
            {isGenerating ? (
              <div style={{ width: '512px', height: '512px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                <div className="scan-line" />
                <Loader2 size={48} className="animate-spin" style={{ marginBottom: '20px' }} />
                <p style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>GENERATING...</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '10px' }}>AI가 그림을 그리고 있어요...</p>
              </div>
            ) : error ? (
              <div style={{ width: '512px', height: '512px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} style={{ marginTop: '20px', padding: '10px 20px', background: '#333', border: '1px solid #ef4444', color: '#fff', borderRadius: '8px' }}>다시 시도</button>
              </div>
            ) : (
              <img src={generatedImage} alt="AI Result" style={{ display: 'block', maxWidth: '100%', maxHeight: '600px', borderRadius: '8px' }} />
            )}

            {/* HUD Elements */}
            <div style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '2px solid #4ade80', borderLeft: '2px solid #4ade80' }} />
            <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '2px solid #4ade80', borderRight: '2px solid #4ade80' }} />
            <div style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '2px solid #4ade80', borderLeft: '2px solid #4ade80' }} />
            <div style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '2px solid #4ade80', borderRight: '2px solid #4ade80' }} />
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div className="info-section" style={{ display: 'flex', flexDirection: 'column', gap: '30px', justifyContent: 'center' }}>

          {/* Prompt Console */}
          <div className="prompt-console" style={{
            background: '#000',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '24px',
            fontFamily: 'monospace'
          }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '0.9rem', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} /> 내가 만든 주문 (PROMPT)
            </h3>
            <div style={{ color: '#fff', lineHeight: '1.6', fontSize: '1.1rem' }}>
              {assembledPrompt || "데이터 없음"}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="actions" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
              onClick={() => generatedImage && window.open(generatedImage, '_blank')}
              disabled={!generatedImage}
              className="tech-btn primary"
              style={{
                background: !generatedImage ? '#333' : 'linear-gradient(90deg, #22c55e, #10b981)',
                padding: '20px',
                borderRadius: '12px',
                border: 'none',
                color: '#fff',
                fontSize: '1.1rem',
                fontWeight: '700',
                cursor: generatedImage ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: generatedImage ? '0 0 20px rgba(34, 197, 94, 0.3)' : 'none'
              }}
            >
              <Download size={20} /> 저장하기
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <button
                onClick={handleReset}
                className="tech-btn secondary"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  color: '#ccc',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '0.95rem'
                }}
              >
                <RotateCcw size={18} /> 다시 만들기
              </button>
              <button
                onClick={handleExit}
                className="tech-btn secondary"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  color: '#ccc',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  fontSize: '0.95rem'
                }}
              >
                <LogOut size={18} /> 나가기
              </button>
            </div>
          </div>

        </div>

      </main>

      <style>{`
        .scan-line {
          width: 100%;
          height: 2px;
          background: #4ade80;
          position: absolute;
          animation: scan 2s linear infinite;
          box-shadow: 0 0 10px #4ade80;
          opacity: 0.5;
        }
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .tech-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      `}</style>
    </div>
  );
}

export default BlockResult;