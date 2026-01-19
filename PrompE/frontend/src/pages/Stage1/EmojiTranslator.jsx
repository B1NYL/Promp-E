import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Stage.css';

function EmojiTranslator() {
    const navigate = useNavigate();
    const { completeLesson, isCompleted } = useCompletion();
    const { gainExp, incrementCompletionCounts } = useUser();
    const { addActivity } = useActivity();

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("AI가 문제를 출제하고 있습니다");
    const [loadingDots, setLoadingDots] = useState(1);
    const hasRequestedRef = React.useRef(false);

    const generateQuestions = async () => {
        setIsLoading(true);
        try {
            const response = await api.getEmojiQuiz();
            setQuestions(response.questions || []);
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to generate questions:", error);
            // Fallback for Demo/Competition
            const fallbackQuestions = [
                {
                    id: 1,
                    emojis: "🦁 👑 🌅",
                    options: ["소파 위에서 자는 고양이", "석양 아래 바위 위의 사자 왕", "숲 속을 달리는 호랑이", "공을 가지고 노는 강아지"],
                    correctIndex: 1,
                    explanation: "사자(🦁), 왕관(👑), 일몰(🌅)은 '석양 아래 바위 위에 서 있는 사자 왕'을 의미합니다. (라이온 킹!)"
                },
                {
                    id: 2,
                    emojis: "🚀 🌕 👨‍🚀",
                    options: ["요리하는 요리사", "고속도로를 달리는 자동차", "달 위를 걷는 우주인", "바닷속을 헤엄치는 물고기"],
                    correctIndex: 2,
                    explanation: "로켓(🚀), 보름달(🌕), 우주인(👨‍🚀)은 우주 탐사를 나타냅니다."
                },
                {
                    id: 3,
                    emojis: "🏰 🐉 🔥",
                    options: ["녹고 있는 아이스크림", "성 근처에서 불을 뿜는 용", "말을 탄 기사", "정원에서 춤추는 공주"],
                    correctIndex: 1,
                    explanation: "성(🏰)과 용(🐉), 그리고 불(🔥)은 전형적인 판타지 장면을 묘사합니다."
                }
            ];
            setQuestions(fallbackQuestions);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoading) return;
        const intervalId = setInterval(() => {
            setLoadingDots(prev => (prev >= 3 ? 1 : prev + 1));
        }, 500);
        return () => clearInterval(intervalId);
    }, [isLoading]);

    // Generate Questions via AI
    useEffect(() => {
        if (hasRequestedRef.current) return;
        hasRequestedRef.current = true;
        generateQuestions();
    }, []);


    const handleOptionClick = (index) => {
        if (showExplanation) return;
        setSelectedOption(index);
        const correct = index === questions[currentQuestion].correctIndex;
        setIsCorrect(correct);
        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(prev => prev + 1);
            setSelectedOption(null);
            setIsCorrect(null);
            setShowExplanation(false);
        } else {
            handleFinish();
        }
    };

    const handleFinish = () => {
        const lessonId = 's1-emoji-translator';
        const wasAlreadyCompleted = isCompleted(lessonId);

        gainExp(100, wasAlreadyCompleted);

        incrementCompletionCounts();
        if (!wasAlreadyCompleted) {
            addActivity({
                icon: '🧩',
                title: '[이모지 번역기] 미션 완료!',
                time: '방금 전'
            });
            completeLesson(lessonId);
        }

        setShowFinishModal(true);
    };

    if (isLoading) {
        return (
            <div className="stage-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', background: '#0f0f13', color: '#4ade80' }}>
                <div className="loading-spinner" style={{ borderTopColor: '#4ade80', borderRightColor: '#4ade80' }}></div>
                <h2 style={{ marginTop: '20px', fontFamily: 'monospace' }}>
                    {loadingMessage}{'.'.repeat(loadingDots)}
                </h2>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div className="stage-page" style={{ textAlign: 'center', padding: '50px', background: '#0f0f13', minHeight: '100vh', color: 'white' }}>
                <h1 className="stage-page-title">데이터 수신 실패</h1>
                <button className="btn-modern" onClick={generateQuestions} style={{
                    padding: '12px 24px', background: '#333', color: '#4ade80', border: '1px solid #4ade80', borderRadius: '8px', cursor: 'pointer'
                }}>시스템 재가동</button>
            </div>
        );
    }

    const q = questions[currentQuestion];

    return (
        <div className="stage-page emoji-translator-page" style={{ background: '#0f0f13', minHeight: '100vh', color: '#fff', padding: 0, display: 'flex', flexDirection: 'column' }}>
            {showFinishModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        background: 'rgba(20, 20, 30, 0.9)',
                        padding: '40px',
                        borderRadius: '24px',
                        border: '1px solid #4ade80',
                        width: '90%',
                        maxWidth: '450px',
                        textAlign: 'center',
                        boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px', textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>🎉</div>
                        <h2 style={{ marginBottom: '15px', color: '#4ade80', fontFamily: 'monospace' }}>MISSION COMPLETE!</h2>
                        <p style={{ color: '#ccc', marginBottom: '30px' }}>모든 이모지 암호를 해독했습니다.</p>
                        <button
                            onClick={() => {
                                setShowFinishModal(false);
                                setCurrentQuestion(0);
                                setSelectedOption(null);
                                setIsCorrect(null);
                                setShowExplanation(false);
                                generateQuestions();
                            }}
                            style={{ width: '100%', marginBottom: '15px', padding: '16px', background: '#4ade80', color: '#000', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
                        >
                            다시 시작하기
                        </button>
                        <button
                            onClick={() => navigate('/stage1')}
                            style={{ width: '100%', padding: '16px', background: 'transparent', color: '#888', border: '1px solid #444', borderRadius: '12px', cursor: 'pointer' }}
                        >
                            나가기
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="stage-header" style={{
                background: 'rgba(20,20,30,0.8)', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ background: '#333', color: '#4ade80', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>STAGE 1</span>
                    <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        🧩 이모지 번역기
                    </h1>
                </div>
                <button onClick={() => navigate('/stage1')} style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </header>

            <main className="quiz-container" style={{
                flex: 1,
                maxWidth: '800px',
                margin: '40px auto',
                width: '100%',
                padding: '0 20px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Progress Bar */}
                <div className="progress-bar-quiz" style={{ width: '100%', height: '6px', background: '#222', borderRadius: '3px', marginBottom: '40px', overflow: 'hidden' }}>
                    <div
                        className="progress-fill"
                        style={{
                            width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                            height: '100%',
                            background: '#4ade80',
                            boxShadow: '0 0 10px #4ade80',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                        }}
                    ></div>
                </div>

                <div className="question-section" style={{ textAlign: 'center', marginBottom: '50px' }}>
                    <h2 style={{ fontSize: '1rem', color: '#4ade80', marginBottom: '20px', fontFamily: 'monospace', letterSpacing: '2px' }}>QUESTION {currentQuestion + 1} / {questions.length}</h2>
                    <div className="emoji-display" style={{
                        fontSize: '6rem',
                        margin: '30px 0',
                        letterSpacing: '15px',
                        animation: 'float 3s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
                    }}>
                        {q.emojis}
                    </div>
                    <p style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 'bold' }}>이 암호가 의미하는 것은?</p>
                </div>

                <div className="options-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {q.options.map((option, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleOptionClick(idx)}
                            disabled={showExplanation}
                            style={{
                                padding: '24px',
                                fontSize: '1.1rem',
                                borderRadius: '16px',
                                border: '1px solid',
                                borderColor: showExplanation
                                    ? (idx === q.correctIndex ? '#4ade80' : (idx === selectedOption ? '#ef4444' : '#333'))
                                    : (selectedOption === idx ? '#4ade80' : '#333'),
                                background: showExplanation
                                    ? (idx === q.correctIndex ? 'rgba(74, 222, 128, 0.1)' : (idx === selectedOption ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255,255,255,0.03)'))
                                    : (selectedOption === idx ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.03)'),
                                color: showExplanation && idx === q.correctIndex ? '#4ade80' : '#eee',
                                cursor: showExplanation ? 'default' : 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                boxShadow: selectedOption === idx ? '0 0 15px rgba(74, 222, 128, 0.1)' : 'none',
                                fontWeight: '600'
                            }}
                        >
                            <span style={{ marginRight: '10px', opacity: 0.5 }}>{String.fromCharCode(65 + idx)}.</span> {option}
                        </button>
                    ))}
                </div>

                {showExplanation && (
                    <div className="explanation-box" style={{
                        marginTop: '40px',
                        padding: '30px',
                        background: 'rgba(20,20,30,0.9)',
                        borderRadius: '20px',
                        border: `1px solid ${isCorrect ? '#4ade80' : '#ef4444'}`,
                        boxShadow: isCorrect ? '0 0 30px rgba(74, 222, 128, 0.1)' : '0 0 30px rgba(239, 68, 68, 0.1)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <h3 style={{ color: isCorrect ? '#4ade80' : '#ef4444', marginBottom: '10px', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {isCorrect ? "✅ ACCESS GRANTED" : "❌ ACCESS DENIED"}
                        </h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#ccc' }}>{q.explanation}</p>
                        <button
                            onClick={handleNext}
                            style={{
                                marginTop: '25px',
                                width: '100%',
                                fontSize: '1.1rem',
                                padding: '16px',
                                background: isCorrect ? '#4ade80' : '#333',
                                color: isCorrect ? '#000' : '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {currentQuestion < questions.length - 1 ? "다음 라운드" : "결과 리포트 확인"}
                        </button>
                    </div>
                )}
            </main>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}

export default EmojiTranslator;
