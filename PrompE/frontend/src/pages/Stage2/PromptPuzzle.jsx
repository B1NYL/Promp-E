import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Stage.css';

const PuzzleBlock = ({ text, type, onClick, isSelected }) => {
    // Standardized Tech Studio Colors
    const getColors = (type) => {
        switch (type) {
            case 'subject': return { bg: 'rgba(74, 222, 128, 0.15)', border: '#4ade80', text: '#4ade80' }; // Green
            case 'action': return { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#3b82f6' };  // Blue
            case 'location': return { bg: 'rgba(192, 132, 252, 0.15)', border: '#c084fc', text: '#c084fc' }; // Purple
            default: return { bg: '#333', border: '#555', text: '#ccc' };
        }
    };
    const colors = getColors(type);

    return (
        <div
            onClick={onClick}
            style={{
                padding: '10px 16px',
                margin: '5px',
                borderRadius: '8px',
                background: isSelected ? 'rgba(255,255,255,0.05)' : colors.bg,
                color: isSelected ? '#666' : colors.text,
                border: `1px solid ${isSelected ? '#444' : colors.border}`,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: '600',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                transition: 'all 0.2s',
                transform: isSelected ? 'scale(0.95)' : 'scale(1)',
                opacity: isSelected ? 0.5 : 1,
                boxShadow: isSelected ? 'none' : `0 2px 8px ${colors.bg}`
            }}
        >
            {text}
        </div>
    );
};

// --- Styles ---
const pageStyle = {
    background: '#0f0f13',
    minHeight: '100vh',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Pretendard', sans-serif"
};

const headerStyle = {
    padding: '20px 40px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    background: 'rgba(20,20,30,0.8)',
    backdropFilter: 'blur(10px)'
};

const containerStyle = {
    flex: 1,
    display: 'flex',
    padding: '40px',
    gap: '40px',
    alignItems: 'stretch',
    justifyContent: 'center',
    maxWidth: '1600px',
    margin: '0 auto',
    width: '100%',
    height: 'calc(100vh - 100px)'
};

const canvasSectionStyle = {
    flex: 2,
    background: '#1a1a23',
    borderRadius: '24px',
    padding: '24px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 0 40px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '600px',
    minHeight: '600px',
    position: 'relative'
};

const controlPanelStyle = {
    flex: 1,
    background: 'rgba(30, 30, 40, 0.6)',
    borderRadius: '24px',
    padding: '30px',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    minWidth: '350px',
    overflowY: 'auto'
};

const sectionTitleStyle = {
    color: '#4ade80',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: 'monospace'
};

function PromptPuzzle() {
    const navigate = useNavigate();
    const { completeLesson, isCompleted } = useCompletion();
    const { gainExp, incrementCompletionCounts } = useUser();
    const { addActivity } = useActivity();

    const [currentLevel, setCurrentLevel] = useState(0);
    const [placedBlocks, setPlacedBlocks] = useState([null, null, null]);
    const [isSuccess, setIsSuccess] = useState(false);

    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [imageError, setImageError] = useState('');
    const [showLevelModal, setShowLevelModal] = useState(false);
    const [isModalActionPending, setIsModalActionPending] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [answerFeedback, setAnswerFeedback] = useState('');
    const [levels, setLevels] = useState([]);
    const [isLoadingLevels, setIsLoadingLevels] = useState(true);
    const hasLoadedLevelsRef = useRef(false);
    const lastGeneratedLevelRef = useRef(null);

    const fallbackLevels = [
        {
            id: 1,
            correctBlocks: ["귀여운 고양이", "자고 있는", "소파 위에서"],
            slots: ["주어 (Subject)", "행동 (Action)", "장소 (Location)"],
            availableBlocks: [
                { text: "귀여운 고양이", type: "subject" },
                { text: "화난 강아지", type: "subject" },
                { text: "자고 있는", type: "action" },
                { text: "달리고 있는", type: "action" },
                { text: "소파 위에서", type: "location" },
                { text: "우주에서", type: "location" }
            ]
        },
        {
            id: 2,
            correctBlocks: ["반짝이는 로봇", "춤을 추는", "비 내리는 거리에서"],
            slots: ["주어 (Subject)", "행동 (Action)", "장소 (Location)"],
            availableBlocks: [
                { text: "반짝이는 로봇", type: "subject" },
                { text: "낡은 자동차", type: "subject" },
                { text: "춤을 추는", type: "action" },
                { text: "싸우고 있는", type: "action" },
                { text: "비 내리는 거리에서", type: "location" },
                { text: "바닷속에서", type: "location" }
            ]
        }
    ];

    const fetchMoreLevels = async (count = 2) => {
        setIsFetchingMore(true);
        try {
            const response = await api.getPromptPuzzleLevels(count);
            const moreLevels = response.levels || [];
            setLevels(prev => [...prev, ...moreLevels]);
            return moreLevels.length > 0;
        } catch (error) {
            console.error("Failed to load more levels:", error);
            return false;
        } finally {
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        const loadLevels = async () => {
            try {
                const response = await api.getPromptPuzzleLevels(2);
                setLevels(response.levels || fallbackLevels);
                setCurrentLevel(0);
            } catch (error) {
                console.error("Failed to load prompt puzzle levels:", error);
                setLevels(fallbackLevels);
                setCurrentLevel(0);
            } finally {
                setIsLoadingLevels(false);
            }
        };

        if (hasLoadedLevelsRef.current) return;
        hasLoadedLevelsRef.current = true;
        loadLevels();
    }, []);

    useEffect(() => {
        if (showLevelModal) {
            setIsModalActionPending(false);
        }
    }, [showLevelModal]);

    useEffect(() => {
        if (!levels.length) return;
        if (lastGeneratedLevelRef.current === currentLevel) return;
        const generateLevelImage = async () => {
            setIsGenerating(true);
            setGeneratedImage(null);
            setImageError('');
            setPlacedBlocks([null, null, null]);

            const level = levels[currentLevel];

            try {
                const response = await api.generatePromptPuzzleImage(
                    level.prompt_kr || '',
                    level.correctBlocks[0],
                    level.correctBlocks[1],
                    level.correctBlocks[2]
                );
                if (response && response.image_url) {
                    setGeneratedImage(response.image_url);
                } else {
                    setImageError('이미지를 불러오지 못했어요.');
                }
            } catch (error) {
                console.error("Image generation failed:", error);
                setImageError('이미지 생성에 실패했어요.');
            } finally {
                lastGeneratedLevelRef.current = currentLevel;
                setIsGenerating(false);
            }
        };

        generateLevelImage();
    }, [currentLevel, levels]);


    const handleBlockClick = (block) => {
        const slotIndex = block.type === 'subject' ? 0 : block.type === 'action' ? 1 : 2;
        const newPlaced = [...placedBlocks];
        if (newPlaced[slotIndex] && newPlaced[slotIndex].text === block.text) {
            newPlaced[slotIndex] = null;
        } else {
            newPlaced[slotIndex] = block;
        }
        setPlacedBlocks(newPlaced);
    };

    const normalizeText = (value) => (value || '').trim();
    const checkAnswer = () => {
        const current = levels[currentLevel];
        const isCorrect = current.slots.every((slot, idx) => {
            return placedBlocks[idx] && normalizeText(placedBlocks[idx].text) === normalizeText(current.correctBlocks[idx]);
        });

        if (isCorrect) {
            setShowLevelModal(true);
        } else {
            setAnswerFeedback('wrong');
            setTimeout(() => setAnswerFeedback(''), 1200);
        }
    };

    const handleFinish = () => {
        const lessonId = 's2-puzzle';
        const wasAlreadyCompleted = isCompleted(lessonId);
        gainExp(150, wasAlreadyCompleted);
        incrementCompletionCounts();
        if (!wasAlreadyCompleted) {
            addActivity({
                icon: '🕵️‍♀️',
                title: '[프롬프트 탐정] 사건 해결!',
                time: '방금 전'
            });
            completeLesson(lessonId);
        }
        setIsSuccess(true);
    };

    const level = levels[currentLevel];

    if (isLoadingLevels || !level) {
        return (
            <div style={{ height: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div style={{ height: '100vh', background: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🕵️‍♀️</div>
                <h1 style={{ marginBottom: '20px', background: 'linear-gradient(to right, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>사건 해결 완료!</h1>
                <p style={{ color: '#aaa', marginBottom: '30px' }}>모든 프롬프트의 비밀을 밝혀냈습니다.</p>
                <button
                    onClick={() => navigate('/stage2')}
                    style={{
                        padding: '12px 30px', background: 'linear-gradient(135deg, #4ade80, #3b82f6)',
                        border: 'none', borderRadius: '12px', color: 'white', fontWeight: 'bold', cursor: 'pointer'
                    }}
                >
                    돌아가기
                </button>
            </div>
        );
    }

    return (
        <div className="prompt-puzzle-page" style={pageStyle}>
            {/* Modal */}
            {showLevelModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#1a1a23', padding: '40px', borderRadius: '30px', width: '90%', maxWidth: '400px', textAlign: 'center', border: '1px solid #4ade80', boxShadow: '0 0 50px rgba(74, 222, 128, 0.2)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🎉</div>
                        <h2 style={{ color: 'white', marginBottom: '10px', fontSize: '2rem' }}>정답입니다!</h2>
                        <p style={{ color: '#aaa', marginBottom: '30px', lineHeight: '1.5' }}>
                            퍼즐을 완성하여<br />멋진 이미지를 만들었습니다.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={async () => {
                                    if (isModalActionPending) return;
                                    setIsModalActionPending(true);
                                    setShowLevelModal(false);
                                    if (currentLevel >= levels.length - 1) {
                                        const added = await fetchMoreLevels(2);
                                        if (!added) return;
                                    }
                                    setCurrentLevel(prev => prev + 1);
                                }}
                                style={{ padding: '16px', background: '#4ade80', border: 'none', borderRadius: '12px', color: '#000', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1rem' }}
                            >
                                {isFetchingMore ? '불러오는 중...' : '다음 사건으로 이동'}
                            </button>
                            <button onClick={handleFinish} style={{ padding: '16px', background: '#333', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                                그만하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <header style={headerStyle}>
                <button
                    onClick={() => navigate('/stage2')}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '12px',
                        width: '40px', height: '40px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff',
                        cursor: 'pointer',
                        padding: 0,
                        lineHeight: 0
                    }}
                >
                    <span style={{ fontSize: '1.2rem' }}>←</span>
                </button>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #4ade80, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        프롬프트 탐정
                        <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', fontSize: '0.9rem', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>LEVEL {currentLevel + 1}</span>
                    </h1>
                </div>
            </header>

            <main style={containerStyle}>
                {/* Left: Image Display */}
                <div style={canvasSectionStyle}>
                    {isGenerating ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#666' }}>
                            <div className="loading-spinner" style={{ borderTopColor: '#3b82f6', marginBottom: '20px' }}></div>
                            <p>증거 이미지를 분석 중입니다...</p>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Puzzle Target" style={{ maxHeight: '90%', maxWidth: '90%', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }} />
                    ) : (
                        <div style={{ textAlign: 'center', color: '#ef4444' }}>
                            <p>{imageError || '이미지 로드 실패'}</p>
                        </div>
                    )}
                </div>

                {/* Right: Controls */}
                <div style={controlPanelStyle}>

                    {/* Mission Box */}
                    <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        <h3 style={{ ...sectionTitleStyle, margin: 0, marginBottom: '10px', color: '#3b82f6' }}>🎯 MISSION</h3>
                        <p style={{ color: '#ccc', lineHeight: '1.5', fontSize: '0.95rem' }}>
                            범인이 남긴 <strong>이미지</strong>를 보고<br />그가 어떤 주문(Prompt)을 썼는지 추리하세요!
                        </p>
                    </div>

                    {/* Slots Area */}
                    <div>
                        <h3 style={sectionTitleStyle}>🧩 PUZZLE SLOTS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {level.slots.map((slot, idx) => (
                                <div key={idx} style={{
                                    height: '64px',
                                    border: '2px dashed #444',
                                    borderRadius: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: placedBlocks[idx] ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                                    color: placedBlocks[idx] ? 'white' : '#666',
                                    position: 'relative',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s',
                                    borderColor: placedBlocks[idx] ? '#666' : '#444'
                                }}>
                                    {placedBlocks[idx] ? (
                                        <PuzzleBlock
                                            text={placedBlocks[idx].text}
                                            type={placedBlocks[idx].type}
                                            onClick={() => handleBlockClick(placedBlocks[idx])}
                                            isSelected={false}
                                        />
                                    ) : (
                                        <span>{slot}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Block Pool */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <h3 style={sectionTitleStyle}>📦 BLOCKS</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {level.availableBlocks.map((block, idx) => (
                                <PuzzleBlock
                                    key={idx}
                                    text={block.text}
                                    type={block.type}
                                    onClick={() => handleBlockClick(block)}
                                    isSelected={placedBlocks.some(pb => pb && pb.text === block.text)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={checkAnswer}
                        disabled={placedBlocks.includes(null) || isGenerating}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: answerFeedback === 'wrong' ? '#ef4444' : (placedBlocks.includes(null) || isGenerating) ? '#333' : 'linear-gradient(135deg, #4ade80, #3b82f6)',
                            color: (placedBlocks.includes(null) || isGenerating) && answerFeedback !== 'wrong' ? '#666' : 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            cursor: (placedBlocks.includes(null) || isGenerating) ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: answerFeedback === 'wrong' ? '0 0 20px rgba(239, 68, 68, 0.4)' : (placedBlocks.includes(null) || isGenerating) ? 'none' : '0 4px 15px rgba(59, 130, 246, 0.3)'
                        }}
                    >
                        {answerFeedback === 'wrong' ? '❌ 다시 확인해보세요!' : '🔍 범인 지목 (정답 확인)'}
                    </button>

                </div>
            </main>
        </div>
    );
}

export default PromptPuzzle;
