import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Palette, Pencil, Upload, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import '../../css/BlockCoding.css';
import AiGuidePanel from '../../components/AiGuidePanel';

function BlockDrawing() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [subject, setSubject] = useState('');
  const [canProceed, setCanProceed] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2b2b2b');
  const [brushSize, setBrushSize] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedBlockDrawing');
    if (!hasVisited) {
      setIsModalOpen(true);
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const closeModal = () => {
    localStorage.setItem('hasVisitedBlockDrawing', 'true');
    setIsModalOpen(false);
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setCanProceed(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.clientX || e.touches?.[0]?.clientX;
    const clientY = e.clientY || e.touches?.[0]?.clientY;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        setCanProceed(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleNext = async () => {
    if (!subject.trim()) {
      alert('그린 주인공의 이름을 알려주세요!');
      return;
    }
    if (!canProceed) {
      alert('먼저 주인공을 그려주세요!');
      return;
    }
    setIsLoading(true);
    try {
      const suggestedKeywords = await api.suggestKeywords(subject);
      const drawingData = canvasRef.current.toDataURL('image/png');
      navigate('/stage3/block-assembly', {
        state: { subject, drawingData, suggestedKeywords },
      });
    } catch (error) {
      alert('AI가 블록을 만드는 데 실패했어요. 잠시 후 다시 시도해주세요.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-icon">🧩</div>
            <h2 className="modal-title">미션: 프롬프트 블록코딩</h2>
            <p className="modal-description">
              그림을 그리고, AI가 추천해주는 단어 블록을 조립해서<br/>
              나만의 멋진 프롬프트를 완성하는 미션이에요!
            </p>
            <button className="modal-close-btn" onClick={closeModal}>
              시작할래요!
            </button>
          </div>
        </div>
      )}

      <div className="block-coding-page">
        <AiGuidePanel currentStep="drawing" />
        <main className="main-content-block">
          <header className="block-header">
            <h1><Palette className="header-icon" /> 미션 1: 주인공 그리기</h1>
            <p>프롬프트의 가장 중요한 첫 단계! 주인공을 그리고 이름을 알려주세요.</p>
          </header>

          <div className="canvas-container-block">
            <canvas ref={canvasRef} width={800} height={500}
              onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
              onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
            />
          </div>
          
          <div className="bottom-controls">
            <div className="drawing-tools-block">
              <button onClick={() => fileInputRef.current?.click()} className="tool-btn-block upload"><Upload size={18}/>업로드</button>
              <button onClick={clearCanvas} className="tool-btn-block clear"><Trash2 size={18}/>지우기</button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{display: 'none'}} accept="image/*" />
              <div className="color-tool">
                <input type="color" value={currentColor} onChange={(e) => setCurrentColor(e.target.value)} className="color-picker-input-block" />
                <div className="color-preview-block" style={{backgroundColor: currentColor}}></div>
              </div>
              <div className="size-tool">
                <Pencil size={18} />
                <input type="range" min="2" max="20" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
                <span>{brushSize}px</span>
              </div>
            </div>
            <div className="submission-area">
              <div className="input-wrapper-block">
                <Pencil className="input-icon" />
                <input 
                  type="text" 
                  placeholder="그린 주인공의 이름 (예: 용)"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>
              <button onClick={handleNext} disabled={!subject || !canProceed || isLoading} className="next-step-btn">
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={20} />
                    AI가 블록 만드는 중...
                  </>
                ) : (
                  '블록 조립하기 →'
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default BlockDrawing;