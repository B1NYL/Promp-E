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
            The free, fun, and effective way to learn Prompting!
          </h1>

          <div className="start-buttons">
            <button
              className="btn-3d btn-primary btn-start"
              onClick={() => navigate('/base')}
            >
              GET STARTED
            </button>
            <button
              className="btn-3d btn-outline btn-start"
              onClick={() => console.log('Login')}
            >
              I ALREADY HAVE AN ACCOUNT
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StartPage