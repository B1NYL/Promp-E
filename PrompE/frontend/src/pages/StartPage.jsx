import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/StartPage.css'

function StartPage() {
  const navigate = useNavigate()

  return (
    <div className="start-page">
      <div className="start-header">
        <div className="start-logo">PrompE</div>
      </div>

      <div className="start-content">
        <div className="hero-text">
          <h1 className="main-title">
            아이들을 위한 프롬프팅 교육,<br />프롬피
          </h1>
          <div className="start-buttons">
            <button
              className="btn-3d btn-primary btn-start"
              onClick={() => navigate('/base')}
            >
              시작하기
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="visual-frame">
            <img src="/logo.png" alt="Mascot" className="hero-img" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartPage
