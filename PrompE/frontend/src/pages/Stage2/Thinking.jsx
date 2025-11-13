import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Cognition.css'; // 스타일은 Cognition과 공유
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useActivity } from '../../services/ActivityContext';
import { Upload, Trash2, Pencil } from 'lucide-react'; // 아이콘 추가

function Thinking() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const { completeLesson, isCompleted } = useCompletion();
  const { gainExp } = useUser();
  const { addActivity } = useActivity();
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [brushSize, setBrushSize] = useState(5);

  const defaultColors = [
    '#2b2b2b', '#FF6B6B', '#4ECDC4', '#FFE66D', 
    '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3',
    '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E'
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const isTouchEvent = e.touches && e.touches.length > 0;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize; ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
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
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFinishThinking = () => {
    const lessonId = 's2-thinking';
    const wasAlreadyCompleted = isCompleted(lessonId);

    gainExp(30, wasAlreadyCompleted);
    
    if (!wasAlreadyCompleted) {
      addActivity({
        icon: '🤔',
        title: '[자유 활동] 생각 정리 완료',
        time: '방금 전'
      });
      completeLesson(lessonId);
    }

    navigate('/stage2');
  };

  return (
    <div className="cognition-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage2')}>
          ← 돌아가기
        </button>
        <h1 className="page-title">자유롭게 생각하기</h1>
        <div className="header-placeholder"></div>
      </header>

      <main className="lesson-main">
        {/* 왼쪽: 캔버스 */}
        <div className="canvas-section">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="drawing-canvas"
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
          </div>
        </div>

        {/* 오른쪽: 컨트롤 패널 */}
        <div className="control-panel">
          <div className="panel-section">
            <h3 className="section-title">📂 파일 관리</h3>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button className="panel-btn upload-btn" onClick={() => fileInputRef.current?.click()}>
              <Upload size={14}/> 사진 업로드
            </button>
            <button className="panel-btn clear-btn" onClick={clearCanvas}>
              <Trash2 size={14}/> 모두 지우기
            </button>
          </div>

          <div className="panel-section">
            <h3 className="section-title">🎨 색상 선택</h3>
            <div className="color-grid">
              {defaultColors.map(color => (
                <button
                  key={color}
                  className={`color-dot ${currentColor === color ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>
            <div className="custom-color">
              <label className="color-label">
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => setCurrentColor(e.target.value)}
                  className="color-picker-input"
                />
                <span className="color-box" style={{ backgroundColor: currentColor }}></span>
                <span>직접 선택</span>
              </label>
            </div>
            <div className="brush-size">
              <label>굵기: {brushSize}px</label>
              <input
                type="range"
                min="2"
                max="20"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="size-slider"
              />
            </div>
          </div>
          
          <div className="panel-section submit-panel">
            <button
              className="submit-button"
              onClick={handleFinishThinking}
            >
              생각 끝내기
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Thinking;