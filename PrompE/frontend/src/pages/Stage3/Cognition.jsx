import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import { ChevronLeft, Upload, Trash2, Send, RotateCcw, ArrowRight, Download, Eraser } from 'lucide-react';
import '../../css/Cognition.css';

import CustomColorPicker from '../../components/CustomColorPicker';

function Cognition() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { addActivity } = useActivity();
  const [isDrawing, setIsDrawing] = useState(false);
  const [objectName, setObjectName] = useState('');
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  const [latestImageData, setLatestImageData] = useState('');
  const [canSubmit, setCanSubmit] = useState(false);

  const defaultColors = ['#2b2b2b', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#FFFFFF'];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Optimize drawing with ref to avoid closure staleness and re-calc
  const drawingState = useRef({ isDrawing: false });
  const containerRef = useRef(null);

  // Dynamic Canvas Resizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      // Get container dimensions
      const { width, height } = container.getBoundingClientRect();

      // Prevent unnecessary resize
      if (canvas.width === width && canvas.height === height) return;

      // Set actual resolution to match display size (1:1 mapping)
      canvas.width = width;
      canvas.height = height;

      // Re-initialize context styles after resize
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height); // Fill white background
    };

    // Initial size
    updateCanvasSize();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawingState.current.isDrawing = true;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = (e.clientX !== undefined) ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = (e.clientY !== undefined) ? e.clientY : e.touches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCanSubmit(true);
  };

  const draw = (e) => {
    if (!drawingState.current.isDrawing) return;

    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    const clientX = (e.clientX !== undefined) ? e.clientX : e.touches?.[0]?.clientX;
    const clientY = (e.clientY !== undefined) ? e.clientY : e.touches?.[0]?.clientY;

    if (clientX === undefined || clientY === undefined) return;

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor;
    ctx.lineWidth = isEraser ? Math.max(brushSize * 2, 12) : brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const saveCanvasSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    setLatestImageData(data);
    sessionStorage.setItem('stage3_previousImage', data);
  };

  const stopDrawing = () => {
    drawingState.current.isDrawing = false;
    setIsDrawing(false);
    saveCanvasSnapshot();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    setObjectName(''); setAiGeneratedImage(null); setCanSubmit(false);
    setLatestImageData('');
    sessionStorage.removeItem('stage3_previousImage');
    sessionStorage.removeItem('stage3_objectName');
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
        saveCanvasSnapshot();
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
    const imageData = latestImageData || canvasRef.current.toDataURL('image/png');
    sessionStorage.setItem('stage3_previousImage', imageData);
    sessionStorage.setItem('stage3_objectName', objectName);
    navigate('/stage3/description', {
      state: {
        objectName: objectName,
        previousImage: imageData
      }
    });
  };

  // --- Styles ---
  const pageStyle = {
    background: '#0f0f13',
    minHeight: '100vh',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Pretendard', sans-serif"
  };

  const headerStyle = {
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(20,20,30,0.8)',
    backdropFilter: 'blur(10px)'
  };

  const containerStyle = {
    flex: 1,
    display: 'flex',
    padding: '40px',
    gap: '40px',
    alignItems: 'stretch', // Stretch to fill vertical space
    justifyContent: 'center',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    height: 'calc(100vh - 100px)' // Force full height minus header/padding
  };

  const canvasSectionStyle = {
    flex: 2,
    background: '#1a1a23',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 0 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '600px',
    minHeight: '600px' // Ensure minimum height
  };

  // Encoded Cursor SVG
  const cursorSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='1'/></svg>`);


  const controlPanelStyle = {
    flex: 1,
    background: 'rgba(30, 30, 40, 0.6)',
    borderRadius: '24px',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    minWidth: '350px'
  };

  const sectionTitleStyle = {
    color: '#4ade80',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: 'monospace'
  };

  return (
    <div className="cognition-page" style={pageStyle}>
      <header style={headerStyle}>
        <button
          onClick={() => navigate('/stage3')}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            width: '40px', height: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            padding: 0,
            lineHeight: 0
          }}
        >
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            프롬프튜터링: 인지 (Cognition)
          </h1>
          <ProgressTracker currentStep={1} />
        </div>
      </header>

      <main style={containerStyle}>
        <div style={canvasSectionStyle}>
          <div className="canvas-wrapper" ref={containerRef} style={{
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)',
            width: '100%',
            height: '100%'
          }}>
            <canvas
              ref={canvasRef}
              style={{
                display: 'block',
                background: 'white',
                cursor: `url("data:image/svg+xml;charset=utf-8,${cursorSvg}") 12 12, auto`,
                touchAction: 'none'
              }}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
          </div>
          <div style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👆 마우스로 그림을 그리세요</span>
          </div>
        </div>

        <div style={controlPanelStyle}>
          {/* Guide Section */}
          {!aiGeneratedImage && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px' }}>🎯 MISSION</h3>
              <p style={{ color: '#ccc', lineHeight: '1.5' }}>
                AI에게 알려줄 대상을 그리고<br />그 이름을 가르쳐주세요.
              </p>
            </div>
          )}

          {/* Tools */}
          <div>
            <h3 style={sectionTitleStyle}>🛠️ TOOLS</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '12px', color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
              >
                <Upload size={18} /> 사진 업로드
              </button>
              <button
                onClick={() => setIsEraser(prev => !prev)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: isEraser ? '#3b3b3b' : '#333',
                  border: `1px solid ${isEraser ? '#4ade80' : 'transparent'}`,
                  borderRadius: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontWeight: 'bold'
                }}
              >
                <Eraser size={18} /> 지우개
              </button>
              <button
                onClick={clearCanvas}
                style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '12px', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
              >
                <Trash2 size={18} /> 지우기
              </button>
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 style={sectionTitleStyle}>🎨 PALETTE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '15px', position: 'relative' }}>
              {defaultColors.map(color => (
                <button
                  key={color}
                  onClick={() => { setCurrentColor(color); setIsEraser(false); }}
                  style={{
                    width: '100%', aspectRatio: '1',
                    borderRadius: '50%',
                    background: color,
                    border: currentColor === color ? '3px solid #fff' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: currentColor === color ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: currentColor === color ? `0 0 15px ${color}` : 'none'
                  }}
                />
              ))}

              {/* Custom Color Picker Button */}
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: '50%', cursor: 'pointer',
                  background: 'conic-gradient(from 0deg, #ff0000, #ff8000, #ffff00, #00ff00, #0000ff, #4b0082, #ee82ee, #ff0000)',
                  boxShadow: '0 0 10px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.2)',
                  transition: 'transform 0.2s',
                  padding: 0
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: '1.2rem', color: 'white', fontWeight: 'bold', textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>+</span>
              </button>

              {/* Popover */}
              {showColorPicker && (
                <CustomColorPicker
                  color={currentColor}
                  onChange={(color) => { setCurrentColor(color); setIsEraser(false); }}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>
          </div>

          {/* Brush Size */}
          <div>
            <h3 style={sectionTitleStyle}>🖌️ SIZE: {brushSize}px</h3>
            <input
              type="range"
              min="2"
              max="40"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4ade80', height: '6px', background: '#444', borderRadius: '3px', outline: 'none' }}
            />
          </div>

          {/* Submit */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <input
              type="text"
              placeholder="이게 무엇인가요? (예: 사과)"
              value={objectName}
              onChange={(e) => setObjectName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={!!aiGeneratedImage}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                background: '#1a1a23',
                border: '1px solid #444',
                color: '#fff',
                fontSize: '1rem',
                marginBottom: '10px',
                outline: 'none'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !canSubmit || !objectName.trim() || !!aiGeneratedImage}
              style={{
                width: '100%',
                padding: '16px',
                background: !canSubmit || !objectName.trim() ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
                color: !canSubmit || !objectName.trim() ? '#666' : '#000',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '800',
                cursor: !canSubmit || !objectName.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? <><span className="loading-spinner-tiny"></span> 분석 중...</> : <><Send size={20} /> AI에게 가르쳐주기</>}
            </button>
          </div>
        </div>
      </main>

      {/* Result Overlay */}
      {aiGeneratedImage && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#1a1a23',
            borderRadius: '30px',
            border: '1px solid #4ade80',
            boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)',
            padding: '40px',
            maxWidth: '900px',
            width: '90%',
            display: 'flex', gap: '40px',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              <img src={aiGeneratedImage} alt="AI Result" style={{ width: '100%', borderRadius: '16px', border: '2px solid #333' }} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                🎉 AI LEARNING COMPLETE
              </div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: '1.2' }}>
                AI가 <span style={{ color: '#4ade80' }}>"{objectName}"</span>을(를)<br />이해했습니다!
              </h2>

              <div style={{ background: '#222', padding: '20px', borderRadius: '16px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>💡 Insight</h4>
                <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                  사물의 형태(이미지)와 이름(텍스트)을 연결하여 AI가 개념을 학습했습니다. 이것이 멀티모달(Multi-modal) 학습의 기초입니다.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button
                  onClick={handleRetry}
                  style={{ flex: 1, padding: '16px', background: '#333', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <RotateCcw size={18} /> 다시 하기
                </button>
                <button
                  onClick={handleNext}
                  style={{ flex: 1, padding: '16px', background: '#4ade80', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  다음 단계 <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cognition;
