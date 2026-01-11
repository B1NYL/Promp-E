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
        <div className="hero-visual">
          {/* Ensure logo.png is good or use a character placeholder */}
          <img src="/logo.png" alt="Mascot" className="hero-img" />
        </div>

        <div className="hero-text">
          <h1 className="main-title">
            프롬프팅을 배우는<br />가장 재미있고 효과적인 방법!
          </h1>

          <div className="start-buttons">
            <button
              className="btn-3d btn-primary btn-start"
              onClick={() => navigate('/base')}
            >
              시작하기
            </button>
            <button
              className="btn-3d btn-outline btn-start"
              onClick={() => console.log('Login')}
            >
              이미 계정이 있어요
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartPage