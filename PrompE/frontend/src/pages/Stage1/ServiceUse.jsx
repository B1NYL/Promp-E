import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/ServiceUse.css'

function ServiceUse() {
  const navigate = useNavigate()

  return (
    <div className="service-use-page">
      <header className="lesson-header">
        <button className="back-button" onClick={() => navigate('/stage1')}>
          ← 돌아가기
        </button>
        <div className="lesson-badge">
          <span className="badge-icon">💡</span>
          <span className="badge-text">LESSON 1</span>
        </div>
      </header>

      <main className="lesson-content">
        <div className="lesson-title-section">
          <h1 className="lesson-main-title">AI 서비스 활용법</h1>
          <p className="lesson-subtitle">
            일상에서 쉽게 사용할 수 있는 AI 서비스를 소개합니다
          </p>
        </div>

        <article className="lesson-article">
          <section className="content-section">
            <h2 className="section-title">🤖 AI 서비스란?</h2>
            <p className="section-text">
              AI(인공지능) 서비스는 우리의 일상생활을 더 편리하게 만들어주는 똑똑한 도구입니다. 
              질문에 답하고, 글을 써주고, 그림을 그려주는 등 다양한 일을 도와줄 수 있어요.
            </p>
          </section>

          <section className="content-section">
            <h2 className="section-title">✨ 대표적인 AI 서비스</h2>
            
            <div className="service-card">
              <div className="service-header">
                <h3 className="service-name">ChatGPT</h3>
                <span className="service-tag">대화형 AI</span>
              </div>
              <p className="service-description">
                질문을 하면 사람처럼 대답해주는 AI입니다. 
                공부 도우미, 글쓰기 도우미, 아이디어 브레인스토밍 등 다양하게 활용할 수 있어요.
              </p>
              <div className="service-example">
                <strong>활용 예시:</strong>
                <ul>
                  <li>"프로그래밍 공부 방법을 알려줘"</li>
                  <li>"생일 축하 메시지를 작성해줘"</li>
                  <li>"이 수학 문제 풀이 방법을 설명해줘"</li>
                </ul>
              </div>
            </div>

            <div className="service-card">
              <div className="service-header">
                <h3 className="service-name">DALL-E / Midjourney</h3>
                <span className="service-tag">이미지 생성 AI</span>
              </div>
              <p className="service-description">
                텍스트로 설명하면 그에 맞는 이미지를 그려주는 AI입니다. 
                상상하는 장면을 말로 설명만 하면 그림으로 만들어줘요.
              </p>
              <div className="service-example">
                <strong>활용 예시:</strong>
                <ul>
                  <li>"우주를 여행하는 고양이"</li>
                  <li>"미래 도시의 풍경"</li>
                  <li>"판타지 세계의 성"</li>
                </ul>
              </div>
            </div>

            <div className="service-card">
              <div className="service-header">
                <h3 className="service-name">Google Gemini</h3>
                <span className="service-tag">멀티모달 AI</span>
              </div>
              <p className="service-description">
                텍스트뿐만 아니라 이미지, 음성 등 다양한 형태의 정보를 이해하고 답변할 수 있는 AI입니다.
              </p>
              <div className="service-example">
                <strong>활용 예시:</strong>
                <ul>
                  <li>사진을 보여주고 "이게 무엇인지 설명해줘"</li>
                  <li>"이 그래프를 분석해줘"</li>
                  <li>"이 레시피 사진으로 요리법 알려줘"</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="content-section">
            <h2 className="section-title">💡 AI 서비스 잘 활용하는 방법</h2>
            
            <div className="tip-box">
              <div className="tip-item">
                <span className="tip-number">1</span>
                <div className="tip-content">
                  <h4>명확하게 질문하기</h4>
                  <p>애매한 질문보다는 구체적이고 명확한 질문을 하면 더 좋은 답변을 받을 수 있어요.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">2</span>
                <div className="tip-content">
                  <h4>단계적으로 접근하기</h4>
                  <p>복잡한 문제는 한 번에 물어보기보다 단계를 나눠서 질문하면 더 좋아요.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">3</span>
                <div className="tip-content">
                  <h4>예시를 함께 제공하기</h4>
                  <p>원하는 결과의 예시를 함께 보여주면 AI가 더 정확하게 이해할 수 있어요.</p>
                </div>
              </div>

              <div className="tip-item">
                <span className="tip-number">4</span>
                <div className="tip-content">
                  <h4>피드백 주기</h4>
                  <p>AI의 답변이 마음에 들지 않으면 "더 쉽게 설명해줘" 같은 추가 요청을 해보세요.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="content-section highlight-section">
            <h2 className="section-title">🎯 다음 단계</h2>
            <p className="section-text">
              이제 AI 서비스가 무엇인지 알게 되었어요! 
              다음 레슨에서는 직접 AI와 대화하면서 더 효과적으로 소통하는 방법을 배워볼 거예요.
            </p>
            <button className="next-button" onClick={() => navigate('/stage1/chat')}>
              다음 단계로 넘어가기
            </button>
          </section>
        </article>
      </main>
    </div>
  )
}

export default ServiceUse