import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { api } from '../../services/api';
import { Wand2, Loader2 } from 'lucide-react';
import { useGallery } from '../../services/GalleryContext'; 
import '../../css/Verbalization.css';

function Verbalization() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addActivity } = useActivity();
  const { completeLesson, isCompleted } = useCompletion();
  const { gainExp } = useUser();
  const { addCreation } = useGallery();
  
  const [fullPrompt, setFullPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  
  const [dynamicHints, setDynamicHints] = useState({
    adjectives: { name: "묘사", color: "green", items: [] },
    verbs: { name: "상황/행동", color: "blue", items: [] },
    styles: { name: "감정/스타일", color: "purple", items: [] },
  });
  const [isLoadingHints, setIsLoadingHints] = useState(true);

  const previousPrompt = location.state?.objectDescription || '';

  useEffect(() => {
    if (previousPrompt) {
      const fetchHints = async () => {
        setIsLoadingHints(true);
        try {
          const hints = await api.generateHints(previousPrompt);
          setDynamicHints({
            adjectives: { name: "묘사", color: "green", items: hints.adjectives },
            verbs: { name: "상황/행동", color: "blue", items: hints.verbs },
            styles: { name: "감정/스타일", color: "purple", items: hints.styles },
          });
        } catch (error) {
          console.error("Failed to fetch hints:", error);
          setDynamicHints({
            adjectives: { name: "묘사", color: "green", items: ["알록달록한", "커다란"] },
            verbs: { name: "상황/행동", color: "blue", items: ["숲속에서 잠자는", "하늘을 날며"] },
            styles: { name: "감정/스타일", color: "purple", items: ["용감하게", "판타지 아트 스타일"] },
          });
        } finally {
          setIsLoadingHints(false);
        }
      };
      fetchHints();
    } else {
      setIsLoadingHints(false);
      setDynamicHints({
        adjectives: { name: "묘사", color: "green", items: ["알록달록한", "커다란"] },
        verbs: { name: "상황/행동", color: "blue", items: ["숲속에서 잠자는", "하늘을 날며"] },
        styles: { name: "감정/스타일", color: "purple", items: ["용감하게", "판타지 아트 스타일"] },
      });
    }
  }, [previousPrompt]);

  const handleHintClick = (word) => {
    setFullPrompt(prev => prev ? `${prev.trim()}, ${word}` : word);
  };

  const handleSubmit = async () => {
    if (!fullPrompt.trim()) {
      alert('프롬프트를 작성해주세요!');
      return;
    }
    setIsProcessing(true);
    try {
      const result = await api.generateImage(fullPrompt, null);
      setAiGeneratedImage(result.image_url);

      addCreation({
        prompt: fullPrompt,
        imageUrl: result.image_url,
      });
    } catch (error) {
      alert("이미지를 만드는 데 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setFullPrompt('');
    setAiGeneratedImage(null);
  };

  const handleFinish = () => {
    const lessonId = 's2-promptutoring';
    const wasAlreadyCompleted = isCompleted(lessonId);
    
    gainExp(250, wasAlreadyCompleted);
    
    if (!wasAlreadyCompleted) {
      addActivity({
        icon: '🎓',
        title: `[프롬프튜터링] 5단계 미션 완료!`,
        time: '방금 전'
      });
      completeLesson(lessonId);
    }
    
    navigate('/stage3');
  };

  return (
    <div className="verbalization-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage3')}>← 돌아가기</button>
        <ProgressTracker currentStep={5} />
        <div className="header-placeholder"></div>
      </header>

      <main className="verbalization-main">
        <div className="verbalization-workspace">
          <div className="mission-card-final">
            <div className="card-icon">✍️</div>
            <div className="card-content">
              <h3>최종 도전: 언어화</h3>
              <p>그림 없이 오직 글자로만 상상 속 이미지를 만들어보세요!</p>
            </div>
          </div>
          <div className="prompt-input-area">
            <label htmlFor="fullPrompt" className="prompt-label">나만의 프롬프트 만들기</label>
            <textarea
              id="fullPrompt"
              className="prompt-textarea-main"
              placeholder="예: 구름 위를 걷고 있는 무지갯빛 날개를 가진 아기 사자, 용감하게 포효하는 모습, 판타지 아트 스타일"
              value={fullPrompt}
              onChange={(e) => setFullPrompt(e.target.value)}
              rows={10}
              disabled={!!aiGeneratedImage}
            />
          </div>
        </div>

        <div className="control-panel">
          <div className="panel-section">
            <h3 className="section-title">💡 AI 추천 힌트</h3>
            <div className="hint-categories">
              {isLoadingHints ? (
                <p className="hint-loading">AI가 힌트를 만들고 있어요...</p>
              ) : (
                Object.values(dynamicHints).map(category => (
                  category.items.length > 0 && (
                    <div key={category.name} className="hint-category">
                      <h4 className={`hint-category-title ${category.color}`}>{category.name}</h4>
                      <div className="hint-chips">
                        {category.items.map((word) => (
                          <button key={word} className={`hint-chip ${category.color}`} onClick={() => handleHintClick(word)}>{word}</button>
                        ))}
                      </div>
                    </div>
                  )
                ))
              )}
            </div>
          </div>
          <div className="panel-section submit-panel">
            <button className="submit-button" onClick={handleSubmit} disabled={isProcessing || !fullPrompt.trim() || !!aiGeneratedImage}>
              {isProcessing ? (<><Loader2 className="animate-spin" /> 생성 중...</>) : '🎨 이미지 생성하기'}
            </button>
          </div>
        </div>
      </main>

      {aiGeneratedImage && (
        <section className="result-section-full">
          <div className="result-container">
            <h2 className="result-title">🏆 프롬프트 마스터!</h2>
            <div className="result-content">
              <div className="result-image-wrapper"><img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" /></div>
              <div className="result-info">
                <div className="success-badge"><span className="badge-emoji">🎉</span><h3>완벽해요! 모든 단계를 마쳤습니다!</h3></div>
                <div className="prompt-summary-box"><h4>최종 완성 프롬프트</h4><p>"{fullPrompt}"</p></div>
                <div className="learning-box"><h4>💡 학습한 개념</h4><p><strong>그림(시각) → 텍스트(언어) 전환</strong></p><p className="learning-desc">이제 그림 없이도 머릿속 생각을 온전히 언어로 표현하여 AI와 소통할 수 있게 되었습니다.</p></div>
                <div className="result-actions"><button className="result-btn retry" onClick={handleRetry}>🔄 다시 도전하기</button><button className="result-btn next" onClick={handleFinish}>Stage 3 목록으로</button></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default Verbalization;