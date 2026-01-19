import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import { ChevronLeft, Trash2, ArrowRight, Play, Eraser } from 'lucide-react';
import '../../css/Situation.css';

import CustomColorPicker from '../../components/CustomColorPicker';

function Situation() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { addActivity } = useActivity();

  const [situation, setSituation] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#4ade80');
  const [isEraser, setIsEraser] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [canSubmit, setCanSubmit] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const previousDescription = location.state?.objectDescription || '';
  const defaultColors = ['#2b2b2b', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#FFFFFF'];

  const drawingState = useRef({ isDrawing: false });

  // Dynamic Canvas Resizing
  useEffect(() => {
    const updateCanvasSize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const { width, height } = container.getBoundingClientRect();

      if (canvas.width === width && canvas.height === height) return;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      if (location.state?.previousImage) {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setHasDrawn(true);
          setCanSubmit(true);
        };
        img.src = location.state.previousImage;
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [location.state]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current; if (!canvas) return;
    drawingState.current.isDrawing = true;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined) return;
    ctx.beginPath(); ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true); setCanSubmit(true); setHasDrawn(true);
  };

  const draw = (e) => {
    if (!drawingState.current.isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    if (clientX === undefined) return;
    ctx.strokeStyle = isEraser ? '#ffffff' : currentColor; ctx.lineWidth = isEraser ? Math.max(brushSize * 2, 12) : brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => { drawingState.current.isDrawing = false; setIsDrawing(false); };
  const clearCanvas = () => { window.location.reload(); };

  const handleSubmit = async () => {
    if (!situation.trim()) { alert('상황을 입력해주세요!'); return; }
    setIsProcessing(true);
    const finalPrompt = `${previousDescription} ${situation}`;
    const imageData = canvasRef.current.toDataURL('image/png');
    try {
      const result = await api.generateImage(finalPrompt, imageData);
      setAiGeneratedImage(result.image_url);
    } catch (error) { alert("Error generating image"); } finally { setIsProcessing(false); }
  };

  const handleNext = () => {
    const finalPrompt = `${previousDescription} ${situation}`.trim();
    navigate('/stage3/abstraction', {
      state: { objectDescription: finalPrompt, previousImage: canvasRef.current.toDataURL('image/png') }
    });
  };

  // --- Styles ---
  const pageStyle = { background: '#0f0f13', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard', sans-serif" };
  const headerStyle = { padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(20,20,30,0.8)', backdropFilter: 'blur(10px)' };
  const containerStyle = { flex: 1, display: 'flex', padding: '40px', gap: '40px', alignItems: 'stretch', maxWidth: '1600px', margin: '0 auto', width: '100%', height: 'calc(100vh - 100px)' };
  const canvasSectionStyle = { flex: 2, background: '#1a1a23', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '600px', minHeight: '600px' };
  const controlPanelStyle = { flex: 1, background: 'rgba(30, 30, 40, 0.6)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '350px' };
  const sectionTitleStyle = { color: '#fbbf24', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' };
  const cursorSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='1'/></svg>`);

  return (
    <div className="situation-page" style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/stage3')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            프롬프튜터링: 상황 (Situation)
          </h1>
          <ProgressTracker currentStep={3} />
        </div>
      </header>

      <main style={containerStyle}>
        <div style={canvasSectionStyle}>
          <div className="canvas-wrapper" ref={containerRef} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', width: '100%', height: '100%', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.2)' }}>
            <canvas
              ref={canvasRef}
              style={{ display: 'block', background: 'white', cursor: `url("data:image/svg+xml;charset=utf-8,${cursorSvg}") 12 12, auto`, touchAction: 'none' }}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
          </div>
          <div style={{ marginTop: '20px', color: '#666', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>👆 그림을 더 그려보세요</span>
          </div>
        </div>

        <div style={controlPanelStyle}>
          {/* Info Section (Matches Guide) */}
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px', color: '#4ade80' }}>🎯 MISSION</h3>
            <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '5px' }}>PREVIOUS: "{previousDescription}"</div>
            <p style={{ color: '#fff', lineHeight: '1.4' }}>
              이 사물이 <strong>어떤 상황</strong>에 있나요?<br />행동이나 배경을 그려주세요.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 style={{ ...sectionTitleStyle, color: '#4ade80' }}>🛠️ TOOLS</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setIsEraser(prev => !prev)}
                style={{ flex: 1, padding: '12px', background: isEraser ? '#3b3b3b' : '#333', border: `1px solid ${isEraser ? '#4ade80' : 'transparent'}`, borderRadius: '12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}
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

          {/* Palette */}
          <div>
            <h3 style={{ ...sectionTitleStyle, color: '#4ade80' }}>🎨 PALETTE</h3>
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
            {/* Brush Size Slider */}
            <h3 style={{ ...sectionTitleStyle, fontSize: '0.9rem', marginTop: '15px', color: '#4ade80' }}>🖌️ SIZE: {brushSize}px</h3>
            <input
              type="range" min="2" max="40" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#4ade80', height: '6px', background: '#444', borderRadius: '3px', outline: 'none' }}
            />
          </div>

          {/* Input & Submit */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <input
              type="text"
              value={situation}
              onChange={e => setSituation(e.target.value)}
              placeholder="예: 숲속에서 낮잠을 자고 있다"
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={!!aiGeneratedImage}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px',
                background: '#1a1a23', border: '1px solid #444', color: '#fff',
                fontSize: '1rem', marginBottom: '10px', outline: 'none'
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !situation.trim() || !!aiGeneratedImage}
              style={{
                width: '100%', padding: '16px',
                background: !situation.trim() ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
                color: !situation.trim() ? '#666' : '#fff',
                borderRadius: '12px', border: 'none', fontSize: '1.1rem', fontWeight: '800',
                cursor: !situation.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                opacity: isProcessing ? 0.7 : 1
              }}
            >
              {isProcessing ? <><span className="loading-spinner-tiny"></span> 분석 중...</> : <><Play size={20} fill="white" /> 실행하기 (Run)</>}
            </button>
          </div>
        </div>
      </main>

      {/* Result Overlay */}
      {aiGeneratedImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#1a1a23', borderRadius: '30px', border: '1px solid #4ade80', boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)', padding: '40px', maxWidth: '900px', width: '90%', display: 'flex', gap: '40px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}><img src={aiGeneratedImage} style={{ width: '100%', borderRadius: '16px', border: '2px solid #333' }} /></div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>🎉 SCENE CREATED</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: '1.2' }}>상황(Situation)이<br /><span style={{ color: '#4ade80' }}>적용되었습니다!</span></h2>
              <div style={{ background: '#222', padding: '20px', borderRadius: '16px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>💡 Insight</h4>
                <p style={{ color: '#ccc', lineHeight: '1.6' }}>사물에 행동과 배경을 더해 이야기가 있는 장면이 되었습니다.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={() => { setAiGeneratedImage(null); setSituation(''); }} style={{ flex: 1, padding: '16px', background: '#333', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>다시 하기</button>
                <button onClick={handleNext} style={{ flex: 1, padding: '16px', background: '#4ade80', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>다음 단계 <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Situation;
