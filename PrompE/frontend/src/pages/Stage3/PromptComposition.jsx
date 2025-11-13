import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { GalleryProvider, useGallery } from '../../services/GalleryContext';
import { useUser } from '../../services/UserContext';
import { useCompletion } from '../../services/CompletionContext';
import { useActivity } from '../../services/ActivityContext';
import '../../css/PromptComposition.css';
import { Eraser, Pencil, Type, Download, Bot, Loader2 } from 'lucide-react';

const layerConfig = [
  { id: 'subject', name: '주체', color: '#FF6B6B' },
  { id: 'background', name: '배경', color: '#4ECDC4' },
  { id: 'action', name: '동작', color: '#45B7D1' },
  { id: 'state', name: '상태', color: '#F7B801' },
  { id: 'instruction', name: '지시문', color: '#5F4B8B' },
  { id: 'extra_info', name: '추가 정보', color: '#95E1D3' },
  { id: 'example', name: '예시', color: '#F38181' },
  { id: 'context', name: '맥락', color: '#AA96DA' },
  { id: 'output_constraint', name: '출력 제한', color: '#6C5CE7' },
  { id: 'role', name: '제작자(역할)', color: '#A855F7' },
];

function PromptCompositionPage() {
  const canvasRefs = useRef({});
  const navigate = useNavigate();
  const { addCreation } = useGallery();
  const { gainExp } = useUser();
  const { completeLesson, isCompleted } = useCompletion();
  const { addActivity } = useActivity();
  
  const [layers, setLayers] = useState(() =>
    layerConfig.reduce((acc, layer) => ({ ...acc, [layer.id]: { type: 'draw', text: '' } }), {})
  );
  
  const [activeLayer, setActiveLayer] = useState('subject');
  const [activeTool, setActiveTool] = useState('pencil');
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
    
    const layerData = layerConfig.map(layer => {
      const canvas = canvasRefs.current[layer.id];
      const layerState = layers[layer.id];
      const ctx = canvas?.getContext('2d');
      const isCanvasDirty = ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height).data.some(channel => channel !== 0) : false;
      return { name: layer.id, type: layerState.type, data: layerState.type === 'text' ? layerState.text : (isCanvasDirty ? canvas.toDataURL('image/png') : '') };
    }).filter(layer => layer.data);

    if (layerData.length === 0) {
      alert("하나 이상의 레이어에 내용을 입력하거나 그려주세요!");
      setIsComposing(false);
      return;
    }

    try {
      const result = await api.composePrompt(layerData);
      setComposedPrompt(result.composed_prompt);
      setComposedPromptKr(result.composed_prompt_kr);
    } catch (error) {
      alert("프롬프트 조합에 실패했습니다.");
    } finally {
      setIsComposing(false);
    }
  };

  const handleGenerateMedia = async (type) => {
    if (!composedPrompt) return;
    setIsGeneratingMedia(true);
    setFinalImage(null);

    try {
      if (type === 'image') {
        const result = await api.generateImage(composedPrompt, null);
        setFinalImage(result.image_url);
        
        const lessonId = 's1-composition';
        const wasAlreadyCompleted = isCompleted(lessonId);
        gainExp(150, wasAlreadyCompleted);
        if (!wasAlreadyCompleted) {
          addCreation({ prompt: composedPromptKr, imageUrl: result.image_url });
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
    setFinalImage(null);
    setIsGeneratingMedia(false);
  };

  return (
    <div className="prompt-composition-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage1')}>← 돌아가기</button>
        <h1 className="page-title">프롬프트 조합하기</h1>
        <div className="header-placeholder"></div>
      </header>

      <main className="composition-main">
        <div className="canvas-main-area">
          <div className="canvas-stack">
            {layerConfig.map((layer, index) => (
              <canvas
                key={layer.id}
                ref={el => (canvasRefs.current[layer.id] = el)}
                width={800} height={600}
                className={`composition-canvas ${activeLayer === layer.id ? 'active' : ''}`}
                style={{ zIndex: layerConfig.length - index, '--layer-color': layer.color }}
              />
            ))}
          </div>
        </div>

        <aside className="control-panel-composition">
          <div className="panel-section">
            <h3 className="section-title">1. 레이어 선택</h3>
            <div className="layer-selector">
              {layerConfig.map(layer => (<button key={layer.id} className={`layer-btn ${activeLayer === layer.id ? 'active' : ''}`} style={{'--layer-color': layer.color}} onClick={() => setActiveLayer(layer.id)}><span className="layer-color-dot" style={{ backgroundColor: layer.color }}></span>{layer.name}</button>))}
            </div>
          </div>
          
          <div className="panel-section">
            <h3 className="section-title">2. 도구 및 입력 방식</h3>
            <div className="tools">
              <button className={`tool-btn ${activeTool === 'pencil' ? 'active' : ''}`} onClick={() => setActiveTool('pencil')}><Pencil size={20}/></button>
              <button className={`tool-btn ${activeTool === 'eraser' ? 'active' : ''}`} onClick={() => setActiveTool('eraser')}><Eraser size={20}/></button>
              <input type="range" min="2" max="30" value={brushSize} onChange={e => setBrushSize(e.target.value)} />
              <button className="clear-layer-btn" onClick={clearLayer}>레이어 지우기</button>
            </div>
            <div className="input-type-toggle">
              <button className={layers[activeLayer].type === 'draw' ? 'active' : ''} onClick={() => setLayers(p => ({...p, [activeLayer]: {...p[activeLayer], type: 'draw'}}))}><Pencil size={16}/> 그림</button>
              <button className={layers[activeLayer].type === 'text' ? 'active' : ''} onClick={() => setLayers(p => ({...p, [activeLayer]: {...p[activeLayer], type: 'text'}}))}><Type size={16}/> 텍스트</button>
            </div>
            {layers[activeLayer].type === 'text' && (<textarea className="layer-textarea" placeholder={`${layerConfig.find(l=>l.id === activeLayer).name} 내용을 텍스트로 입력...`} value={layers[activeLayer].text} onChange={handleTextChange}/>)}
          </div>
          
          <div className="panel-section action-panel">
            <h3 className="section-title">3. 프롬프트 생성</h3>
            <button className="compose-btn" onClick={handleComposePrompt} disabled={isComposing || isGeneratingMedia}>
              {isComposing ? <><Loader2 className="animate-spin" size={20}/> 조합 중...</> : <><Bot size={20}/> 프롬프트 조합하기</>}
            </button>
            {composedPromptKr && (
              <div className="composed-prompt-result">
                <h4>AI가 조합한 프롬프트:</h4>
                <p>{composedPromptKr}</p>
                <div className="generate-media-btns">
                  <button onClick={() => handleGenerateMedia('image')} disabled={isGeneratingMedia}>{isGeneratingMedia ? <><Loader2 className="animate-spin" size={16}/> 생성 중...</> : '이미지 생성'}</button>
                  <button onClick={() => handleGenerateMedia('video')} disabled={true}>영상 생성 (준비중)</button>
                </div>
              </div>
            )}
          </div>

          {finalImage && (
            <div className="panel-section final-result-panel">
              <img src={finalImage} alt="최종 결과물" />
              <div className="result-actions"><button><Download size={16}/> 저장</button><button onClick={closeResult}>닫기</button></div>
            </div>
          )}
        </aside>
      </main>
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