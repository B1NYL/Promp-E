import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Stage.css';
import { useCompletion } from '../../services/CompletionContext';

function Stage3Main() {
  const navigate = useNavigate();
  const { isCompleted } = useCompletion();

  const lessons = [
    { id: 's3-block-coding', title: '프롬프트 블록코딩', icon: '🧩', path: '/stage3/block-drawing' },
    { id: 's3-promptutoring', title: '프롬프튜터링', icon: '🎓️', path: '/stage3/cognition' },
    { id: 's3-composition', title: '프롬PT', icon: '🤖', path: '/stage3/PromptComposition' },
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
          <span className="stage-badge stage3-badge">스테이지 3</span>
          AI랑 같이하기
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

export default Stage3Main;