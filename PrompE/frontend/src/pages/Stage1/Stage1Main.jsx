import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/Stage.css'

function Stage1Main() {
  const navigate = useNavigate()

  const lessons = [
    { id: 1, title: 'AI 서비스 활용법', icon: '💡', completed: false, path: '/stage1/service-use' },
    { id: 2, title: '인공지능과 대화해보기', icon: '💬', completed: false, path: '/stage1/chat' },
    { id: 3, title: '인공지능 활용', icon: '🤖', completed: false, path: null },
    { id: 4, title: '바이브 코딩', icon: '⚡', completed: false, path: null },
    { id: 5, title: '인터랙티브 스토리텔링', icon: '📖', completed: false, path: null },
    { id: 6, title: '프롬프튜터링', icon: '🎓', completed: false, path: null },
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
          <span className="stage-badge">STAGE 1</span>
          AI와 프롬프트란?
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
            <button 
              className="lesson-button"
              onClick={() => handleLessonClick(lesson.path)}
            >
              {lesson.completed ? '복습하기' : '시작하기'}
            </button>
            {lesson.completed && <div className="completed-badge">✓</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stage1Main