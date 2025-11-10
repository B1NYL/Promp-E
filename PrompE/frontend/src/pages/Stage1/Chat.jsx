import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api' // api.js import
import '../../css/Chat.css'

function Chat() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: '안녕하세요! 저는 AI 어시스턴트입니다. 무엇이든 물어보세요! 😊',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  const examplePrompts = [
    '프로그래밍을 배우고 싶어요',
    '오늘 저녁 메뉴 추천해줘',
    '재미있는 이야기 들려줘',
    '영어 공부 방법 알려줘'
  ]

  const userMessageCount = messages.filter(msg => msg.type === 'user').length

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [inputValue])

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || isTyping) return

    const newUserMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    const updatedMessages = [...messages, newUserMessage]
    setMessages(updatedMessages)
    setInputValue('')
    setIsTyping(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    try {
      // API에 보낼 messages 배열을 포맷에 맞게 변환합니다.
      const messagesForAPI = updatedMessages
        .filter(msg => msg.id !== 1) // 초기 인사 메시지는 제외
        .map(msg => ({
          role: msg.type === 'ai' ? 'assistant' : 'user',
          content: msg.content
        }));

      // api.chatWithAI 함수에 전체 대화 기록을 전달합니다.
      const data = await api.chatWithAI(messagesForAPI);

      const newAiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: data.reply,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, newAiMessage])

    } catch (error) {
      console.error("Failed to get AI response:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: '죄송합니다, AI와 연결하는 데 문제가 발생했어요. 😥',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
  }

  const handleExampleClick = (prompt) => {
    setInputValue(prompt)
  }

  const handleNextStep = () => {
    navigate('/stage1')
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="back-button" onClick={() => navigate('/stage1')}>
          ← 돌아가기
        </button>
        <div className="chat-title">
          <h1>AI와 대화하기</h1>
          <span className="status-indicator">
            <span className="status-dot"></span>
            온라인
          </span>
        </div>
        <div className="header-actions">
          <button className="help-button" title="도움말">
            ❓
          </button>
        </div>
      </header>

      <div className="prompt-tip-banner">
        <span className="tip-icon">💡</span>
        <p className="tip-text">
          <strong>프롬프트 작성 팁:</strong> 구체적으로 질문할수록 더 좋은 답변을 받을 수 있어요!
          {userMessageCount < 10 && (
            <span className="progress-count"> ({userMessageCount}/10 대화 완료)</span>
          )}
        </p>
      </div>

      <div className="messages-container">
        <div className="messages-wrapper">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`message ${message.type === 'user' ? 'message-user' : 'message-ai'}`}
            >
              <div className="message-avatar">
                {message.type === 'user' ? '👤' : '🤖'}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {message.content}
                </div>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="message message-ai">
              <div className="message-avatar">🤖</div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="example-prompts">
            <p className="example-title">이런 질문을 해보세요:</p>
            <div className="example-buttons">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => handleExampleClick(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="input-container">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            className="message-input"
            placeholder="메시지를 입력하세요... (Shift+Enter: 줄바꿈)"
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button 
            className="send-button" 
            onClick={handleSendMessage}
            disabled={inputValue.trim() === '' || isTyping}
          >
            <span className="send-icon">📤</span>
          </button>
        </div>
        <p className="input-hint">
          AI는 실수할 수 있습니다. 중요한 정보는 꼭 확인하세요.
        </p>
      </div>

      {userMessageCount >= 10 && (
        <button className="floating-next-button" onClick={handleNextStep}>
          학습 완료! 돌아가기 🚀
        </button>
      )}
    </div>
  )
}

export default Chat