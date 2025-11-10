import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProgressTracker from '../../components/ProgressTracker'
import '../../css/Situation.css'

function Situation() {
  const navigate = useNavigate()
  const location = useLocation()
  const canvasRef = useRef(null)
  
  const [situation, setSituation] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null)
  
  // 이전 단계(Description)에서 전달받은 묘사 텍스트
  const previousDescription = location.state?.objectDescription || ''

  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 이전 단계에서 그린 그림을 캔버스에 불러오기
      if (location.state?.previousImage) {
        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0)
        }
        img.src = location.state.previousImage
      }
    }
  }, [location.state])

  const handleSubmit = async () => {
    if (!situation.trim()) {
      alert('상황을 입력해주세요!')
      return
    }

    setIsProcessing(true)

    const finalPrompt = `${previousDescription} ${situation}`

    try {
      // 시뮬레이션
      setTimeout(() => {
        setAiGeneratedImage(`https://via.placeholder.com/400x400/4a90e2/ffffff?text=${encodeURIComponent(finalPrompt)}`)
        setIsProcessing(false)
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setSituation('')
    setAiGeneratedImage(null)
  }

  // 이 함수가 수정되었습니다.
  const handleNext = () => {
    const finalPrompt = `${previousDescription} ${situation}`.trim()
    navigate('/stage2/abstraction', { // 4단계 경로
      state: {
        // '상황 부여' 단계까지 완성된 프롬프트 텍스트
        objectDescription: finalPrompt,
        // '상황 부여' 단계는 그림을 수정하지 않으므로, 이전 이미지를 그대로 전달합니다.
        previousImage: canvasRef.current.toDataURL('image/png')
      }
    })
  }

  return (
    <div className="situation-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage2')}>
          ← 돌아가기
        </button>
        <ProgressTracker currentStep={3} />
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

                    {/* 학습 가이드 */}
          {!aiGeneratedImage && (
            <div className="panel-section guide-section">
              <h3 className="section-title">📚 학습 목표</h3>
              <div className="guide-list">
                <div className="guide-point">
                  <span className="point-num">1</span>
                  <p><strong>장소</strong>와 <strong>행동</strong>을 추가하여 장면 만들기</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">2</span>
                  <p><strong>사물 + 상황/행동</strong> = 완성된 장면</p>
                </div>
              </div>
            </div>
          )}
          {/* 이전 단계 정보 */}
          <div className="panel-section previous-info">
            <h3 className="section-title">📝 지금까지의 묘사</h3>
            <p className="description-summary">{previousDescription}</p>
          </div>

          {/* 상황 입력 */}
          <div className="panel-section">
            <h3 className="section-title">🎬 상황을 추가해주세요</h3>
            <textarea
              id="situation"
              className="situation-textarea"
              placeholder="어디에 있나요? 무엇을 하고 있나요? (예: 숲속에서 잠자는, 바닷가에서 점프하는)"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              rows={4}
              disabled={aiGeneratedImage}
            />
          </div>

          {/* 팁 박스 */}
          <div className="tip-box">
            <strong>💡 팁:</strong> 배경(장소)과 행동(동작)을 함께 설명하면 더 생동감 있는 장면이 만들어져요!
          </div>

          {/* 제출 버튼 */}
          <div className="panel-section submit-panel">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isProcessing || !situation.trim() || aiGeneratedImage}
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
                  <h3>장면이 완성됐어요!</h3>
                </div>
                <div className="prompt-summary-box">
                  <h4>최종 프롬프트</h4>
                  <p>"{previousDescription} <strong>{situation}</strong>"</p>
                </div>
                <div className="learning-box">
                  <h4>💡 학습한 개념</h4>
                  <p><strong>사물 + 상황/행동 = 장면</strong></p>
                  <p className="learning-desc">
                    장면을 구체적으로 설명하면 AI가 더 풍부하고 생동감 있는 이미지를 만듭니다.
                  </p>
                </div>
                <div className="result-actions">
                  <button className="result-btn retry" onClick={handleRetry}>
                    🔄 다시 하기
                  </button>
                  <button className="result-btn next" onClick={handleNext}>
                    다음 단계로 → (4단계: 추상화)
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

export default Situation