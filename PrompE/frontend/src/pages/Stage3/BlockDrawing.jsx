import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Palette, Pencil, Upload, Trash2, Loader2,
  ChevronLeft, CheckCircle, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
// Use Cognition.css for the GoodNotes layout consistency
import '../../css/Cognition.css';
// Keep BlockCoding.css for specific modals if needed
import '../../css/BlockCoding.css';

function BlockDrawing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [subject, setSubject] = useState('');
  const [canProceed, setCanProceed] = useState(false);
  const [currentColor, setCurrentColor] = useState('#00FFFF'); // Start with Neon Cyan
  const [brushSize, setBrushSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [isLoading, setIsLoading] = useState(false);
  const [isIntroModalOpen, setIsIntroModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false); // New modal for naming

  // Tools state for UI consistency
  const [activeTool, setActiveTool] = useState('pen'); // 'pen', 'pencil', 'eraser'
  const [pencilPattern, setPencilPattern] = useState(null);

  const presetColors = ['#FFFFFF', '#00FFFF', '#FFFF00', '#FF00FF'];
  const presetSizes = [2, 4, 8, 12];
  const presetEraserSizes = [
    { size: 10, label: '매우 작게' },
    { size: 20, label: '작게' },
    { size: 40, label: '중간' },
    { size: 60, label: '크게' }
  ];

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBlockDrawing');
    if (!hasVisited) {
      setIsIntroModalOpen(true);
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      handleResize();
      window.addEventListener('resize', handleResize);
    }
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate Pencil Noise Pattern (Copied from Thinking.jsx)
  useEffect(() => {
    if (activeTool === 'pencil') {
      const size = 64;
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = size;
      patternCanvas.height = size;
      const pCtx = patternCanvas.getContext('2d');

      pCtx.fillStyle = currentColor;
      pCtx.fillRect(0, 0, size, size);

      const imageData = pCtx.getImageData(0, 0, size, size);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random();
        if (noise < 0.6) {
          data[i + 3] = 0;
        } else {
          data[i + 3] = Math.floor(noise * 150 + 50);
        }
      }
      pCtx.putImageData(imageData, 0, 0);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        const pattern = ctx.createPattern(patternCanvas, 'repeat');
        setPencilPattern(pattern);
      }
    }
  }, [currentColor, activeTool]);


  const handleResize = () => {
    const canvas = canvasRef.current;
    const parent = canvas.parentElement;
    if (canvas && parent) {
      const ctx = canvas.getContext('2d');
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCanvas.getContext('2d').drawImage(canvas, 0, 0);

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      ctx.drawImage(tempCanvas, 0, 0);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const closeIntroModal = () => {
    localStorage.setItem('hasVisitedBlockDrawing', 'true');
    setIsIntroModalOpen(false);
  };

  const getCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const isTouchEvent = e.touches && e.touches.length > 0;
    const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
    const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCanProceed(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);

    ctx.globalAlpha = 1.0;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize;
      ctx.strokeStyle = '#000';
    } else if (activeTool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pencilPattern || currentColor;
      ctx.lineWidth = brushSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = brushSize;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath(); // Close path so patterns don't leak
    ctx.globalCompositeOperation = 'source-over';
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setCanProceed(false);
    setSubject('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.globalCompositeOperation = 'source-over';
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setCanProceed(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNextClick = () => {
    if (!canProceed) {
      alert('먼저 그림을 그려주세요!');
      return;
    }
    setIsNameModalOpen(true); // Open name modal instead of direct nav
  };

  const confirmNext = async () => {
    if (!subject.trim()) {
      alert('청사진의 이름을 입력해주세요!');
      return;
    }
    setIsLoading(true);
    try {
      const suggestedKeywords = await api.suggestKeywords(subject);
      const drawingData = canvasRef.current.toDataURL('image/png');
      navigate('/stage3/block-assembly', {
        state: { subject: subject, drawingData, suggestedKeywords },
      });
    } catch (error) {
      alert('AI가 블록을 만드는 데 실패했어요. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
      setIsNameModalOpen(false);
    }
  };

  return (
    <div className="cognition-page goodnotes-layout">
      {isIntroModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">🧩</div>
            <h2 className="modal-title">미션: 청사진 설계</h2>
            <p className="modal-description">
              프롬프트로 만들기 원하는 대상을 먼저 그려보세요.<br />
              그림을 바탕으로 로직 블록을 생성해드립니다!
            </p>
            <button className="modal-close-btn" onClick={closeIntroModal}>
              그리기 시작
            </button>
          </div>
        </div>
      )}

      {/* Name Input Modal */}
      {isNameModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-icon" style={{ fontSize: '40px' }}><Sparkles size={40} color="#00FFFF" /></div>
            <div className="modal-icon" style={{ fontSize: '40px' }}><Sparkles size={40} color="#00FFFF" /></div>
            <h2 className="modal-title">청사진 이름 짓기</h2>
            <p className="modal-description">
              무엇을 그렸나요? 이름을 지어주면 블록을 생성합니다.
            </p>
            <input
              type="text"
              autoFocus
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 사이버 드래곤, 우주 고양이..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid rgba(88, 196, 220, 0.3)',
                background: 'rgba(0,0,0,0.3)',
                color: 'white',
                fontSize: '1.2rem',
                marginBottom: '20px',
                textAlign: 'center'
              }}
              onKeyDown={(e) => e.key === 'Enter' && confirmNext()}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                className="modal-close-btn"
                onClick={() => setIsNameModalOpen(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                취소
              </button>
              <button
                className="modal-close-btn"
                onClick={confirmNext}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : '블록 생성하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Toolbar */}
      <header className="gn-header">
        <div className="gn-left">
          <button className="gn-back-btn" onClick={() => navigate('/stage3')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="gn-title">미션 1: 청사진</h1>
        </div>

        <div className="gn-toolbar">
          {/* Tool Group */}
          <div className="gn-tool-group">
            <button
              className={`gn-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
              onClick={() => setActiveTool('pen')}
              title="볼펜"
            >
              <Pencil size={20} />
            </button>
            <button
              className={`gn-tool-btn ${activeTool === 'pencil' ? 'active' : ''}`}
              onClick={() => setActiveTool('pencil')}
              title="연필"
            >
              <Sparkles size={18} /> {/* Use Sparkle for Pencil/Magic feel */}
            </button>
            <button
              className={`gn-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setActiveTool('eraser')}
              title="지우개"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="gn-separator"></div>

          {/* Properties Group - Context Aware */}
          <div className="gn-props-group">
            {activeTool === 'eraser' ? (
              <div className="gn-sizes" title="지우개 크기">
                {presetEraserSizes.map((preset) => (
                  <button
                    key={preset.size}
                    className={`gn-size-btn ${eraserSize === preset.size ? 'active' : ''}`}
                    onClick={() => setEraserSize(preset.size)}
                    title={preset.label}
                  >
                    <div style={{
                      width: Math.min(30, preset.size / 2 + 6),
                      height: Math.min(30, preset.size / 2 + 6),
                      backgroundColor: 'currentColor',
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.2)'
                    }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="gn-colors" title="색상">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className={`gn-color-btn ${currentColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => { setCurrentColor(color); }}
                    />
                  ))}
                  <label className="gn-color-picker-label">
                    <input
                      type="color"
                      value={currentColor}
                      onChange={(e) => { setCurrentColor(e.target.value); }}
                    />
                    <div className="gn-rainbow-wheel"></div>
                  </label>
                </div>

                <div className="gn-sizes" title="두께">
                  {presetSizes.map(size => (
                    <button
                      key={size}
                      className={`gn-size-btn ${brushSize === size ? 'active' : ''}`}
                      onClick={() => setBrushSize(size)}
                    >
                      <div style={{ width: size === 2 ? 6 : size + 4, height: size === 2 ? 6 : size + 4, backgroundColor: 'currentColor', borderRadius: '50%' }} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="gn-separator"></div>

          {/* Actions Group */}
          <div className="gn-actions-group">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button className="gn-tool-btn" onClick={() => fileInputRef.current?.click()} title="이미지 추가">
              <ImageIcon size={20} />
            </button>
            <button className="gn-tool-btn danger" onClick={clearCanvas} title="캔버스 지우기">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

        <div className="gn-right">
          <button className="gn-finish-btn" onClick={handleNextClick}>
            <CheckCircle size={20} />
            <span>완료</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <main className="gn-canvas-area">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
          />
        </div>
      </main>
    </div>
  );
}

export default BlockDrawing;