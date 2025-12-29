import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/StartPage.css'

function StartPage() {
  const navigate = useNavigate()

  const handleStart = () => {
    navigate('/base')
  }

  const handleLogin = () => {
    console.log('Login clicked')
  }

  return (
    <div className="start-page">
      <header className="header glass-panel">
        <div className="logo-text">
          <h1 className="logo">PrompE</h1>
          <span className="logo-sub">AI Prompt Class</span>
        </div>
        <button className="login-button" onClick={handleLogin}>
          Sign In
        </button>
      </header>

      <div className="main-content">
        <div className="hero-image">
          {/* Ensure logo.png is a high-quality asset or replaced with a 3D element */}
          <img src="/logo.png" alt="PrompE Logo" className="logo-img" />
        </div>

        <h2 className="main-title">
          Master the Art of <br />
          Prompt Engineering
        </h2>

        <button 
          className="start-button"
          onClick={handleStart}
        >
          Get Started
        </button>
      </div>

      <div className="features">
        <div className="feature-item">
          <span>✨</span> Interactive Learning
        </div>
        <div className="feature-item">
          <span>🚀</span> AI Powered
        </div>
        <div className="feature-item">
          <span>💡</span> Creative Thinking
        </div>
      </div>
    </div>
  )
}

export default StartPage