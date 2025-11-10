import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProgressTracker from '../../components/ProgressTracker'
import '../../css/Abstraction.css'

function Abstraction() {
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef(null)
  
  const [emotion, setEmotion] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null)
  
  // 이전 단계들에서 만들어진 설명
  const previousDescription = location.state?.objectDescription || ''
  const previousSituation = location.state?.situation || ''
  const previousPromptText = `${previousDescription} ${previousSituation}`.trim()

  const emotionHints = [
    { text: "용감하게", emoji: "🦸" },
    { text: "수줍게", emoji: "😊" },
    { text: "카리스마 있게", emoji: "😎" },
    { text: "평화롭게", emoji: "🕊️" },
    { text: "신비롭게", emoji: "🔮" },
    { text: "장난스럽게", emoji: "😜" },
    { text: "위엄 있게", emoji: "👑" },
    { text: "친근하게", emoji: "🤗" },
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
        }
        img.src = location.state.previousImage
      }
    }
  }, [location.state])
  const handleHintClick = (word) => {
    setEmotion(prev => prev ? `${prev}, ${word}` : word)
  }

  const handleSubmit = async () => {
    if (!emotion.trim()) {
      alert('감정이나 스타일을 입력해주세요!')
      return
    }

    setIsProcessing(true)
    const finalPrompt = `${previousPromptText}, ${emotion}`

    try {
      setTimeout(() => {
        setAiGeneratedImage(`https://via.placeholder.com/400x400/A855F7/ffffff?text=${encodeURIComponent(finalPrompt)}`)
        setIsProcessing(false)
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setEmotion('')
    setAiGeneratedImage(null)
  }

  const handleNext = () => {
    navigate('/stage2/verbalization') // 5단계로 이동
  }

  return (
    <div className="abstraction-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage2')}>
          ← 돌아가기
        </button>
        <ProgressTracker currentStep={4} />
        <div className="header-placeholder"></div>
      </header>

      <main className="lesson-main">
        {/* 왼쪽: 이전 그림 표시 */}
        <div className="canvas-section">
          <div className="canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="drawing-canvas readonly"
            />
          </div>
        </div>
        {/* 오른쪽: 컨트롤 패널 */}
        <div className="control-panel">
          {/* 이전 단계 정보 */}
          <div className="panel-section previous-info">
            <h3 className="section-title">📝 지금까지의 프롬프트</h3>
            <p className="description-summary">{previousPromptText}</p>
          </div>

          {/* 감정/스타일 입력 */}
          
          <div className="panel-section">
            <h3 className="section-title">✨ 감정/스타일을 추가해주세요</h3>
            <textarea
              id="emotion"
              className="emotion-textarea"
              placeholder="어떤 느낌인가요? 어떤 분위기인가요?"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              rows={3}
              disabled={aiGeneratedImage}
            />
          </div>

          {/* 힌트 카드 */}
          <div className="panel-section">
            <h3 className="section-title">💡 힌트 카드 (클릭하여 추가)</h3>
            <div className="emotion-chips">
              {emotionHints.map((hint, index) => (
                <button
                  key={index}
                  className="emotion-chip"
                  onClick={() => handleHintClick(hint.text)}
                >
                  {hint.emoji} {hint.text}
                </button>
              ))}
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="panel-section submit-panel">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isProcessing || !emotion.trim() || aiGeneratedImage}
            >
              {isProcessing ? (
                <>
                  <div className="btn-spinner"></div>
                  생성 중...
                </>
              ) : (
                '🚀 AI에게 보내기'
              )}
            </button>
          </div>

          {/* 학습 가이드 */}
          {!aiGeneratedImage && (
            <div className="panel-section guide-section">
              <h3 className="section-title">📚 학습 목표</h3>
              <div className="guide-list">
                <div className="guide-point">
                  <span className="point-num">1</span>
                  <p>눈에 보이지 않는 <strong>감정이나 스타일</strong> 추가하기</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">2</span>
                  <p><strong>프롬프트 + 느낌</strong> = 창의적인 결과물</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI 결과 */}
      {aiGeneratedImage && (
        <section className="result-section-full">
          <div className="result-container">
            <h2 className="result-title">🤖 AI가 이해한 전체 장면</h2>
            <div className="result-content">
              <div className="result-image-wrapper">
                <img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" />
              </div>
              <div className="result-info">
                <div className="success-badge">
                  <span className="badge-emoji">🎉</span>
                  <h3>상상력이 더해졌어요!</h3>
                </div>
                <div className="prompt-summary-box">
                  <h4>최종 프롬프트</h4>
                  <p>"{previousPromptText}, <strong>{emotion}</strong>"</p>
                </div>
                <div className="learning-box">
                  <h4>💡 학습한 개념</h4>
                  <p><strong>프롬프트 + 스타일/감정 = 창의성</strong></p>
                  <p className="learning-desc">
                    눈에 보이지 않는 느낌이나 스타일을 언어로 지정하여 더욱 창의적인 이미지를 만들 수 있습니다.
                  </p>
                </div>
                <div className="result-actions">
                  <button className="result-btn retry" onClick={handleRetry}>
                    🔄 다시 하기
                  </button>
                  <button className="result-btn next" onClick={handleNext}>
                    다음 단계로 → (5단계: 언어화)
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

export default Abstraction