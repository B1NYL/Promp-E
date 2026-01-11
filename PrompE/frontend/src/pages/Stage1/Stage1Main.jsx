import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompletion } from '../../services/CompletionContext'; // 훅 import
import '../../css/Stage.css';

function Stage1Main() {
  const navigate = useNavigate();
  const { isCompleted } = useCompletion(); // 완료 상태 확인 함수 가져오기

  // 각 레슨에 고유한 ID 부여
  const lessons = [
    { id: 's1-service-use', title: 'AI 서비스 활용법', icon: '💡', path: '/stage1/service-use' },
    { id: 's1-chat', title: 'AI와 대화하기', icon: '💬', path: '/stage1/chat' },
    { id: 's1-emoji-translator', title: '이모지 번역기', icon: '🧩', path: '/stage1/emoji-translator' },
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
          <span className="stage-badge">스테이지 1</span>
          AI와 친해지기
        </h1>
        <button className="back-button" onClick={() => navigate('/base')}>
          ← 전체 학습으로
        </button>
      </header>

      <div className="lessons-container">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            // isCompleted 함수로 확인하여 'completed' 클래스 동적 추가
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

export default Stage1Main;