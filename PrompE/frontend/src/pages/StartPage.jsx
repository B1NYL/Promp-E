import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/StartPage.css'

function StartPage() {
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/base')
  }

  const handleLogin = () => {
    console.log('로그인 페이지로 이동')
  }

  return (
    <div className="start-page">
      <header className="header">
        <div className="logo-text">
          <h1 className="logo">PrompE</h1>
          <span className="logo-sub">프롬피</span>
        </div>
        <button className="login-button" onClick={handleLogin}>
          로그인
        </button>
      </header>

      <div className="main-content">
        <div className="hero-image">
          <img src="/logo.png" alt="PrompE 로고" className="logo-img" />
        </div>

        <h2 className="main-title">
          학생들의 첫 프롬프팅,<br />
          프롬피
        </h2>

        <button 
          className={`start-button ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleStart}
        >
          시작하기
        </button>
      </div>


    </div>
  )
}

export default StartPage