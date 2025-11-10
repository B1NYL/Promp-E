import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../css/Header.css'

function Header() {
  const navigate = useNavigate()

  return (
      <header className="base-header">
        <div className="logo-text" onClick={() => navigate('/base')}>
          <h1 className="logo">PrompE</h1>
          <span className="logo-sub">프롬피</span>
        </div>
        
        <div className="header-right">
          <div className="user-progress">
            <span className="progress-text">진행률</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '30%' }}></div>
            </div>
            <span className="progress-percent">30%</span>
          </div>
          <button className="profile-button">👤</button>
        </div>
      </header>
  )
}

export default Header