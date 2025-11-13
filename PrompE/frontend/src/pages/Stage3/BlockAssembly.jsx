import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Sparkles, Blocks, Wand2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import '../../css/BlockCoding.css';
import AiGuidePanel from '../../components/AiGuidePanel';

function BlockCard({ text, color, onClick }) {
  return (
    <button className={`block-card ${color}`} onClick={onClick}>
      {text}
    </button>
  );
}

function BlockChip({ text, color, onRemove }) {
  return (
    <div className={`block-chip ${color}`}>
      <span>{text}</span>
      <button onClick={onRemove} className="chip-remove-btn"><X size={14} /></button>
    </div>
  );
}

function EmptySlot({ label }) {
  return <div className="empty-slot">{label}</div>;
}

// ★★★ BlockLibrary 컴포넌트 수정 ★★★
function BlockLibrary({ blockData, onBlockSelect }) {
  const [activeTab, setActiveTab] = useState('adjectives');

  // 데이터가 없을 경우를 대비한 기본값 설정
  const adjectives = blockData?.adjectives || [];
  const verbs = blockData?.verbs || [];
  const locations = blockData?.locations || [];

  return (
    <div className="block-library">
      <div className="library-header">
        <h2>AI 추천 블록</h2>
      </div>
      <div className="tabs">
        <button className={activeTab === 'adjectives' ? 'active' : ''} onClick={() => setActiveTab('adjectives')}>꾸미는 말</button>
        <button className={activeTab === 'verbs' ? 'active' : ''} onClick={() => setActiveTab('verbs')}>동사</button>
        <button className={activeTab === 'locations' ? 'active' : ''} onClick={() => setActiveTab('locations')}>장소</button>
      </div>
      <div className="tabs-content">
        {activeTab === 'adjectives' && (
          <div className="block-grid">
            {adjectives.length > 0 ? adjectives.map((word) => (
              <BlockCard key={word} text={word} color="green" onClick={() => onBlockSelect('adjectives', word)} />
            )) : <p className="no-blocks-text">추천 블록이 없어요.</p>}
          </div>
        )}
        {activeTab === 'verbs' && (
          <div className="block-grid">
            {verbs.length > 0 ? verbs.map((word) => (
              <BlockCard key={word} text={word} color="orange" onClick={() => onBlockSelect('action', word)} />
            )) : <p className="no-blocks-text">추천 블록이 없어요.</p>}
          </div>
        )}
        {activeTab === 'locations' && (
          <div className="block-grid">
            {locations.length > 0 ? locations.map((word) => (
              <BlockCard key={word} text={word} color="blue" onClick={() => onBlockSelect('location', word)} />
            )) : <p className="no-blocks-text">추천 블록이 없어요.</p>}
          </div>
        )}
      </div>
    </div>
  );
}


function BlockAssembly() {
  const navigate = useNavigate();
  const location = useLocation();
  const { subject, drawingData, suggestedKeywords } = location.state || {};
  
  // GPT가 추천해준 키워드 또는 기본값 사용
  const blockData = suggestedKeywords || { adjectives: [], verbs: [], locations: [] };

  const [blocks, setBlocks] = useState({
    adjectives: [], subject: subject || null, action: null, location: null,
  });

  const [customBlock, setCustomBlock] = useState('');
  const [customBlockType, setCustomBlockType] = useState('adjectives');
  
  const [freeText, setFreeText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleKeywordExtract = async () => {
    if (!freeText.trim()) return;
    setIsExtracting(true);
    try {
      const result = await api.extractKeywords(freeText);
      const newAdjectives = [...new Set([...blocks.adjectives, ...result.adjectives])].slice(0, 5);
      
      setBlocks(prev => ({
        ...prev,
        adjectives: newAdjectives,
        action: prev.action || result.verbs?.[0] || null,
        location: prev.location || result.locations?.[0] || null,
      }));
    } catch (error) {
      alert('키워드 추출에 실패했습니다.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddCustomBlock = () => {
    if (!customBlock.trim()) return;
    if (customBlockType === 'adjectives') {
      if (blocks.adjectives.length < 5 && !blocks.adjectives.includes(customBlock)) {
        setBlocks(prev => ({ ...prev, adjectives: [...prev.adjectives, customBlock] }));
      }
    } else {
      setBlocks(prev => ({ ...prev, [customBlockType]: customBlock }));
    }
    setCustomBlock('');
  };
  
  const handleBlockSelect = (type, value) => {
    if (type === 'adjectives') {
      if (blocks.adjectives.length < 5 && !blocks.adjectives.includes(value)) {
        setBlocks(prev => ({ ...prev, adjectives: [...prev.adjectives, value] }));
      }
    } else {
      setBlocks(prev => ({ ...prev, [type]: value }));
    }
  };

  const handleBlockRemove = (type, valueToRemove) => {
    if (type === 'adjectives') {
      setBlocks(prev => ({ ...prev, adjectives: prev.adjectives.filter(adj => adj !== valueToRemove) }));
    } else {
      setBlocks(prev => ({ ...prev, [type]: null }));
    }
  };

  const assembledPrompt = [blocks.location, ...blocks.adjectives, blocks.subject, blocks.action].filter(Boolean).join(' ');
  const canGenerate = blocks.subject && (blocks.action || blocks.location || blocks.adjectives.length > 0);

  const handleNext = () => {
    if (isNavigating) return;
    setIsNavigating(true);

    navigate('/stage3/block-result', {
      state: { assembledPrompt, drawingData },
    });
  };

  return (
    <div className="block-coding-page">
      <AiGuidePanel currentStep="assembly" />
      <main className="main-content-block assembly-main">
        <header className="block-header">
          <h1><Blocks className="header-icon" /> 미션 2: 문장 조립하기</h1>
          <p>AI가 추천해준 블록 또는 직접 만든 블록으로 프롬프트를 완성해보세요.</p>
        </header>

      

        <div className="assembly-tray">
          <div className="tray-header">
            <h2><Sparkles size={22} /> 문장 조립 트레이</h2>
          </div>
          {assembledPrompt && (
            <div className="assembled-prompt-display">
              <p>완성된 프롬프트:</p>
              <h3>{assembledPrompt}</h3>
            </div>
          )}
          <div className="assembly-slots">
            {blocks.location ? <BlockChip text={blocks.location} color="blue" onRemove={() => handleBlockRemove("location")} /> : <EmptySlot label="장소" />}
            {blocks.adjectives.map((adj, index) => <BlockChip key={index} text={adj} color="green" onRemove={() => handleBlockRemove("adjectives", adj)} />)}
            {blocks.adjectives.length < 3 && <EmptySlot label="꾸미는 말" />}
            {blocks.subject ? <BlockChip text={blocks.subject} color="purple" onRemove={() => {}} /> : <EmptySlot label="주인공" />}
            {blocks.action ? <BlockChip text={blocks.action} color="orange" onRemove={() => handleBlockRemove("action")} /> : <EmptySlot label="하는 일" />}
          </div>
        </div>
        
        <div className="lower-controls">
          {/* ★★★ BlockLibrary 호출 시 blockData를 props로 전달 ★★★ */}
          <BlockLibrary blockData={blockData} onBlockSelect={handleBlockSelect} />
          
          <div className="panel-section-block custom-add-panel">
            <h3 className="section-title-block">✏️ 직접 블록 추가하기</h3>
            <div className="custom-block-area">
              <select value={customBlockType} onChange={(e) => setCustomBlockType(e.target.value)}>
                <option value="adjectives">꾸미는 말</option>
                <option value="action">동사</option>
                <option value="location">장소</option>
              </select>
              <input
                type="text"
                placeholder="추가할 단어 입력"
                value={customBlock}
                onChange={(e) => setCustomBlock(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomBlock()}
              />
              <button onClick={handleAddCustomBlock}>추가</button>
            </div>
          </div>
        </div>
        
        <button onClick={handleNext} disabled={!canGenerate || isNavigating} className="next-step-btn generate">
          {isNavigating ? (
            <>
              <Loader2 className="animate-spin mr-2" size={20} />
              이동 중...
            </>
          ) : (
            "이미지 생성하기"
          )}
        </button>
      </main>
    </div>
  );
}

export default BlockAssembly;