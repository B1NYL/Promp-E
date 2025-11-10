import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProgressTracker from '../../components/ProgressTracker'
import '../../css/Description.css'

function Description() {
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef(null)
  const fileInputRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  
  const previousObjectName = location.state?.objectName || ''
  const [objectDescription, setObjectDescription] = useState(previousObjectName)
  
  const [currentColor, setCurrentColor] = useState('#2b2b2b')
  const [brushSize, setBrushSize] = useState(5)
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null)
  const [canSubmit, setCanSubmit] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [showAdvice, setShowAdvice] = useState(false)

  const defaultColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3',
    '#F38181', '#AA96DA', '#FCBAD3', '#FF8C42',
    '#6C5CE7', '#00B894', '#FDCB6E', '#2b2b2b'
  ]

  const adjectiveSuggestions = [
    { text: '빨간', emoji: '🔴' },
    { text: '파란', emoji: '🔵' },
    { text: '노란', emoji: '🟡' },
    { text: '초록', emoji: '🟢' },
    { text: '큰', emoji: '⬆️' },
    { text: '작은', emoji: '⬇️' },
    { text: '귀여운', emoji: '🥰' },
    { text: '멋진', emoji: '✨' },
  ]

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (location.state?.previousImage) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
          setHasDrawn(true)
          setCanSubmit(true)
        }
        img.src = location.state.previousImage
      }
    }
  }, [location.state])

  useEffect(() => {
    if (hasDrawn && objectDescription && !objectDescription.includes(' ')) {
      setShowAdvice(true)
    } else {
      setShowAdvice(false)
    }
  }, [hasDrawn, objectDescription])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setCanSubmit(true)
    setHasDrawn(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    
    const clientX = e.clientX || e.touches?.[0]?.clientX
    const clientY = e.clientY || e.touches?.[0]?.clientY
    
    const x = (clientX - rect.left) * scaleX
    const y = (clientY - rect.top) * scaleY
    
    ctx.strokeStyle = currentColor
    ctx.lineWidth = brushSize
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setObjectDescription(previousObjectName)
    setAiGeneratedImage(null)
    setCanSubmit(false)
    setHasDrawn(false)
    setShowAdvice(false)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height)
        const x = (canvas.width - img.width * scale) / 2
        const y = (canvas.height - img.height * scale) / 2
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale)
        setCanSubmit(true)
        setHasDrawn(true)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleAdjectiveClick = (adjective) => {
    if (objectDescription.includes(adjective)) return
    
    setObjectDescription(prev => {
      if (prev.trim() === '') return adjective
      return adjective + ' ' + prev
    })
  }

  const handleSubmit = async () => {
    if (!objectDescription.trim()) {
      alert('사물을 묘사하는 말을 입력해주세요!')
      return
    }

    if (!canSubmit) {
      alert('그림을 그리거나 이미지를 업로드해주세요!')
      return
    }

    setIsProcessing(true)

    const canvas = canvasRef.current
    const imageData = canvas.toDataURL('image/png')

    try {
      setTimeout(() => {
        setAiGeneratedImage(`https://via.placeholder.com/400x400/FF6B6B/ffffff?text=${encodeURIComponent(objectDescription)}`)
        setIsProcessing(false)
        setShowAdvice(false)
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    clearCanvas()
    setAiGeneratedImage(null)
  }

  // 이 함수가 수정되었습니다.
  const handleNext = () => {
    navigate('/stage2/situation', {
      state: {
        objectDescription: objectDescription,
        previousImage: canvasRef.current.toDataURL('image/png')
      }
    })
  }

  return (
    <div className="description-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage2')}>
          ← 돌아가기
        </button>
        <ProgressTracker currentStep={2} />
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
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
        </div>

        {/* 오른쪽: 컨트롤 패널 */}
        <div className="control-panel">
          {/* 1단계 정보 */}
          {previousObjectName && (
            <div className="panel-section previous-info">
              <div className="info-content">
                <span className="info-label">📌 1단계에서 입력한 이름</span>
                <strong className="info-value">"{previousObjectName}"</strong>
              </div>
              <p className="info-hint">이제 이 사물을 더 자세히 묘사해보세요!</p>
            </div>
          )}

          {/* 파일 관리 */}
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
              📁 사진 업로드
            </button>
            <button className="panel-btn clear-btn" onClick={clearCanvas}>
              🗑️ 지우기
            </button>
          </div>
          {/* 학습 가이드 */}
          {!aiGeneratedImage && (
            <div className="panel-section guide-section">
              <h3 className="section-title">📚 학습 목표</h3>
              <div className="guide-list">
                <div className="guide-point">
                  <span className="point-num">1</span>
                  <p><strong>색깔, 크기, 모양</strong> 등을 추가</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">2</span>
                  <p><strong>명사 + 형용사</strong> = 구체화</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">3</span>
                  <p>형용사를 추가할수록 <strong>더 정확한 결과</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* 조언 메시지 */}
          {showAdvice && !aiGeneratedImage && (
            <div className="advice-banner">
              <span className="advice-icon">💡</span>
              <p>그림이 바뀌었네! 어떻게 바뀌었는지 글로도 알려줄까요?</p>
            </div>
          )}

          {/* 색상 선택 */}
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

          {/* 형용사 제안 */}
          <div className="panel-section">
            <h3 className="section-title">💬 꾸며주는 말 추가</h3>
            <div className="adjective-chips">
              {adjectiveSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="adjective-chip"
                  onClick={() => handleAdjectiveClick(suggestion.text)}
                >
                  {suggestion.emoji} {suggestion.text}
                </button>
              ))}
            </div>
          </div>

          {/* 텍스트 입력 */}
          <div className="panel-section">
            <h3 className="section-title">✍️ 묘사하기</h3>
            <input
              type="text"
              className="object-input"
              placeholder={previousObjectName ? `예: 크고 빨간 ${previousObjectName}` : "예: 크고 빨간 사과"}
              value={objectDescription}
              onChange={(e) => setObjectDescription(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              disabled={aiGeneratedImage}
            />
            <p className="input-tip">💡 색깔, 크기, 모양 등을 함께 적어보세요!</p>
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isProcessing || !canSubmit || !objectDescription.trim() || aiGeneratedImage}
            >
              {isProcessing ? '⏳ 처리 중...' : '🚀 AI에게 보내기'}
            </button>
          </div>

        
        </div>
      </main>

      {/* AI 결과 - 전체 하단 */}
      {aiGeneratedImage && (
        <section className="result-section-full">
          <div className="result-container">
            <h2 className="result-title">🤖 AI가 이해한 묘사</h2>
            <div className="result-content">
              <div className="result-image-wrapper">
                <img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" />
              </div>
              <div className="result-info">
                <div className="success-badge">
                  <span className="badge-emoji">🎉</span>
                  <h3>훨씬 구체적이에요!</h3>
                </div>
                <p className="result-text">
                  "{objectDescription}"처럼 꾸며주는 말을 추가하니 AI가 더 정확하게 이해했어요!
                </p>
                <div className="learning-box">
                  <h4>💡 학습한 개념</h4>
                  <p><strong>명사 + 형용사 = 구체화</strong></p>
                  <p className="learning-desc">
                    색깔, 크기, 모양 등 '꾸며주는 말'을 추가하면 AI가 내 생각과 더 가까운 결과물을 만듭니다.
                  </p>
                </div>
                <div className="result-actions">
                  <button className="result-btn retry" onClick={handleRetry}>
                    🔄 다시 하기
                  </button>
                  <button className="result-btn next" onClick={handleNext}>
                    다음 단계로 → (3단계: 상황 부여)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default Description