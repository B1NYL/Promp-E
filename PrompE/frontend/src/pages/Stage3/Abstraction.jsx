import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Abstraction.css';

function Abstraction() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const { addActivity } = useActivity();
  
  const [emotion, setEmotion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [brushSize, setBrushSize] = useState(5);
  const [canSubmit, setCanSubmit] = useState(false);

  const previousDescription = location.state?.objectDescription || '';

  const defaultColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#2b2b2b'];
  const emotionHints = [{ text: "용감하게", emoji: "🦸" }, { text: "수줍게", emoji: "😊" }, { text: "카리스마 있게", emoji: "😎" }, { text: "평화롭게", emoji: "🕊️" }, { text: "신비롭게", emoji: "🔮" }, { text: "장난스럽게", emoji: "😜" }, { text: "위엄 있게", emoji: "👑" }, { text: "친근하게", emoji: "🤗" }];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      if (location.state?.previousImage) {
        const img = new Image();
        img.onload = () => { ctx.drawImage(img, 0, 0); setCanSubmit(true); };
        img.src = location.state.previousImage;
      }
    }
  }, [location.state]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || e.touches?.[0]?.clientX; const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = (clientX - rect.left) * scaleX; const y = (clientY - rect.top) * scaleY;
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true); setCanSubmit(true);
  };
  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d'); const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width; const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || e.touches?.[0]?.clientX; const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = (clientX - rect.left) * scaleX; const y = (clientY - rect.top) * scaleY;
    ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize; ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    setEmotion(''); setAiGeneratedImage(null); setCanSubmit(false);
  };

  const handleHintClick = (word) => {
    setEmotion(prev => prev ? `${prev}, ${word}` : word);
  };

  const handleSubmit = async () => {
    if (!emotion.trim()) { alert('감정이나 스타일을 입력해주세요!'); return; }
    if (!canSubmit) { alert('그림이 비어있습니다!'); return; }
    setIsProcessing(true);
    const finalPrompt = `${previousDescription}, ${emotion}`;
    const imageData = canvasRef.current.toDataURL('image/png');
    try {
      const result = await api.generateImage(finalPrompt, imageData);
      setAiGeneratedImage(result.image_url);
    } catch (error) {
      alert("이미지를 만드는 데 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setEmotion(''); setAiGeneratedImage(null);
  };

  const handleNext = () => {
    const finalPrompt = `${previousDescription}, ${emotion}`.trim();
    navigate('/stage3/verbalization', {
      state: {
        objectDescription: finalPrompt,
        previousImage: canvasRef.current.toDataURL('image/png')
      }
    });
  };

  return (
    <div className="abstraction-page">
      <header className="lesson-header"><button className="back-button" onClick={() => navigate('/stage3')}>← 돌아가기</button><ProgressTracker currentStep={4} /><div className="header-placeholder"></div></header>
      <main className="lesson-main">
        <div className="canvas-section"><div className="canvas-preview-header"><h3>🎨 감정이나 분위기를 그림에 표현해보세요</h3></div><div className="canvas-wrapper"><canvas ref={canvasRef} width={800} height={600} className="drawing-canvas" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/></div></div>
        <div className="control-panel">
          <div className="panel-section previous-info"><h3 className="section-title">📝 지금까지의 프롬프트</h3><p className="description-summary">{previousDescription}</p></div>
          {/* ★★★ 학습 가이드 섹션 다시 추가 ★★★ */}
          {!aiGeneratedImage && (
            <div className="panel-section guide-section">
              <h3 className="section-title">📚 학습 목표</h3>
              <div className="guide-list">
                <div className="guide-point">
                  <span className="point-num">1</span>
                  <p>눈에 보이지 않는 <strong>감정이나 스타일</strong> 추가하기</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">2</span>
                  <p><strong>프롬프트 + 느낌</strong> = 창의적인 결과물</p>
                </div>
              </div>
            </div>
          )}
          <div className="panel-section"><h3 className="section-title">✏️ 그리기 도구</h3><div className="color-grid">{defaultColors.map(color => (<button key={color} className={`color-dot ${currentColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => setCurrentColor(color)}/>))}</div><div className="custom-color"><label className="color-label"><input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} className="color-picker-input"/><span className="color-box" style={{ backgroundColor: currentColor }}></span><span>직접 선택</span></label></div><div className="brush-size"><label>굵기: {brushSize}px</label><input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="size-slider"/></div><button className="panel-btn clear-btn" onClick={clearCanvas} style={{marginTop: '15px'}}>🗑️ 처음부터 다시 그리기</button></div>
          <div className="panel-section"><h3 className="section-title">✨ 감정/스타일을 추가해주세요</h3><textarea id="emotion" className="emotion-textarea" placeholder="어떤 느낌인가요? 어떤 분위기인가요?" value={emotion} onChange={(e) => setEmotion(e.target.value)} rows={3} disabled={!!aiGeneratedImage}/></div>
          <div className="panel-section"><h3 className="section-title">💡 힌트 카드 (클릭하여 추가)</h3><div className="emotion-chips">{emotionHints.map((hint, index) => (<button key={index} className="emotion-chip" onClick={() => handleHintClick(hint.text)}>{hint.emoji} {hint.text}</button>))}</div></div>
          <div className="panel-section submit-panel"><button className="submit-button" onClick={handleSubmit} disabled={isProcessing || !emotion.trim() || !canSubmit || !!aiGeneratedImage}>{isProcessing ? '⏳ 생성 중...' : '🚀 AI에게 보내기'}</button></div>
          
      
        </div>
      </main>
      {aiGeneratedImage && (<section className="result-section-full"><div className="result-container"><h2 className="result-title">🤖 AI가 이해한 전체 장면</h2><div className="result-content"><div className="result-image-wrapper"><img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" /></div><div className="result-info"><div className="success-badge"><span className="badge-emoji">🎉</span><h3>상상력이 더해졌어요!</h3></div><div className="prompt-summary-box"><h4>최종 프롬프트</h4><p>"{previousDescription}, <strong>{emotion}</strong>"</p></div><div className="learning-box"><h4>💡 학습한 개념</h4><p><strong>프롬프트 + 스타일/감정 = 창의성</strong></p><p className="learning-desc">눈에 보이지 않는 느낌이나 스타일을 언어로 지정하여 더욱 창의적인 이미지를 만들 수 있습니다.</p></div><div className="result-actions"><button className="result-btn retry" onClick={handleRetry}>🔄 다시 하기</button><button className="result-btn next" onClick={handleNext}>다음 단계로 → (5단계: 언어화)</button></div></div></div></div></section>)}
    </div>
  );
}
export default Abstraction;