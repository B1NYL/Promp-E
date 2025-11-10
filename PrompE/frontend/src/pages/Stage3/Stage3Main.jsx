import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/Stage.css'

function Stage3Main() {
  const navigate = useNavigate()

  const lessons = [
    { id: 1, title: '리얼 프롬프트 엔지니어링', icon: '🎯', completed: false },
    { id: 2, title: 'AI 비서 만들기', icon: '🤖', completed: false },
    { id: 3, title: '창작 스토리 생성', icon: '📚', completed: false },
    { id: 4, title: '이미지 생성 마스터', icon: '🖼️', completed: false },
    { id: 5, title: '실전 프로젝트', icon: '💼', completed: false },
    { id: 6, title: '최종 테스트', icon: '🏆', completed: false },
  ]

  return (
    <div className="stage-page">
      <header className="stage-header">
        <h1 className="stage-page-title">
          <span className="stage-badge">STAGE 3</span>
          리얼 AI 마스터링
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
            <button className="lesson-button">
              {lesson.completed ? '복습하기' : '시작하기'}
            </button>
            {lesson.completed && <div className="completed-badge">✓</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Stage3Main