import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Situation.css';

function Situation() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const { addActivity } = useActivity();
  
  const [situation, setSituation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [brushSize, setBrushSize] = useState(5);
  const [canSubmit, setCanSubmit] = useState(false);

  const previousDescription = location.state?.objectDescription || '';

  const defaultColors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#2b2b2b'];

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
    setSituation(''); setAiGeneratedImage(null); setCanSubmit(false);
  };

  const handleSubmit = async () => {
    if (!situation.trim()) { alert('상황을 입력해주세요!'); return; }
    if (!canSubmit) { alert('그림이 비어있습니다!'); return; }
    setIsProcessing(true);
    const finalPrompt = `${previousDescription} ${situation}`;
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
    setSituation(''); setAiGeneratedImage(null);
  };

  const handleNext = () => {
    const finalPrompt = `${previousDescription} ${situation}`.trim();
    navigate('/stage3/abstraction', {
      state: {
        objectDescription: finalPrompt,
        previousImage: canvasRef.current.toDataURL('image/png')
      }
    });
  };

  return (
    <div className="situation-page">
      <header className="lesson-header"><button className="back-button" onClick={() => navigate('/stage3')}>← 돌아가기</button><ProgressTracker currentStep={3} /><div className="header-placeholder"></div></header>
      <main className="lesson-main">
        <div className="canvas-section"><div className="canvas-preview-header"><h3>🎨 장소나 행동을 그림에 추가해보세요</h3></div><div className="canvas-wrapper"><canvas ref={canvasRef} width={800} height={600} className="drawing-canvas" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/></div></div>
        <div className="control-panel">
          <div className="panel-section previous-info"><h3 className="section-title">📝 지금까지의 묘사</h3><p className="description-summary">{previousDescription}</p></div>
          {!aiGeneratedImage && (<div className="panel-section guide-section"><h3 className="section-title">📚 학습 목표</h3><div className="guide-list"><div className="guide-point"><span className="point-num">1</span><p><strong>장소</strong>와 <strong>행동</strong>을 추가하여 장면 만들기</p></div><div className="guide-point"><span className="point-num">2</span><p><strong>사물 + 상황/행동</strong> = 완성된 장면</p></div></div></div>)}
          <div className="panel-section"><h3 className="section-title">✏️ 그리기 도구</h3><div className="color-grid">{defaultColors.map(color => (<button key={color} className={`color-dot ${currentColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => setCurrentColor(color)}/>))}</div><div className="custom-color"><label className="color-label"><input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} className="color-picker-input"/><span className="color-box" style={{ backgroundColor: currentColor }}></span><span>직접 선택</span></label></div><div className="brush-size"><label>굵기: {brushSize}px</label><input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="size-slider"/></div><button className="panel-btn clear-btn" onClick={clearCanvas} style={{marginTop: '15px'}}>🗑️ 처음부터 다시 그리기</button></div>
          <div className="panel-section"><h3 className="section-title">🎬 상황을 추가해주세요</h3><textarea id="situation" className="situation-textarea" placeholder="어디에 있나요? 무엇을 하고 있나요? (예: 숲속에서 잠자는)" value={situation} onChange={(e) => setSituation(e.target.value)} rows={3} disabled={!!aiGeneratedImage}/></div>
          <div className="tip-box"><strong>💡 팁:</strong> 배경(장소)과 행동(동작)을 함께 설명하면 더 생동감 있는 장면이 만들어져요!</div>
          <div className="panel-section submit-panel"><button className="submit-button" onClick={handleSubmit} disabled={isProcessing || !situation.trim() || !canSubmit || !!aiGeneratedImage}>{isProcessing ? '⏳ 생성 중...' : '🚀 AI에게 보내기'}</button></div>
        </div>
      </main>
      {aiGeneratedImage && (<section className="result-section-full"><div className="result-container"><h2 className="result-title">🤖 AI가 이해한 전체 장면</h2><div className="result-content"><div className="result-image-wrapper"><img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" /></div><div className="result-info"><div className="success-badge"><span className="badge-emoji">🎉</span><h3>장면이 완성됐어요!</h3></div><div className="prompt-summary-box"><h4>최종 프롬프트</h4><p>"{previousDescription} <strong>{situation}</strong>"</p></div><div className="learning-box"><h4>💡 학습한 개념</h4><p><strong>사물 + 상황/행동 = 장면</strong></p><p className="learning-desc">장면을 구체적으로 설명하면 AI가 더 풍부하고 생동감 있는 이미지를 만듭니다.</p></div><div className="result-actions"><button className="result-btn retry" onClick={handleRetry}>🔄 다시 하기</button><button className="result-btn next" onClick={handleNext}>다음 단계로 → (4단계: 추상화)</button></div></div></div></div></section>)}
    </div>
  );
}
export default Situation;