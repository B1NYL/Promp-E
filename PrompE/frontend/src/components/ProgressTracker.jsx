// React와 라우팅 관련 훅(hook)들을 import합니다.
import React from 'react'
import { useNavigate } from 'react-router-dom'

// 이 컴포넌트의 스타일을 import합니다.
import '../css/ProgressTracker.css'

/**
 * 학습 단계를 시각적으로 보여주는 진행도 표시줄 컴포넌트입니다.
 * @param {object} props - 컴포넌트에 전달되는 속성들
 * @param {number} props.currentStep - 현재 활성화된 단계의 번호입니다.
 */
function ProgressTracker({ currentStep }) {
  // 페이지 이동을 처리하기 위해 react-router-dom의 useNavigate 훅을 사용합니다.
  const navigate = useNavigate()

  // 각 단계의 정보(번호, 이름, 경로)를 담고 있는 배열입니다.
  // 나중에 새로운 단계를 추가하거나 수정할 때 이 배열만 변경하면 됩니다.
  const steps = [
    { step: 1, name: '인지', path: '/stage3/cognition' },
    { step: 2, name: '묘사', path: '/stage3/description' },
    { step: 3, name: '상황 부여', path: '/stage3/situation' },
    { step: 4, name: '추상화', path: '/stage3/abstraction' },
    { step: 5, name: '언어화', path: '/stage3/verbalization' },
  ]

  /**
   * 각 단계를 클릭했을 때 실행되는 함수입니다.
   * @param {string} path - 클릭된 단계의 이동 경로입니다.
   */
  const handleStepClick = (path) => {
    // 경로가 '#'이 아닌 유효한 경로일 경우에만 페이지 이동을 실행합니다.
    // '#'은 아직 준비되지 않은 페이지를 의미할 수 있습니다.
    if (path !== '#') {
      navigate(path)
    }
  }

  // 컴포넌트의 JSX 구조를 반환합니다.
  return (
    // 전체 진행도 표시줄을 감싸는 컨테이너입니다.
    <div className="progress-tracker">
      {/* 
        'steps' 배열을 순회하며 각 단계에 맞는 UI를 동적으로 생성합니다.
        map 함수의 두 번째 인자인 'index'는 현재 요소의 인덱스입니다.
      */}
      {steps.map((step, index) => (
        // `map` 안에서 여러 JSX 요소를 그룹화하기 위해 React.Fragment를 사용합니다.
        // 불필요한 div 태그 생성을 막아 DOM 구조를 깨끗하게 유지합니다.
        <React.Fragment key={step.step}>
          {/* 각 단계를 나타내는 div 요소입니다. */}
          <div
            // 기본 클래스는 'progress-step'입니다.
            // `currentStep` prop으로 받은 값과 현재 순회 중인 `step.step`이 일치하면
            // 'active' 클래스를 추가하여 활성화된 스타일을 적용합니다.
            className={`progress-step ${currentStep === step.step ? 'active' : ''}`}
            // 이 div를 클릭하면 handleStepClick 함수가 해당 단계의 경로와 함께 호출됩니다.
            onClick={() => handleStepClick(step.path)}
          >
            {/* 단계 번호를 보여주는 원 */}
            <div className="step-number">{step.step}</div>
            {/* 단계 이름을 보여주는 텍스트 */}
            <div className="step-name">{step.name}</div>
          </div>
          
          {/* 
            조건부 렌더링:
            현재 단계가 마지막 단계가 아닐 경우에만(index가 배열 길이-1보다 작을 때)
            단계 사이에 화살표(→)를 렌더링합니다.
          */}
          {index < steps.length - 1 && <div className="progress-arrow">→</div>}
        </React.Fragment>
      ))}
    </div>
  )
}

// 이 컴포넌트를 다른 파일에서 사용할 수 있도록 export합니다.
export default ProgressTracker