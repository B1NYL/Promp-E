import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Cognition.css';

function Cognition() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { addActivity } = useActivity();
  const [isDrawing, setIsDrawing] = useState(false);
  const [objectName, setObjectName] = useState('');
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [brushSize, setBrushSize] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);

  const defaultColors = ['#2b2b2b', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

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
    setObjectName(''); setAiGeneratedImage(null); setCanSubmit(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2; const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setCanSubmit(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!objectName.trim()) { alert('그린 사물의 이름을 입력해주세요!'); return; }
    if (!canSubmit) { alert('그림을 그리거나 이미지를 업로드해주세요!'); return; }
    setIsProcessing(true);
    const imageData = canvasRef.current.toDataURL('image/png');
    try {
      const result = await api.generateImage(objectName, imageData);
      setAiGeneratedImage(result.image_url);
    } catch (error) {
      alert("이미지를 만드는 데 실패했어요. 다시 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    clearCanvas();
  };

  const handleNext = () => {
    navigate('/stage3/description', {
      state: {
        objectName: objectName,
        previousImage: canvasRef.current.toDataURL('image/png')
      }
    });
  };

  return (
    <div className="cognition-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage3')}>← 돌아가기</button>
        <ProgressTracker currentStep={1} />
        <div className="header-placeholder"></div>
      </header>

      <main className="lesson-main">
        <div className="canvas-section">
          <div className="canvas-wrapper"><canvas ref={canvasRef} width={800} height={600} className="drawing-canvas" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}/></div>
        </div>
        <div className="control-panel">
                    {!aiGeneratedImage && (<div className="panel-section guide-section"><h3 className="section-title">📚 학습 목표</h3><div className="guide-list"><div className="guide-point"><span className="point-num">1</span><p>그린 것의 <strong>이름</strong>을 알려주기</p></div><div className="guide-point"><span className="point-num">2</span><p><strong>그림 + 명사</strong> = AI의 이해</p></div></div></div>)}
          <div className="panel-section"><h3 className="section-title">📂 파일 관리</h3><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }}/><button className="panel-btn upload-btn" onClick={() => fileInputRef.current?.click()}>📁 사진 업로드</button><button className="panel-btn clear-btn" onClick={clearCanvas}>🗑️ 지우기</button></div>
          <div className="panel-section"><h3 className="section-title">🎨 색상 선택</h3><div className="color-grid">{defaultColors.map(color => (<button key={color} className={`color-dot ${currentColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => setCurrentColor(color)}/>)) }</div><div className="custom-color"><label className="color-label"><input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} className="color-picker-input"/><span className="color-box" style={{ backgroundColor: currentColor }}></span><span>직접 선택</span></label></div><div className="brush-size"><label>굵기: {brushSize}px</label><input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="size-slider"/></div></div>
          <div className="panel-section"><h3 className="section-title">✍️ 사물의 이름</h3><input type="text" className="object-input" placeholder="예: 사과" value={objectName} onChange={(e) => setObjectName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSubmit()} disabled={!!aiGeneratedImage}/><button className="submit-button" onClick={handleSubmit} disabled={isProcessing || !canSubmit || !objectName.trim() || !!aiGeneratedImage}>{isProcessing ? '⏳ 처리 중...' : '🚀 AI에게 보내기'}</button></div>
        </div>
      </main>

      {aiGeneratedImage && (
        <section className="result-section-full">
          <div className="result-container">
            <h2 className="result-title">🤖 AI가 이해한 그림</h2>
            <div className="result-content">
              <div className="result-image-wrapper"><img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" /></div>
              <div className="result-info">
                <div className="success-badge"><span className="badge-emoji">🎉</span><h3>AI가 이해했어요!</h3></div>
                <p className="result-text">AI가 <strong>"{objectName}"</strong>을(를) 이해했어요!</p>
                <div className="learning-box"><h4>💡 학습한 개념</h4><p><strong>그림 + 명사 = AI의 이해</strong></p><p className="learning-desc">내가 그린 것의 '이름'을 알려주는 것이 AI와의 소통의 첫걸음입니다.</p></div>
                <div className="result-actions"><button className="result-btn retry" onClick={handleRetry}>🔄 다시 하기</button><button className="result-btn next" onClick={handleNext}>다음 단계로 → (2단계: 묘사)</button></div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
export default Cognition;