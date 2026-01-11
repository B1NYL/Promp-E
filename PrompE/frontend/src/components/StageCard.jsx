// React와 라우팅 관련 훅(hook)들을 import합니다.
import React from 'react'
import { useNavigate } from 'react-router-dom'

// 이 컴포넌트의 스타일을 import합니다.
import '../css/StageCard.css'

/**
 * 메인 페이지에 표시되는 각 스테이지 카드를 렌더링하는 컴포넌트입니다.
 * @param {object} props - 컴포넌트에 전달되는 속성들
 * @param {number} props.stage - 스테이지 번호 (예: 1, 2, 3)
 * @param {string} props.title - 스테이지 제목 (예: "AI와 프롬프트란?")
 * @param {string} props.description - 스테이지에 대한 간단한 설명
 * @param {string} props.icon - 스테이지를 나타내는 이모지 아이콘 (예: '🎯')
 * @param {string} props.color - 카드의 테마 색상 (예: '#00C8B3')
 * @param {boolean} [props.locked=false] - 스테이지가 잠겨있는지 여부 (기본값: false)
 */
function StageCard({ stage, title, description, icon, color, locked = false }) {
  // 페이지 이동을 위한 useNavigate 훅을 사용합니다.
  const navigate = useNavigate()

  /**
   * 카드를 클릭했을 때 실행되는 함수입니다.
   * 스테이지가 잠겨있지 않은 경우에만 해당 스테이지 페이지로 이동합니다.
   */
  const handleClick = () => {
    // 'locked' prop이 false일 때만 navigate 함수를 실행합니다.
    if (!locked) {
      // 템플릿 리터럴을 사용하여 '/stage1', '/stage2' 와 같은 경로를 동적으로 생성합니다.
      navigate(`/stage${stage}`)
    }
  }

  // 컴포넌트의 JSX 구조를 반환합니다.
  return (
    // 최상위 div. 카드 전체를 감쌉니다.
    <div
      // 'stage-card' 기본 클래스와, 'locked' prop이 true일 경우 'locked' 클래스를 추가합니다.
      className={`stage-card ${locked ? 'locked' : ''}`}
      // 'color' prop으로 받은 색상을 테두리 색상으로 동적으로 적용합니다.
      style={{ borderColor: color }}
      // 클릭 시 handleClick 함수를 호출합니다.
      onClick={handleClick}
    >
      {/* 스테이지 번호를 표시하는 부분 */}
      <div className="stage-number" style={{ backgroundColor: color }}>
        스테이지 {stage}
      </div>

      {/* 이모지 아이콘을 표시하는 부분 */}
      <div className="stage-icon">{icon}</div>

      {/* 스테이지 제목을 표시하는 부분 */}
      <h3 className="stage-title">{title}</h3>

      {/* 스테이지 설명을 표시하는 부분 */}
      <p className="stage-description">{description}</p>

      {/* 
        조건부 렌더링: 'locked' prop 값에 따라 다른 UI를 보여줍니다.
        - true: 자물쇠 아이콘을 보여줍니다.
        - false: '시작하기' 버튼을 보여줍니다.
      */}
      {locked ? (
        <div className="locked-badge">🔒</div>
      ) : (
        <button className="stage-button" style={{ backgroundColor: color }}>
          시작하기
        </button>
      )}
    </div>
  )
}

export default StageCard