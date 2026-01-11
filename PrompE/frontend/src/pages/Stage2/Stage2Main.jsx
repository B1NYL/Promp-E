import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Stage.css';
import { useCompletion } from '../../services/CompletionContext';

function Stage2Main() {
  const navigate = useNavigate();
  const { isCompleted } = useCompletion();

  const lessons = [
    { id: 's2-thinking', title: '상상해보기', icon: '💡', path: '/stage2/thinking' },
    { id: 's2-puzzle', title: '프롬프트 탐정', icon: '🕵️‍♀️', path: '/stage2/puzzle' },
  ];

  const handleLessonClick = (path) => {
    if (path) {
      navigate(path);
    } else {
      alert('준비 중입니다!');
    }
  };

  return (
    <div className="stage-page">
      <header className="stage-header">
        <h1 className="stage-page-title">
          <span className="stage-badge stage2-badge">스테이지 2</span>
          생각 구체화하기
        </h1>
        <button className="back-button" onClick={() => navigate('/base')}>
          ← 전체 학습으로
        </button>
      </header>

      <div className="lessons-container">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className={`lesson-card ${isCompleted(lesson.id) ? 'completed' : ''}`}
            onClick={() => handleLessonClick(lesson.path)}
          >
            <div className="lesson-icon">{lesson.icon}</div>
            <h3 className="lesson-title">{lesson.title}</h3>
            <button className="lesson-button">
              {isCompleted(lesson.id) ? '복습하기' : '시작하기'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Stage2Main;