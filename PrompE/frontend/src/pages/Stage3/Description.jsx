import { useNavigate, useLocation } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
import ProgressTracker from '../../components/ProgressTracker';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import { ChevronLeft, Trash2, Wand2, ArrowRight } from 'lucide-react';
import '../../css/Description.css';

import CustomColorPicker from '../../components/CustomColorPicker';

function Description() {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const { addActivity } = useActivity();
  const [isDrawing, setIsDrawing] = useState(false);

  const storedObjectName = sessionStorage.getItem('stage3_objectName') || '';
  const previousObjectName = location.state?.objectName || storedObjectName;
  const [objectDescription, setObjectDescription] = useState(previousObjectName);

  const [currentColor, setCurrentColor] = useState('#4ade80');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [brushSize, setBrushSize] = useState(5);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);

  const defaultColors = ['#2b2b2b', '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42', '#6C5CE7', '#00B894', '#FDCB6E', '#FFFFFF'];
  const defaultAdjectives = [
    { text: '빨간', emoji: '🔴' }, { text: '파란', emoji: '🔵' },
    { text: '노란', emoji: '🟡' }, { text: '초록', emoji: '🟢' },
    { text: '거대한', emoji: '🐘' }, { text: '작은', emoji: '🐜' },
    { text: '귀여운', emoji: '🥰' }, { text: '반짝이는', emoji: '✨' }
  ];
  const [adjectiveSuggestions, setAdjectiveSuggestions] = useState(defaultAdjectives);
  const [isLoadingAdjectives, setIsLoadingAdjectives] = useState(false);
  const lastAdjectiveImageRef = useRef(null);

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
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      const previousImage = location.state?.previousImage || sessionStorage.getItem('stage3_previousImage');
      if (previousImage) {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(width / img.width, height / img.height);
          const x = (width - img.width * scale) / 2;
          const y = (height - img.height * scale) / 2;
          ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
          setHasDrawn(true);
          setCanSubmit(true);
        };
        img.src = previousImage;
      }
    };

    updateCanvasSize();
    const resizeObserver = new ResizeObserver(() => updateCanvasSize());
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [location.state]);

  useEffect(() => {
    const fetchAdjectives = async () => {
      const img = location.state?.previousImage;
      if (!img) return;
      if (lastAdjectiveImageRef.current === img) return;
      lastAdjectiveImageRef.current = img;
      setIsLoadingAdjectives(true);
      try {
        const response = await api.suggestAdjectives(previousObjectName, img);
        const items = (response.adjectives || []).slice(0, 8);
        if (items.length) {
          setAdjectiveSuggestions(items.map(text => ({ text, emoji: '✨' })));
        }
      } catch (error) {
        console.error("Failed to load adjectives:", error);
        setAdjectiveSuggestions(defaultAdjectives);
      } finally {
        setIsLoadingAdjectives(false);
      }
    };

    fetchAdjectives();
  }, [location.state, previousObjectName]);

  useEffect(() => {
    if (hasDrawn && objectDescription && !objectDescription.includes(' ')) {
      setShowAdvice(true);
    } else {
      setShowAdvice(false);
    }
  }, [hasDrawn, objectDescription]);

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
    ctx.strokeStyle = currentColor; ctx.lineWidth = brushSize;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => { drawingState.current.isDrawing = false; setIsDrawing(false); };
  const clearCanvas = () => { window.location.reload(); };

  const handleAdjectiveClick = (adjective) => {
    if (objectDescription.includes(adjective)) return;
    setObjectDescription(prev => prev.trim() === '' ? adjective : `${adjective} ${prev}`);
  };

  const handleSubmit = async () => {
    if (!objectDescription.trim()) { alert('사물을 묘사하는 말을 입력해주세요!'); return; }
    if (!canSubmit) { alert('그림을 그리거나 이미지를 업로드해주세요!'); return; }
    setIsProcessing(true);
    const imageData = canvasRef.current.toDataURL('image/png');
    try {
      const result = await api.generateImage(objectDescription, imageData);
      setAiGeneratedImage(result.image_url);
      setShowAdvice(false);
    } catch (error) { alert("Error generating image"); } finally { setIsProcessing(false); }
  };

  const handleRetry = () => { clearCanvas(); };
  const handleNext = () => {
    navigate('/stage3/situation', {
      state: { objectDescription: objectDescription, previousImage: canvasRef.current.toDataURL('image/png') }
    });
  };

  // --- Styles (Matches Cognition.jsx) ---
  const pageStyle = { background: '#0f0f13', minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Pretendard', sans-serif" };
  const headerStyle = { padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(20,20,30,0.8)', backdropFilter: 'blur(10px)' };
  const containerStyle = { flex: 1, display: 'flex', padding: '40px', gap: '40px', alignItems: 'stretch', maxWidth: '1600px', margin: '0 auto', width: '100%', height: 'calc(100vh - 100px)' };
  const canvasSectionStyle = { flex: 2, background: '#1a1a23', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 40px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '600px', minHeight: '600px' };
  const controlPanelStyle = { flex: 1, background: 'rgba(30, 30, 40, 0.6)', borderRadius: '24px', padding: '30px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '30px', minWidth: '350px' };
  const sectionTitleStyle = { color: '#4ade80', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' };
  const cursorSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><circle cx='12' cy='12' r='1'/></svg>`);

  return (
    <div className="description-page" style={pageStyle}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/stage3')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', padding: 0 }}>
          <ChevronLeft size={24} />
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            프롬프튜터링: 묘사 (Description)
          </h1>
          <ProgressTracker currentStep={2} />
        </div>
      </header>

      <main style={containerStyle}>
        <div style={canvasSectionStyle}>
          <div className="canvas-wrapper" ref={containerRef} style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', width: '100%', height: '100%', boxShadow: '0 0 0 2px rgba(217, 70, 239, 0.4)' }}>
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
          {/* Previous Info */}
          {/* Info Section (Mission) */}
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '20px' }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px', color: '#4ade80' }}>🎯 MISSION</h3>
            <div style={{ color: '#ccc', fontSize: '0.9rem', marginBottom: '5px' }}>OBJECT: "{previousObjectName}"</div>
            <p style={{ color: '#fff', lineHeight: '1.4', margin: 0 }}>
              이 사물을 <strong>자세히 묘사</strong>해주세요.<br />형용사를 추가하여 특징을 살려보세요.
            </p>
          </div>

          {/* Adjectives - Clean Grid */}
          <div>
            <h3 style={sectionTitleStyle}>ADJECTIVES</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {adjectiveSuggestions.map((item, idx) => {
                const isSelected = objectDescription.includes(item.text);
                return (
                  <button
                    key={idx}
                    onClick={() => handleAdjectiveClick(item.text)}
                    style={{
                      background: isSelected ? '#1f3b2f' : '#333',
                      border: `1px solid ${isSelected ? '#4ade80' : '#444'}`,
                      color: '#fff',
                      padding: '12px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      justifyContent: 'center',
                      transform: isSelected ? 'translateY(1px)' : 'translateY(0)',
                      boxShadow: isSelected ? '0 0 0 rgba(0,0,0,0.15)' : '0 4px 0 rgba(0,0,0,0.2)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{item.emoji}</span> {item.text}
                  </button>
                )
              })}
            </div>
            {isLoadingAdjectives && (
              <p style={{ marginTop: '10px', color: '#aaa', fontSize: '0.85rem' }}>AI가 형용사를 추천 중...</p>
            )}
          </div>

          {/* Tools */}
          <div>
            <h3 style={sectionTitleStyle}>TOOLS</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <button onClick={clearCanvas} style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '12px', color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
                <Trash2 size={18} /> RESET
              </button>
            </div>
            <h3 style={sectionTitleStyle}>PALETTE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '15px', position: 'relative' }}>
              {defaultColors.map(color => (
                <button key={color} onClick={() => setCurrentColor(color)} style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: color, border: currentColor === color ? '3px solid white' : '2px solid transparent', transform: currentColor === color ? 'scale(1.1)' : 'scale(1)', cursor: 'pointer', boxShadow: currentColor === color ? `0 0 10px ${color}` : 'none' }} />
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
                  onChange={setCurrentColor}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </div>
            <input type="range" min="1" max="30" value={brushSize} onChange={e => setBrushSize(Number(e.target.value))} style={{ width: '100%', accentColor: '#d946ef' }} />
          </div>

          {/* Input */}
          <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
            <input
              type="text"
              value={objectDescription}
              onChange={e => setObjectDescription(e.target.value)}
              placeholder="예: 크고 빨간 사과"
              style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1a1a23', border: '1px solid #444', color: '#fff', fontSize: '1rem', marginBottom: '10px', outline: 'none' }}
            />
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              style={{ width: '100%', padding: '16px', background: isProcessing ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)', color: isProcessing ? '#666' : 'white', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: isProcessing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              {isProcessing ? 'PROCESSING...' : <><Wand2 size={18} /> GENERATE</>}
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
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>🎉 DESCRIPTION UPDATED</div>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px', lineHeight: '1.2' }}>AI가 <span style={{ color: '#4ade80' }}>설명</span>을<br />반영했습니다!</h2>
              <div style={{ background: '#222', padding: '20px', borderRadius: '16px', marginBottom: '30px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>💡 Insight</h4>
                <p style={{ color: '#ccc', lineHeight: '1.6' }}>형용사를 추가하여 대상의 특징이 더욱 명확해졌습니다.</p>
              </div>
              <div style={{ display: 'flex', gap: '15px' }}>
                <button onClick={handleRetry} style={{ flex: 1, padding: '16px', background: '#333', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>다시 하기</button>
                <button onClick={handleNext} style={{ flex: 1, padding: '16px', background: '#4ade80', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>다음 단계 <ArrowRight size={18} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Description;
