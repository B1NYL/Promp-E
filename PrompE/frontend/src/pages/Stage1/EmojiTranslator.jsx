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
    const { gainExp } = useUser();
    const { addActivity } = useActivity();

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [showExplanation, setShowExplanation] = useState(false);

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("AI가 문제를 출제하고 있습니다...");

    // Generate Questions via AI
    useEffect(() => {
        const generateQuestions = async () => {
            try {
                const prompt = `
          Create 3 fun emoji translation quizzes for elementary school students.
          Format: JSON Array.
          Each object must have:
          - "emojis": string (e.g., "🦁 👑 🌅")
          - "options": array of 4 Korean strings. One is correct, others are distractors.
          - "correctIndex": integer (0-3)
          - "explanation": string (Korean explanation why it is the answer)
          
          Make sure the options are in Korean. The emojis should describe a scene.
          Example: "🦁 👑 🌅" -> "석양 아래 바위 위에 서 있는 사자 왕"
        `;

                const response = await api.chatWithAI([
                    { role: "system", content: "You are a helpful assistant for kids." },
                    { role: "user", content: prompt }
                ]);

                // Parsing the AI response (assuming it returns JSON string in content)
                const aiContent = response.content || response.choices?.[0]?.message?.content;

                // Simple cleanup to extract JSON array
                const jsonStart = aiContent.indexOf('[');
                const jsonEnd = aiContent.lastIndexOf(']') + 1;
                const jsonString = aiContent.substring(jsonStart, jsonEnd);

                const parsedQuestions = JSON.parse(jsonString);
                setQuestions(parsedQuestions);
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

        if (!wasAlreadyCompleted) {
            addActivity({
                icon: '🧩',
                title: '[이모지 번역기] 미션 완료!',
                time: '방금 전'
            });
            completeLesson(lessonId);
        }

        alert("축하합니다! 모든 이모지 암호를 풀었어요!");
        navigate('/stage1');
    };

    if (isLoading) {
        return (
            <div className="stage-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
                <div className="loading-spinner"></div>
                <h2 style={{ marginTop: '20px', color: '#666' }}>{loadingMessage}</h2>
            </div>
        );
    }

    const q = questions[currentQuestion];

    return (
        <div className="stage-page emoji-translator-page">
            <header className="stage-header">
                <h1 className="stage-page-title">
                    <span className="stage-badge">스테이지 1</span>
                    🧩 이모지 번역기
                </h1>
                <button className="back-button" onClick={() => navigate('/stage1')}>← 나가기</button>
            </header>

            <main className="quiz-container" style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
                <div className="progress-bar-quiz" style={{ width: '100%', height: '10px', background: '#eee', borderRadius: '5px', marginBottom: '30px' }}>
                    <div
                        className="progress-fill"
                        style={{
                            width: `${((currentQuestion) / questions.length) * 100}%`,
                            height: '100%',
                            background: 'var(--primary)',
                            borderRadius: '5px',
                            transition: 'width 0.3s ease'
                        }}
                    ></div>
                </div>

                <div className="question-section" style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '1.2rem', color: '#666', marginBottom: '10px' }}>문제 {currentQuestion + 1} / {questions.length}</h2>
                    <div className="emoji-display" style={{ fontSize: '5rem', margin: '30px 0', letterSpacing: '10px', animation: 'float 3s ease-in-out infinite' }}>
                        {q.emojis}
                    </div>
                    <p style={{ fontSize: '1.3rem', color: '#333', fontWeight: 'bold' }}>이 이모지들이 설명하는 그림은?</p>
                </div>

                <div className="options-grid" style={{ display: 'grid', gap: '15px' }}>
                    {q.options.map((option, idx) => (
                        <button
                            key={idx}
                            className="option-button"
                            onClick={() => handleOptionClick(idx)}
                            disabled={showExplanation}
                            style={{
                                padding: '20px',
                                fontSize: '1.1rem',
                                borderRadius: '16px',
                                border: '3px solid',
                                borderColor: showExplanation
                                    ? (idx === q.correctIndex ? 'var(--primary)' : (idx === selectedOption ? '#FF6B6B' : '#eee'))
                                    : (selectedOption === idx ? 'var(--primary)' : '#eee'),
                                background: showExplanation
                                    ? (idx === q.correctIndex ? '#f0fdf4' : (idx === selectedOption ? '#fff5f5' : 'white'))
                                    : (selectedOption === idx ? '#f0fdf4' : 'white'),
                                color: '#333',
                                cursor: showExplanation ? 'default' : 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 4px 0 #eee',
                                fontWeight: 'bold'
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {showExplanation && (
                    <div className="explanation-box" style={{ marginTop: '30px', padding: '25px', background: isCorrect ? '#f0fdf4' : '#fff5f5', borderRadius: '16px', border: `2px solid ${isCorrect ? 'var(--primary)' : '#FF6B6B'}` }}>
                        <h3 style={{ color: isCorrect ? 'var(--primary)' : '#c53030', marginBottom: '10px', fontSize: '1.5rem' }}>
                            {isCorrect ? "정답입니다! 🎉" : "아쉽네요! 😅"}
                        </h3>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>{q.explanation}</p>
                        <button
                            className="btn-3d btn-primary"
                            onClick={handleNext}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                fontSize: '1.2rem'
                            }}
                        >
                            {currentQuestion < questions.length - 1 ? "다음 문제로" : "결과 확인하기"}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default EmojiTranslator;
