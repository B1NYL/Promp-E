import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { GalleryProvider, useGallery } from '../../services/GalleryContext';
import { useUser } from '../../services/UserContext';
import { useCompletion } from '../../services/CompletionContext';
import { useActivity } from '../../services/ActivityContext';
import '../../css/PromptComposition.css';
import { Eraser, Pencil, Type, Download, Bot, Loader2 } from 'lucide-react';

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
  backdropFilter: 'blur(10px)',
  zIndex: 50
};

const containerStyle = {
  flex: 1,
  display: 'flex',
  padding: '40px',
  gap: '40px',
  alignItems: 'stretch',
  justifyContent: 'center',
  maxWidth: '1600px',
  margin: '0 auto',
  width: '100%',
  height: 'calc(100vh - 100px)',
  overflow: 'hidden'
};

const canvasSectionStyle = {
  flex: 2,
  background: '#1a1a23',
  borderRadius: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 0 40px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  overflow: 'hidden',
  minWidth: '600px'
};

const controlPanelStyle = {
  flex: 1,
  background: 'rgba(30, 30, 40, 0.6)',
  borderRadius: '24px',
  padding: '30px',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(20px)',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  minWidth: '350px',
  overflowY: 'auto'
};

const sectionTitleStyle = {
  color: '#4ade80',
  fontSize: '1rem',
  fontWeight: 'bold',
  marginBottom: '10px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontFamily: 'monospace'
};

const layerConfig = [
  { id: 'subject', name: '주인공 (누구?)', color: '#FF6B6B' },
  { id: 'background', name: '배경 (어디서?)', color: '#4ECDC4' },
  { id: 'action', name: '행동 (무엇을?)', color: '#45B7D1' },
  { id: 'state', name: '표정/기분 (어때?)', color: '#F7B801' },
  { id: 'instruction', name: '그림체 (어떻게?)', color: '#5F4B8B' },
  { id: 'extra_info', name: '꾸미기 (더 자세히)', color: '#95E1D3' },
  { id: 'example', name: '참고 (비슷하게)', color: '#F38181' },
  { id: 'context', name: '분위기 (느낌)', color: '#AA96DA' },
  { id: 'output_constraint', name: '약속 (꼭 지켜줘)', color: '#6C5CE7' },
  { id: 'role', name: '화가 (누구처럼?)', color: '#A855F7' },
];

function PromptCompositionPage() {
  const canvasRefs = useRef({});
  const navigate = useNavigate();
  const { addCreation } = useGallery();
  const { gainExp, incrementCompletionCounts } = useUser();
  const { completeLesson, isCompleted } = useCompletion();
  const { addActivity } = useActivity();

  const [layers, setLayers] = useState(() =>
    layerConfig.reduce((acc, layer) => ({ ...acc, [layer.id]: { type: 'draw', text: '' } }), {})
  );

  const [activeLayer, setActiveLayer] = useState('subject');
  const [activeTool, setActiveTool] = useState('pencil'); // pencil, eraser
  const [brushSize, setBrushSize] = useState(5);

  const [isComposing, setIsComposing] = useState(false);
  const [composedPrompt, setComposedPrompt] = useState('');
  const [composedPromptKr, setComposedPromptKr] = useState('');

  const [isGeneratingMedia, setIsGeneratingMedia] = useState(false);
  const [finalImage, setFinalImage] = useState(null);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRefs.current[activeLayer];
    return canvas ? canvas.getContext('2d') : null;
  }, [activeLayer]);

  useEffect(() => {
    Object.values(canvasRefs.current).forEach(canvas => {
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      }
    });

    const activeCanvas = canvasRefs.current[activeLayer];
    if (!activeCanvas) return;

    const getCoords = (e) => {
      const rect = activeCanvas.getBoundingClientRect();
      const isTouchEvent = e.touches && e.touches.length > 0;
      const clientX = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const clientY = isTouchEvent ? e.touches[0].clientY : e.clientY;
      const scaleX = activeCanvas.width / rect.width;
      const scaleY = activeCanvas.height / rect.height;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    const handleDrawStart = (e) => {
      const { x, y } = getCoords(e);
      const ctx = activeCanvas.getContext('2d');
      ctx.beginPath(); ctx.moveTo(x, y);
      ctx.globalCompositeOperation = activeTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.strokeStyle = activeTool === 'eraser' ? "rgba(0,0,0,1)" : layerConfig.find(l => l.id === activeLayer).color;
      ctx.lineWidth = brushSize;
      activeCanvas.isDrawing = true;
    };

    const handleDrawMove = (e) => {
      if (!activeCanvas.isDrawing) return;
      e.preventDefault();
      const { x, y } = getCoords(e);
      const ctx = activeCanvas.getContext('2d');
      ctx.lineTo(x, y); ctx.stroke();
    };

    const handleDrawEnd = () => {
      activeCanvas.isDrawing = false;
    };

    activeCanvas.addEventListener('mousedown', handleDrawStart);
    activeCanvas.addEventListener('mousemove', handleDrawMove);
    window.addEventListener('mouseup', handleDrawEnd);
    activeCanvas.addEventListener('mouseleave', handleDrawEnd);
    activeCanvas.addEventListener('touchstart', handleDrawStart, { passive: false });
    activeCanvas.addEventListener('touchmove', handleDrawMove, { passive: false });
    window.addEventListener('touchend', handleDrawEnd);

    return () => {
      activeCanvas.removeEventListener('mousedown', handleDrawStart);
      activeCanvas.removeEventListener('mousemove', handleDrawMove);
      window.removeEventListener('mouseup', handleDrawEnd);
      activeCanvas.removeEventListener('mouseleave', handleDrawEnd);
      activeCanvas.removeEventListener('touchstart', handleDrawStart);
      activeCanvas.removeEventListener('touchmove', handleDrawMove);
      window.removeEventListener('touchend', handleDrawEnd);
    };
  }, [activeLayer, activeTool, brushSize, getCanvasContext]);

  const handleTextChange = (e) => {
    setLayers(prev => ({ ...prev, [activeLayer]: { ...prev[activeLayer], text: e.target.value } }));
  };

  const clearLayer = () => {
    const ctx = getCanvasContext();
    if (ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    setLayers(prev => ({ ...prev, [activeLayer]: { ...prev[activeLayer], text: '' } }));
  };

  const handleComposePrompt = async () => {
    setIsComposing(true);
    setComposedPrompt(''); setComposedPromptKr('');

    const layerData = [];
    layerConfig.forEach(layer => {
      const canvas = canvasRefs.current[layer.id];
      const layerState = layers[layer.id];
      const textValue = (layerState.text || '').trim();
      if (textValue) {
        layerData.push({ name: layer.id, type: 'text', data: textValue });
      }
      const ctx = canvas?.getContext('2d');
      const isCanvasDirty = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0) : false;
      if (isCanvasDirty) {
        layerData.push({ name: `${layer.id}_drawing`, type: 'image', data: canvas.toDataURL('image/png') });
      }
    });

    if (layerData.length === 0) {
      alert("하나 이상의 레이어에 내용을 입력하거나 그려주세요!");
      setIsComposing(false);
      return;
    }

    try {
      const result = await api.composePrompt(layerData);
      setComposedPrompt(result.dalle_prompt);
      setComposedPromptKr(result.korean_description);
    } catch (error) {
      alert("프롬프트 조합에 실패했습니다.");
    } finally {
      setIsComposing(false);
    }
  };

  const buildMergedImage = () => {
    const width = 800;
    const height = 600;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tctx = tempCanvas.getContext('2d');
    tctx.clearRect(0, 0, width, height);

    let hasPixels = false;
    layerConfig.forEach(layer => {
      const canvas = canvasRefs.current[layer.id];
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      const isDirty = data.some(channel => channel !== 0);
      if (isDirty) {
        hasPixels = true;
        tctx.drawImage(canvas, 0, 0);
      }
    });

    return hasPixels ? tempCanvas.toDataURL('image/png') : null;
  };

  const handleGenerateMedia = async (type) => {
    if (!composedPrompt) return;
    setIsGeneratingMedia(true);
    setFinalImage(null);

    try {
      if (type === 'image') {
        const mergedImage = buildMergedImage();
        const result = await api.generateImage(composedPrompt, mergedImage);
        setFinalImage(result.image_url);

        const lessonId = 's3-composition'; // Updated lesson ID
        const wasAlreadyCompleted = isCompleted(lessonId);
        gainExp(150, wasAlreadyCompleted);

        incrementCompletionCounts();
        if (!wasAlreadyCompleted) {
          addActivity({ icon: '🪄', title: `[조합] "${composedPromptKr.substring(0, 15)}..." 완성`, time: '방금 전' });
          completeLesson(lessonId);
        }
      } else {
        alert('비디오 생성 기능은 준비 중입니다.');
        setIsGeneratingMedia(false);
      }
    } catch (error) {
      alert("미디어 생성에 실패했습니다.");
      setIsGeneratingMedia(false);
    }
  };

  const closeResult = () => {
    if (finalImage && composedPromptKr) {
      addCreation({
        prompt: composedPromptKr,
        imageUrl: finalImage,
      });
    }
    setFinalImage(null);
    setIsGeneratingMedia(false);
  };

  return (
    <div className="prompt-composition-page" style={pageStyle}>
      {/* Header */}
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
          <span style={{ fontSize: '1.2rem' }}>←</span>
        </button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            프롬프트 조합 (Complexity)
          </h1>
        </div>
      </header>

      <main style={containerStyle}>
        {/* Left: Canvas Stack */}
        <div style={canvasSectionStyle}>
          <div style={{ position: 'relative', width: '800px', height: '600px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.2)' }}>
            {layerConfig.map((layer, index) => (
              <canvas
                key={layer.id}
                ref={el => (canvasRefs.current[layer.id] = el)}
                width={800} height={600}
                style={{
                  position: 'absolute', top: 0, left: 0,
                  pointerEvents: activeLayer === layer.id ? 'auto' : 'none',
                  opacity: activeLayer === layer.id ? 1 : 0.4, // Focus active layer
                  zIndex: layerConfig.length - index,
                  transition: 'opacity 0.3s'
                }}
              />
            ))}
            {/* Overlay Label for Active Layer */}
            <div style={{ position: 'absolute', top: 10, left: 10, background: layerConfig.find(l => l.id === activeLayer).color, color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', zIndex: 1000, pointerEvents: 'none' }}>
              현재 레이어: {layerConfig.find(l => l.id === activeLayer).name}
            </div>
          </div>
        </div>

        {/* Right: Control Panel */}
        <aside style={controlPanelStyle}>

          {/* Mission Box */}
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px', color: '#3b82f6' }}>🎯 MISSION</h3>
            <p style={{ color: '#ccc', lineHeight: '1.5', fontSize: '0.9rem' }}>
              여러 개의 <strong>투명 레이어</strong>를 쌓아서<br />복잡하고 섬세한 프롬프트를 완성하세요.
            </p>
          </div>

          {/* 1. Layers */}
          <div>
            <h3 style={sectionTitleStyle}>1. 레이어 선택 (LAYERS)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {layerConfig.map(layer => (
                <button
                  key={layer.id}
                  onClick={() => setActiveLayer(layer.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px',
                    background: activeLayer === layer.id ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)',
                    border: activeLayer === layer.id ? `1px solid ${layer.color}` : '1px solid transparent',
                    borderRadius: '8px',
                    color: activeLayer === layer.id ? '#fff' : '#888',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: layer.color }}></div>
                  {layer.name}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tools */}
          <div>
            <h3 style={sectionTitleStyle}>2. 도구 (TOOLS)</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button
                onClick={() => setActiveTool('pencil')}
                style={{ flex: 1, padding: '12px', background: activeTool === 'pencil' ? '#333' : 'transparent', border: activeTool === 'pencil' ? '1px solid #4ade80' : '1px solid #444', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <Pencil size={18} />
              </button>
              <button
                onClick={() => setActiveTool('eraser')}
                style={{ flex: 1, padding: '12px', background: activeTool === 'eraser' ? '#333' : 'transparent', border: activeTool === 'eraser' ? '1px solid #4ade80' : '1px solid #444', borderRadius: '8px', color: 'white', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <Eraser size={18} />
              </button>
              <button
                onClick={clearLayer}
                style={{ flex: 1, padding: '12px', background: '#333', border: 'none', borderRadius: '8px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
              >
                지우기
              </button>
            </div>

            {/* Input Type Toggle */}
            <div style={{ background: '#222', borderRadius: '8px', padding: '4px', display: 'flex', gap: '4px', marginBottom: '10px' }}>
              <button
                onClick={() => setLayers(p => ({ ...p, [activeLayer]: { ...p[activeLayer], type: 'draw' } }))}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: layers[activeLayer].type === 'draw' ? '#444' : 'transparent', color: layers[activeLayer].type === 'draw' ? 'white' : '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                그림(Draw)
              </button>
              <button
                onClick={() => setLayers(p => ({ ...p, [activeLayer]: { ...p[activeLayer], type: 'text' } }))}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: layers[activeLayer].type === 'text' ? '#444' : 'transparent', color: layers[activeLayer].type === 'text' ? 'white' : '#666', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' }}
              >
                텍스트(Text)
              </button>
            </div>

            {layers[activeLayer].type === 'text' && (
              <textarea
                placeholder={`${layerConfig.find(l => l.id === activeLayer).name} 내용을 텍스트로 입력...`}
                value={layers[activeLayer].text}
                onChange={handleTextChange}
                style={{ width: '100%', height: '80px', background: '#222', border: '1px solid #444', borderRadius: '8px', padding: '10px', color: 'white', resize: 'none' }}
              />
            )}

            {/* Brush Size */}
            <div style={{ marginTop: '10px' }}>
              <span style={{ fontSize: '0.8rem', color: '#888', display: 'block', marginBottom: '4px' }}>브러시 크기: {brushSize}px</span>
              <input type="range" min="2" max="30" value={brushSize} onChange={e => setBrushSize(e.target.value)} style={{ width: '100%', accentColor: '#4ade80' }} />
            </div>
          </div>

          {/* 3. Action */}
          <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={handleComposePrompt}
              disabled={isComposing || isGeneratingMedia}
              style={{
                width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                background: isComposing ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
                color: isComposing ? '#666' : 'white',
                fontWeight: 'bold', fontSize: '1.1rem',
                cursor: isComposing ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
              }}
            >
              {isComposing ? <><Loader2 className="animate-spin" size={20} /> 분석 및 조합 중...</> : <><Bot size={20} /> 프롬프트 조합하기</>}
            </button>

            {composedPromptKr && (
              <div style={{ marginTop: '20px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px' }}>
                <h4 style={{ color: '#4ade80', margin: '0 0 10px 0', fontSize: '0.9rem' }}>✨ AI 조합 결과</h4>
                <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: '1.4', marginBottom: '15px' }}>{composedPromptKr}</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleGenerateMedia('image')}
                    disabled={isGeneratingMedia}
                    style={{ flex: 1, padding: '12px', background: '#3b82f6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {isGeneratingMedia ? '생성 중...' : '이미지 생성'}
                  </button>
                </div>
              </div>
            )}
          </div>

        </aside>
      </main>

      {finalImage && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.9)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#1a1a23',
            padding: '40px',
            borderRadius: '30px',
            maxWidth: '1100px',
            width: '90%',
            display: 'flex',
            gap: '40px',
            alignItems: 'center',
            border: '1px solid #4ade80',
            boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)'
          }}>
            <div style={{ flex: 1 }}>
              <img src={finalImage} alt="Final" style={{ width: '100%', borderRadius: '16px', border: '2px solid #333' }} />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                🎉 COMPOSITION COMPLETE
              </div>
              <h2 style={{ fontSize: '2.4rem', margin: 0, marginBottom: '20px', lineHeight: 1.2 }}>
                프롬프트 조합<br /><span style={{ color: '#4ade80' }}>완성!</span>
              </h2>
              <div style={{ background: '#222', padding: '20px', borderRadius: '16px', marginBottom: '24px', borderLeft: '4px solid #3b82f6' }}>
                <h4 style={{ color: '#3b82f6', marginBottom: '8px', fontSize: '1rem' }}>💡 최종 프롬프트</h4>
                <p style={{ color: '#fff', lineHeight: '1.5' }}>
                  {composedPromptKr || composedPrompt}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{ flex: 1, padding: '14px', background: '#333', color: 'white', borderRadius: '12px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Download size={18} /> 저장
                </button>
                <button onClick={closeResult} style={{ flex: 1, padding: '14px', background: '#4ade80', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromptComposition() {
  return (
    <GalleryProvider>
      <PromptCompositionPage />
    </GalleryProvider>
  );
}
