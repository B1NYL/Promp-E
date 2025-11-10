import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/Stage.css'

function Stage2Main() {
  const navigate = useNavigate()

  const lessons = [
    { id: 1, title: '프롬프트 블록코딩', icon: '🧩', completed: false},
    { id: 2, title: '프롬프튜터링', icon: '🎓️', completed: false ,path: '/stage2/cognition' },
  ]

  const handleLessonClick = (path) => {
  if (path) {
    navigate(path)
  } else {
    alert('준비 중입니다!')
  }
}

  return (
    <div className="stage-page">
      <header className="stage-header">
        <h1 className="stage-page-title">
          <span className="stage-badge">STAGE 2</span>
          프롬프트 마스터링
          <button className="back-button" onClick={() => navigate('/base')}>
            ← 돌아가기
          </button>
        </h1>
      </header>

      <div className="lessons-container">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="lesson-card">
            <div className="lesson-icon">{lesson.icon}</div>
            <h3 className="lesson-title">{lesson.title}</h3>
            <button className="lesson-button"
            onClick={() => handleLessonClick(lesson.path)}>
              {lesson.completed ? '복습하기' : '시작하기'}
            </button>
            {lesson.completed && <div className="completed-badge">✓</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stage2Main