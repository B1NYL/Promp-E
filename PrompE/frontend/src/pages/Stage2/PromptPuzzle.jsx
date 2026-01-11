import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompletion } from '../../services/CompletionContext';
import { useUser } from '../../services/UserContext';
import { useActivity } from '../../services/ActivityContext';
import { api } from '../../services/api';
import '../../css/Stage.css';

const PuzzleBlock = ({ text, type, onClick, isSelected }) => (
    <div
        onClick={onClick}
        style={{
            padding: '12px 20px',
            margin: '6px',
            borderRadius: '12px',
            background: isSelected ? '#ddd' : (type === 'subject' ? '#FF6B6B' : type === 'action' ? '#4ECDC4' : '#FFE66D'),
            color: type === 'location' ? '#333' : 'white',
            border: isSelected ? '3px dashed #999' : '3px solid transparent',
            cursor: 'pointer',
            display: 'inline-block',
            fontWeight: 'bold',
            boxShadow: isSelected ? 'none' : '0 4px 0 rgba(0,0,0,0.15)',
            transform: isSelected ? 'scale(0.95)' : 'scale(1)',
            opacity: isSelected ? 0.6 : 1,
            fontSize: '1.1rem',
            transition: 'all 0.1s'
        }}
    >
        {text}
    </div>
);

function PromptPuzzle() {
    const navigate = useNavigate();
    const { completeLesson, isCompleted } = useCompletion();
    const { gainExp } = useUser();
    const { addActivity } = useActivity();

    const [currentLevel, setCurrentLevel] = useState(0);
    const [placedBlocks, setPlacedBlocks] = useState([null, null, null]);
    const [isSuccess, setIsSuccess] = useState(false);

    const [generatedImage, setGeneratedImage] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Level Data
    const levels = [
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

    // Generate Image when level changes
    useEffect(() => {
        const generateLevelImage = async () => {
            setIsGenerating(true);
            setGeneratedImage(null);
            setPlacedBlocks([null, null, null]);

            const level = levels[currentLevel];
            const prompt = `${level.correctBlocks[0]}, ${level.correctBlocks[1]}, ${level.correctBlocks[2]}`;

            try {
                // 실제로는 더미 응답이 올 수 있음 (API 구현에 따라 다름)
                // 여기서는 API 호출 시늉을 하거나 실제 호출
                const response = await api.generateImage(prompt);
                if (response && response.image_url) {
                    setGeneratedImage(response.image_url);
                } else {
                    // Fallback for demo if API fails locally
                    // Use specific placeholders for each level
                    if (currentLevel === 0) setGeneratedImage('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300&auto=format&fit=crop'); // Cat
                    else if (currentLevel === 1) setGeneratedImage('https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?q=80&w=300&auto=format&fit=crop'); // Robot (abstract)
                }
            } catch (error) {
                console.error("Image generation failed:", error);
                // Fallback images
                if (currentLevel === 0) setGeneratedImage('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=300&auto=format&fit=crop');
                else if (currentLevel === 1) setGeneratedImage('https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?q=80&w=300&auto=format&fit=crop');
            } finally {
                setIsGenerating(false);
            }
        };

        generateLevelImage();
    }, [currentLevel]);


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

    const checkAnswer = () => {
        const current = levels[currentLevel];
        const isCorrect = current.slots.every((slot, idx) => {
            return placedBlocks[idx] && placedBlocks[idx].text === current.correctBlocks[idx];
        });

        if (isCorrect) {
            if (currentLevel < levels.length - 1) {
                alert("정답입니다! 다음 레벨로 넘어갑니다.");
                setCurrentLevel(prev => prev + 1);
            } else {
                handleFinish();
            }
        } else {
            alert("틀렸습니다. 블록을 다시 확인해보세요!");
        }
    };

    const handleFinish = () => {
        const lessonId = 's2-prompt-puzzle';
        const wasAlreadyCompleted = isCompleted(lessonId);

        gainExp(150, wasAlreadyCompleted);

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

    if (isSuccess) {
        return (
            <div className="stage-page" style={{ textAlign: 'center', padding: '50px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
                <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🕵️‍♀️</div>
                <h1 className="stage-page-title" style={{ justifyContent: 'center' }}>사건 해결 완료!</h1>
                <p style={{ fontSize: '1.2rem', margin: '20px 0' }}>모든 프롬프트의 비밀을 밝혀냈습니다.</p>
                <button className="btn-3d btn-primary" onClick={() => navigate('/stage2')}>돌아가기</button>
            </div>
        );
    }

    return (
        <div className="stage-page prompt-puzzle-page">
            <header className="stage-header">
                <h1 className="stage-page-title">
                    <span className="stage-badge">스테이지 2</span>
                    🕵️‍♀️ 프롬프트 탐정 (Level {currentLevel + 1})
                </h1>
                <button className="back-button" onClick={() => navigate('/stage2')}>← 나가기</button>
            </header>

            <div className="puzzle-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '30px' }}>

                {/* Target Image Area */}
                <div className="target-image-area" style={{
                    width: '320px', height: '320px',
                    background: '#222',
                    borderRadius: '20px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    border: '4px solid var(--primary)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    overflow: 'hidden',
                    position: 'relative'
                }}>
                    {isGenerating ? (
                        <div style={{ textAlign: 'center', color: 'white' }}>
                            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                            <p>AI가 그림을 생성중...</p>
                        </div>
                    ) : (
                        <img src={generatedImage} alt="Puzzle Target" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    )}
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 'bold' }}>
                    위 그림을 만들기 위한 주문(Prompt)을 완성하세요!
                </p>

                {/* Drop Slots */}
                <div className="slots-area" style={{
                    display: 'flex', gap: '15px',
                    background: 'var(--card-bg)',
                    padding: '25px',
                    borderRadius: '20px',
                    border: '2px solid var(--border)',
                    flexWrap: 'wrap',
                    justifyContent: 'center'
                }}>
                    {level.slots.map((slot, idx) => (
                        <div key={idx} style={{
                            width: '140px', height: '70px',
                            border: '2px dashed #bbb',
                            borderRadius: '12px',
                            display: 'flex', justifyContent: 'center', alignItems: 'center',
                            background: placedBlocks[idx] ? (placedBlocks[idx].type === 'subject' ? '#FF6B6B' : placedBlocks[idx].type === 'action' ? '#4ECDC4' : '#FFE66D') : '#f9f9f9',
                            transition: 'all 0.2s'
                        }}>
                            {placedBlocks[idx] ? (
                                <span style={{ color: placedBlocks[idx].type === 'location' ? '#333' : 'white', fontWeight: 'bold' }}>{placedBlocks[idx].text}</span>
                            ) : (
                                <span style={{ color: '#888', fontSize: '0.9rem', textAlign: 'center' }}>{slot}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Block Pool */}
                <div className="block-pool" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '700px' }}>
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

                <button
                    className="btn-3d btn-primary"
                    onClick={checkAnswer}
                    disabled={placedBlocks.includes(null) || isGenerating}
                    style={{
                        padding: '15px 50px',
                        fontSize: '1.3rem',
                        marginTop: '20px',
                        opacity: (placedBlocks.includes(null) || isGenerating) ? 0.5 : 1,
                        width: '100%',
                        maxWidth: '400px'
                    }}
                >
                    🔍 정답 확인
                </button>

            </div>
        </div>
    );
}

export default PromptPuzzle;
