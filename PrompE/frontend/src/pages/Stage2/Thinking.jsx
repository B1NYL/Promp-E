import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Cognition.css';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useActivity } from '../../services/ActivityContext';
import {
  Upload, Trash2, PenTool, Eraser, CheckCircle,
  ChevronLeft, Image as ImageIcon, Pencil
} from 'lucide-react';

function Thinking() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const { completeLesson, isCompleted } = useCompletion();
  const { gainExp } = useUser();
  const { addActivity } = useActivity();

  const [isDrawing, setIsDrawing] = useState(false);

  // Tools: 'pen', 'pencil', 'eraser'
  const [activeTool, setActiveTool] = useState('pen');

  // Tool Properties
  const [penColor, setPenColor] = useState('#00FFFF');
  const [penSize, setPenSize] = useState(4);
  const [eraserSize, setEraserSize] = useState(20);
  const [pencilPattern, setPencilPattern] = useState(null);

  const presetColors = ['#FFFFFF', '#00FFFF', '#FFFF00', '#FF00FF'];
  const presetSizes = [2, 4, 8, 12];
  const presetEraserSizes = [
    { size: 10, label: '매우 작게' },
    { size: 20, label: '작게' },
    { size: 40, label: '중간' },
    { size: 60, label: '크게' }
  ];

  // Initialize Canvas
  useEffect(() => {
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

  // Generate Pencil Noise Pattern
  useEffect(() => {
    if (activeTool === 'pencil') {
      const size = 64;
      const patternCanvas = document.createElement('canvas');
      patternCanvas.width = size;
      patternCanvas.height = size;
      const pCtx = patternCanvas.getContext('2d');

      pCtx.fillStyle = penColor;
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
  }, [penColor, activeTool]);

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
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return; e.preventDefault();
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    const { x, y } = getCoords(e);

    ctx.globalAlpha = 1.0;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = eraserSize; // Use separate eraser size
      ctx.strokeStyle = '#000';
    } else if (activeTool === 'pencil') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = pencilPattern || penColor;
      ctx.lineWidth = penSize;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }

    ctx.lineTo(x, y); ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.globalCompositeOperation = 'source-over';
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.8;
        const x = (canvas.width - img.width * scale) / 2; const y = (canvas.height - img.height * scale) / 2;
        ctx.globalCompositeOperation = 'source-over';
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
      addActivity({ icon: '🤔', title: '[활동] 상상하기 완료', time: '방금 전' });
      completeLesson(lessonId);
    }
    navigate('/stage2');
  };

  return (
    <div className="cognition-page goodnotes-layout">
      {/* Top Header & Toolbar Wrapper */}
      <header className="gn-header">
        <div className="gn-left">
          <button className="gn-back-btn" onClick={() => navigate('/stage2')}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="gn-title">상상 캔버스</h1>
        </div>

        <div className="gn-toolbar">
          {/* Tool Group */}
          <div className="gn-tool-group">
            <button
              className={`gn-tool-btn ${activeTool === 'pen' ? 'active' : ''}`}
              onClick={() => setActiveTool('pen')}
              title="볼펜"
            >
              <PenTool size={20} />
            </button>
            <button
              className={`gn-tool-btn ${activeTool === 'pencil' ? 'active' : ''}`}
              onClick={() => setActiveTool('pencil')}
              title="연필"
            >
              <Pencil size={20} />
            </button>
            <button
              className={`gn-tool-btn ${activeTool === 'eraser' ? 'active' : ''}`}
              onClick={() => setActiveTool('eraser')}
              title="지우개"
            >
              <Eraser size={20} />
            </button>
          </div>

          <div className="gn-separator"></div>

          {/* Properties Group - Context Aware */}
          <div className="gn-props-group">
            {activeTool === 'eraser' ? (
              /* Eraser Specific Controls */
              <div className="gn-sizes" title="지우개 크기">
                {presetEraserSizes.map((preset) => (
                  <button
                    key={preset.size}
                    className={`gn-size-btn ${eraserSize === preset.size ? 'active' : ''}`}
                    onClick={() => setEraserSize(preset.size)}
                    title={preset.label}
                  >
                    {/* Visual representation of eraser size */}
                    <div
                      style={{
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
              /* Pen/Pencil Controls */
              <>
                <div className="gn-colors" title="색상">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      className={`gn-color-btn ${penColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setPenColor(color)}
                    />
                  ))}
                  <label className="gn-color-picker-label">
                    <input
                      type="color"
                      value={penColor}
                      onChange={(e) => setPenColor(e.target.value)}
                    />
                    <div className="gn-rainbow-wheel"></div>
                  </label>
                </div>

                <div className="gn-sizes" title="두께">
                  {presetSizes.map(size => (
                    <button
                      key={size}
                      className={`gn-size-btn ${penSize === size ? 'active' : ''}`}
                      onClick={() => setPenSize(size)}
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
          <button className="gn-finish-btn" onClick={handleFinishThinking}>
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

export default Thinking;