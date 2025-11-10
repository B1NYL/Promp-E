import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import ProgressTracker from '../../components/ProgressTracker'
import '../../css/Verbalization.css'

function Verbalization() {
  const navigate = useNavigate()
  
  const [fullPrompt, setFullPrompt] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiGeneratedImage, setAiGeneratedImage] = useState(null)
  
  const allHints = {
    descriptors: { name: "묘사", color: "blue", items: ["알록달록한", "커다란", "작은", "반짝이는", "부드러운"] },
    context: { name: "상황/행동", color: "green", items: ["숲속에서 잠자는", "하늘을 날며", "물속에서 헤엄치는", "산 위에서 노래하는"] },
    emotions: { name: "감정/스타일", color: "purple", items: ["용감하게", "평화롭게", "신비롭게", "장난스럽게", "판타지 아트 스타일"] },
  }

  const handleHintClick = (word) => {
    setFullPrompt(prev => prev ? `${prev.trim()} ${word}` : word)
  }

  const handleSubmit = async () => {
    if (!fullPrompt.trim()) {
      alert('프롬프트를 작성해주세요!')
      return
    }

    setIsProcessing(true)
    try {
      setTimeout(() => {
        setAiGeneratedImage(`https://via.placeholder.com/400x400/FFB703/ffffff?text=${encodeURIComponent(fullPrompt)}`)
        setIsProcessing(false)
      }, 2000)
    } catch (error) {
      console.error('Error:', error)
      alert('오류가 발생했습니다. 다시 시도해주세요.')
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setFullPrompt('')
    setAiGeneratedImage(null)
  }

  const handleFinish = () => {
    navigate('/stage2')
  }

  return (
    <div className="verbalization-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage2')}>
          ← 돌아가기
        </button>
        <ProgressTracker currentStep={5} />
        <div className="header-placeholder"></div>
      </header>

      <main className="lesson-main">
        {/* 왼쪽: 프롬프트 작성 영역 */}
        <div className="verbalization-workspace">
          {/* 최종 미션 카드 */}
          <div className="mission-card-final">
            <div className="card-icon">✍️</div>
            <div className="card-content">
              <h3>최종 도전: 언어화</h3>
              <p>그림 없이 오직 글자로만 상상 속 이미지를 만들어보세요!</p>
            </div>
          </div>

          {/* 프롬프트 입력창 */}
          <div className="prompt-input-area">
            <label htmlFor="fullPrompt" className="prompt-label">나만의 프롬프트 만들기</label>
            <textarea
              id="fullPrompt"
              className="prompt-textarea-main"
              placeholder="예: 구름 위를 걷고 있는 무지갯빛 날개를 가진 아기 사자, 용감하게 포효하는 모습, 판타지 아트 스타일"
              value={fullPrompt}
              onChange={(e) => setFullPrompt(e.target.value)}
              rows={10}
              disabled={aiGeneratedImage}
            />
          </div>
        </div>

        {/* 오른쪽: 컨트롤 패널 */}
        <div className="control-panel">
          {/* 힌트 모음 */}
          <div className="panel-section">
            <h3 className="section-title">💡 힌트 모음 (클릭하여 추가)</h3>
            <div className="hint-categories">
              {Object.values(allHints).map(category => (
                <div key={category.name} className="hint-category">
                  <h4 className={`hint-category-title ${category.color}`}>{category.name}</h4>
                  <div className="hint-chips">
                    {category.items.map((word) => (
                      <button
                        key={word}
                        className={`hint-chip ${category.color}`}
                        onClick={() => handleHintClick(word)}
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 제출 버튼 */}
          <div className="panel-section submit-panel">
            <button
              className="submit-button"
              onClick={handleSubmit}
              disabled={isProcessing || !fullPrompt.trim() || aiGeneratedImage}
            >
              {isProcessing ? (
                <>
                  <div className="btn-spinner"></div>
                  생성 중...
                </>
              ) : (
                '🚀 최종 제출'
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
                  <p><strong>그림(시각)</strong>에서 <strong>텍스트(언어)</strong>로 완전 전환</p>
                </div>
                <div className="guide-point">
                  <span className="point-num">2</span>
                  <p>지금까지 배운 모든 기술을 활용하여 프롬프트 완성</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* AI 결과 */}
      {aiGeneratedImage && (
        <section className="result-section-full">
          {/* ... (이전과 동일) ... */}
          <div className="result-container">
            <h2 className="result-title">🏆 프롬프트 마스터!</h2>
            <div className="result-content">
              <div className="result-image-wrapper">
                <img src={aiGeneratedImage} alt="AI 생성" className="result-image-large" />
              </div>
              <div className="result-info">
                <div className="success-badge">
                  <span className="badge-emoji">🎉</span>
                  <h3>완벽해요! 모든 단계를 마쳤습니다!</h3>
                </div>
                <div className="prompt-summary-box">
                  <h4>최종 완성 프롬프트</h4>
                  <p>"{fullPrompt}"</p>
                </div>
                <div className="learning-box">
                  <h4>💡 학습한 개념</h4>
                  <p><strong>그림(시각) → 텍스트(언어) 전환</strong></p>
                  <p className="learning-desc">
                    이제 그림 없이도 머릿속 생각을 온전히 언어로 표현하여 AI와 소통할 수 있게 되었습니다.
                  </p>
                </div>
                <div className="result-actions">
                  <button className="result-btn retry" onClick={handleRetry}>
                    🔄 다시 도전하기
                  </button>
                  <button className="result-btn next" onClick={handleFinish}>
                    Stage 2 목록으로
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

export default Verbalization