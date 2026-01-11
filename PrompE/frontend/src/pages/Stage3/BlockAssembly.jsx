import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Sparkles, Wand2, Loader2, Cpu, Zap, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import '../../css/BlockCoding.css';
import '../../css/Cognition.css'; // For the header styles if reusing

function BlockCard({ text, color, onClick }) {
  // Map color names to classes if needed, or rely on CSS
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
      <button onClick={onRemove} className="chip-remove-btn" title="Remove Block">
        <X size={14} />
      </button>
    </div>
  );
}

function EmptySlot({ label }) {
  return <div className="empty-slot">{label}</div>;
}

function BlockLibrary({ blockData, onBlockSelect }) {
  const [activeTab, setActiveTab] = useState('adjectives');

  const adjectives = blockData?.adjectives || [];
  const verbs = blockData?.verbs || [];
  const locations = blockData?.locations || [];

  return (
    <div className="block-library">
      <div className="library-header">
        <h2><Cpu size={20} style={{ marginRight: '8px', color: '#6c5ce7' }} /> 부품 라이브러리</h2>
      </div>
      <div className="tabs">
        <button className={activeTab === 'adjectives' ? 'active' : ''} onClick={() => setActiveTab('adjectives')}>수식어</button>
        <button className={activeTab === 'verbs' ? 'active' : ''} onClick={() => setActiveTab('verbs')}>행동</button>
        <button className={activeTab === 'locations' ? 'active' : ''} onClick={() => setActiveTab('locations')}>장소</button>
      </div>
      <div className="tabs-content" style={{ marginTop: '16px' }}>
        {activeTab === 'adjectives' && (
          <div className="block-grid">
            {adjectives.length > 0 ? adjectives.map((word) => (
              <BlockCard key={word} text={word} color="green" onClick={() => onBlockSelect('adjectives', word)} />
            )) : <p className="no-blocks-text" style={{ color: '#666' }}>사용 가능한 부품이 없습니다.</p>}
          </div>
        )}
        {activeTab === 'verbs' && (
          <div className="block-grid">
            {verbs.length > 0 ? verbs.map((word) => (
              <BlockCard key={word} text={word} color="orange" onClick={() => onBlockSelect('action', word)} />
            )) : <p className="no-blocks-text" style={{ color: '#666' }}>사용 가능한 부품이 없습니다.</p>}
          </div>
        )}
        {activeTab === 'locations' && (
          <div className="block-grid">
            {locations.length > 0 ? locations.map((word) => (
              <BlockCard key={word} text={word} color="blue" onClick={() => onBlockSelect('location', word)} />
            )) : <p className="no-blocks-text" style={{ color: '#666' }}>사용 가능한 부품이 없습니다.</p>}
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

  // Default data if missing (e.g. direct nav)
  const blockData = suggestedKeywords || {
    adjectives: ['Glowing', 'Cyberpunk', 'Futuristic'],
    verbs: ['Flying', 'Coding', 'Thinking'],
    locations: ['Space Station', 'Cyber City', 'Laboratory']
  };
  const displaySubject = subject || "Subject";

  const [blocks, setBlocks] = useState({
    adjectives: [], subject: displaySubject, action: null, location: null,
  });

  const [customBlock, setCustomBlock] = useState('');
  const [customBlockType, setCustomBlockType] = useState('adjectives');
  const [isNavigating, setIsNavigating] = useState(false);

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
  const canGenerate = blocks.action || blocks.location || blocks.adjectives.length > 0;

  const handleNext = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    // Navigate to next
    navigate('/stage3/block-result', {
      state: { assembledPrompt, drawingData },
    });
  };

  return (
    <div className="block-coding-page">
      {/* Sidebar / Guide Panel - reused component but styled via CSS */}
      {/* Ideally we'd replace AiGuidePanel with something more techy or just keep it minimized */}
      {/* Let's skip the sidebar for now to focus on the content, or just include it if it's there */}

      <main className="main-content-block assembly-main" style={{ width: '100%', height: '100%' }}>
        {/* Header inside the main content for now */}
        <header className="gn-header" style={{ marginBottom: '20px', borderRadius: '12px', width: '100%' }}>
          <div className="gn-left">
            <button className="gn-back-btn" onClick={() => navigate('/stage3/drawing')}>
              <ChevronLeft size={24} />
            </button>
            <h1 className="gn-title">미션 2: 로직 조립</h1>
          </div>
          <div className="gn-right">
            {/* Maybe step indicator? */}
          </div>
        </header>

        {/* The Circuit Board Socket */}
        <div className="assembly-tray">
          <div className="tray-header">
            <h2><Zap size={22} style={{ marginRight: '8px', color: '#ffff00' }} /> 메인 프롬프트 소켓</h2>
            {/* Live Preview of Prompt string if needed */}
          </div>

          <div className="assembly-slots">
            {/* Location Slot */}
            {blocks.location ?
              <BlockChip text={blocks.location} color="blue" onRemove={() => handleBlockRemove("location")} />
              : <EmptySlot label="[장소 모듈]" />
            }

            {/* Adjective Slots */}
            {blocks.adjectives.map((adj, index) =>
              <BlockChip key={index} text={adj} color="green" onRemove={() => handleBlockRemove("adjectives", adj)} />
            )}
            {blocks.adjectives.length < 3 && <EmptySlot label="[수식어 슬롯]" />}

            {/* Subject (Fixed/Core) */}
            <BlockChip text={blocks.subject} color="purple" onRemove={() => { }} />

            {/* Action Slot */}
            {blocks.action ?
              <BlockChip text={blocks.action} color="orange" onRemove={() => handleBlockRemove("action")} />
              : <EmptySlot label="[행동 모듈]" />
            }
          </div>

          <div style={{ marginTop: '16px', color: '#a0a0b0', fontFamily: 'monospace', fontSize: '0.9rem' }}>
            &gt; 출력 스트림: <span style={{ color: '#fff' }}>{assembledPrompt || "입력 대기 중..."}</span>
          </div>
        </div>

        <div className="lower-controls" style={{ display: 'flex', gap: '20px' }}>
          <BlockLibrary blockData={blockData} onBlockSelect={handleBlockSelect} />

          <div className="panel-section-block custom-add-panel" style={{ width: '300px' }}>
            <h3 className="section-title-block" style={{ color: '#fff' }}>
              <Sparkles size={18} /> 수동 오버라이드
            </h3>
            <div className="custom-block-area" style={{ flexDirection: 'column' }}>
              <select value={customBlockType} onChange={(e) => setCustomBlockType(e.target.value)}>
                <option value="adjectives">수식어</option>
                <option value="action">행동</option>
                <option value="location">장소</option>
              </select>
              <input
                type="text"
                placeholder="사용자 지정 파라미터 입력..."
                value={customBlock}
                onChange={(e) => setCustomBlock(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomBlock()}
              />
              <button onClick={handleAddCustomBlock} style={{ width: '100%' }}>블록 초기화</button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleNext}
            disabled={!canGenerate || isNavigating}
            className="gn-finish-btn" // Reuse logic button
            style={{ padding: '12px 32px', fontSize: '1.1rem' }}
          >
            {isNavigating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                처리 중...
              </>
            ) : (
              <>
                <Wand2 size={20} style={{ marginRight: '8px' }} />
                생성 실행
              </>
            )}
          </button>
        </div>

      </main>
    </div>
  );
}

export default BlockAssembly;