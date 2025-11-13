import React from 'react';
import { Palette, Blocks, ImageIcon, MessageSquare } from 'lucide-react';
import '../css/BlockCoding.css';

function AiGuidePanel({ currentStep }) {
  const steps = [
    { id: "drawing", icon: Palette, label: "미션 1: 그림 그리기" },
    { id: "assembly", icon: Blocks, label: "미션 2: 문장 조립" },
    { id: "results", icon: ImageIcon, label: "결과 확인" },
  ];

  const getCurrentTip = () => {
    switch (currentStep) {
      case "drawing":
        return "안녕! 먼저 그리고 싶은 주인공을 그리고 이름을 알려줘. 간단해도 괜찮아!";
      case "assembly":
        return "잘했어! 이제 블록들을 클릭해서 주인공을 꾸며주는 문장을 완성해봐!";
      case "results":
        return "와! 블록으로 문장을 만드니 정말 쉽지? AI가 너의 생각을 얼마나 잘 이해했는지 확인해봐!";
      default:
        return "시작해볼까?";
    }
  };

  const getStepStatus = (stepId) => {
    const stepOrder = ["drawing", "assembly", "results"];
    const currentIndex = stepOrder.indexOf(currentStep);
    const stepIndex = stepOrder.indexOf(stepId);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <aside className="ai-guide-panel">
      <div className="guide-header">
        <div className="guide-avatar">AI</div>
        <div>
          <h3 className="guide-title">AI 가이드</h3>
          <p className="guide-subtitle">친절한 도우미</p>
        </div>
      </div>

      <nav className="guide-nav">
        {steps.map((step) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className={`nav-step ${status}`}>
              <div className="step-icon-wrapper">
                <Icon className="step-icon" />
              </div>
              <span className="step-label">{step.label}</span>
            </div>
          );
        })}
      </nav>

      <div className="tip-box-guide">
        <div className="tip-header">
          <MessageSquare className="tip-icon-small" />
          <span>도움말</span>
        </div>
        <p className="tip-content">{getCurrentTip()}</p>
      </div>
    </aside>
  );
}

export default AiGuidePanel;