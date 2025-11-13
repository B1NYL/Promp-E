import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, RotateCcw, ImageIcon, LogOut } from 'lucide-react';
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
    const lessonId = 's2-block-coding';
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

  return (
    <div className="block-coding-page">
      <AiGuidePanel currentStep="results" />
      <main className="main-content-block result-main">
        <header className="block-header">
          <h1><ImageIcon className="header-icon" /> AI가 만든 작품</h1>
          <p>여러분이 조립한 문장으로 AI가 멋진 그림을 만들었어요!</p>
        </header>

        <div className="result-panel-block">
          <div className="final-prompt-display">
            <h3>완성된 프롬프트</h3>
            <p>{assembledPrompt}</p>
          </div>
          <div className="generated-image-container">
            {isGenerating ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>AI가 그림을 그리고 있어요...</p>
              </div>
            ) : error ? (
              <div className="error-container">
                <p>{error}</p>
              </div>
            ) : (
              <img src={generatedImage} alt="AI 생성 결과" />
            )}
          </div>
          <div className="result-actions-block">
            <button className="action-button-block" disabled={!generatedImage}>
              <Download size={18}/> 이미지 저장
            </button>
            <button className="action-button-block" onClick={handleReset}>
              <RotateCcw size={18}/> 다시 시작하기
            </button>
            <button className="action-button-block exit" onClick={handleExit}>
              <LogOut size={18}/> 목록으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default BlockResult;