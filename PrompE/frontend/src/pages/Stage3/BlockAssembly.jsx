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
    <div className="block-library-inner" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>

      {/* Tabs */}
      <div className="tabs-modern" style={{ display: 'flex', gap: '5px', padding: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
        <button
          className={activeTab === 'adjectives' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('adjectives')}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: activeTab === 'adjectives' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'adjectives' ? '#fff' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
        >
          꾸미기
        </button>
        <button
          className={activeTab === 'verbs' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('verbs')}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: activeTab === 'verbs' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'verbs' ? '#fff' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
        >
          행동
        </button>
        <button
          className={activeTab === 'locations' ? 'tab-btn active' : 'tab-btn'}
          onClick={() => setActiveTab('locations')}
          style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', background: activeTab === 'locations' ? 'rgba(255,255,255,0.1)' : 'transparent', color: activeTab === 'locations' ? '#fff' : '#666', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
        >
          장소
        </button>
      </div>

      {/* Content Grid */}
      <div className="library-content" style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
        {activeTab === 'adjectives' && (
          <div className="block-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {adjectives.length > 0 ? adjectives.map((word) => (
              <BlockCard key={word} text={word} color="green" onClick={() => onBlockSelect('adjectives', word)} />
            )) : <p style={{ color: '#666', fontSize: '0.8rem', gridColumn: 'span 2', textAlign: 'center' }}>사용 가능한 블록이 없습니다.</p>}
          </div>
        )}
        {activeTab === 'verbs' && (
          <div className="block-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {verbs.length > 0 ? verbs.map((word) => (
              <BlockCard key={word} text={word} color="orange" onClick={() => onBlockSelect('action', word)} />
            )) : <p style={{ color: '#666', fontSize: '0.8rem', gridColumn: 'span 2', textAlign: 'center' }}>사용 가능한 블록이 없습니다.</p>}
          </div>
        )}
        {activeTab === 'locations' && (
          <div className="block-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {locations.length > 0 ? locations.map((word) => (
              <BlockCard key={word} text={word} color="blue" onClick={() => onBlockSelect('location', word)} />
            )) : <p style={{ color: '#666', fontSize: '0.8rem', gridColumn: 'span 2', textAlign: 'center' }}>사용 가능한 블록이 없습니다.</p>}
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

  // --- Modern UI Updates ---

  return (
    <div className="block-coding-page" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#0f0f13' }}>

      {/* 1. Header Area */}
      <header className="block-header-modern" style={{
        padding: '20px 40px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(20,20,30,0.8)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button onClick={() => navigate('/stage3/block-drawing')} className="icon-btn-modern">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(90deg, #fff, #a0a0b0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              블록 조립소
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>나만의 문장 만들기</p>
          </div>
        </div>

        <div className="status-indicator">
          <span style={{ color: canGenerate ? '#4ade80' : '#666', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: canGenerate ? '#4ade80' : '#333', boxShadow: canGenerate ? '0 0 10px #4ade80' : 'none' }} />
            {canGenerate ? "준비 완료!" : "블록을 채워주세요"}
          </span>
        </div>
      </header>


      <main className="assembly-workspace" style={{ display: 'grid', gridTemplateColumns: '1fr 350px', height: 'calc(100vh - 85px)' }}>

        {/* 2. Main Assembly Area (Center) */}
        <div className="workspace-center" style={{ padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>

          <div className="circuit-board-container" style={{
            background: 'rgba(30,30,40,0.5)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '40px',
            position: 'relative',
            minHeight: '400px',
            boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)'
          }}>
            {/* Circuit Lines Background (CSS handled) */}
            {/* Removed confusing label */}

            <div className="slot-row" style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '40px' }}>

              {/* Location */}
              <div className="slot-group">
                <label style={{ display: 'block', marginBottom: '10px', color: '#3b82f6', fontSize: '0.9rem', fontWeight: '700', textTransform: 'uppercase' }}>어디에서? (장소)</label>
                {blocks.location ? (
                  <div style={{ position: 'relative' }}>
                    <BlockChip text={blocks.location} color="blue" onRemove={() => handleBlockRemove("location")} />
                  </div>
                ) : (
                  <div className="empty-slot-modern blue">장소 블록</div>
                )}
              </div>

              {/* Connector */}
              <div className="connector-line" style={{ width: '30px', height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '22px' }} />

              {/* Subject (Core) */}
              <div className="slot-group">
                <label style={{ display: 'block', marginBottom: '10px', color: '#a855f7', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>누가? (주인공)</label>
                <div className="core-chip" style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: '700',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'inline-block'
                }}>
                  {blocks.subject}
                </div>
              </div>

              {/* Connector */}
              <div className="connector-line" style={{ width: '30px', height: '2px', background: 'rgba(255,255,255,0.1)', marginBottom: '22px' }} />

              {/* Action */}
              <div className="slot-group">
                <label style={{ display: 'block', marginBottom: '10px', color: '#f97316', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>무엇을 하나요? (행동)</label>
                {blocks.action ? (
                  <BlockChip text={blocks.action} color="orange" onRemove={() => handleBlockRemove("action")} />
                ) : (
                  <div className="empty-slot-modern orange">행동 블록</div>
                )}
              </div>

            </div>

            {/* Adjectives Row */}
            <div className="slot-row" style={{ marginTop: '40px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#22c55e', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase' }}>어떤 느낌인가요? (꾸미기)</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', minHeight: '60px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px dashed rgba(34, 197, 94, 0.3)', alignItems: 'center' }}>
                {blocks.adjectives.map((adj, index) => (
                  <BlockChip key={index} text={adj} color="green" onRemove={() => handleBlockRemove("adjectives", adj)} />
                ))}
                {blocks.adjectives.length === 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.9rem', fontStyle: 'italic' }}>꾸미기 블록을 여기에 놓아보세요!</span>}
              </div>
            </div>

          </div>

          {/* Live Preview Console */}
          <div className="console-output" style={{ background: '#000', borderRadius: '12px', padding: '20px', border: '1px solid #333', fontFamily: 'monospace' }}>
            <div style={{ color: '#666', fontSize: '0.8rem', marginBottom: '5px' }}>// 완성된 문장</div>
            <div style={{ color: canGenerate ? '#fff' : '#444', fontSize: '1.1rem', lineHeight: '1.5' }}>
              &gt; {assembledPrompt || "..."} <span className="cursor-blink">_</span>
            </div>
          </div>


          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleNext}
              disabled={!canGenerate || isNavigating}
              className={`btn-modern-large ${canGenerate ? 'ready' : ''}`}
            >
              {isNavigating ? <Loader2 className="animate-spin" /> : <Wand2 />}
              <span>그림 그리기 시작!</span>
            </button>
          </div>

        </div>


        {/* 3. Right Sidebar (Tools) */}
        <div className="workspace-right" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', background: 'rgba(20,20,25,0.95)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Custom Input */}
          <div className="tool-panel">
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={16} color="#eab308" /> 직접 단어 쓰기
            </h3>
            <div className="custom-input-group" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <select value={customBlockType} onChange={(e) => setCustomBlockType(e.target.value)} style={{ background: '#333', border: 'none', borderRadius: '8px', color: '#fff', padding: '0 10px' }}>
                <option value="adjectives">꾸미기</option>
                <option value="action">행동</option>
                <option value="location">장소</option>
              </select>
              <input
                type="text"
                placeholder="직접 입력..."
                value={customBlock}
                onChange={(e) => setCustomBlock(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCustomBlock()}
                style={{ flex: 1, background: '#333', border: 'none', borderRadius: '8px', color: '#fff', padding: '10px' }}
              />
            </div>
            <button onClick={handleAddCustomBlock} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
              추가하기
            </button>
          </div>

          <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

          {/* Library */}
          <div className="tool-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '15px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={16} color="#3b82f6" /> 블록 창고
            </h3>
            <BlockLibrary blockData={blockData} onBlockSelect={handleBlockSelect} />
          </div>

        </div>

      </main>

      <style>{`
        .empty-slot-modern {
          padding: 12px 20px;
          border-radius: 12px;
          background: rgba(255,255,255,0.03);
          border: 1px dashed rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.3);
          font-size: 0.85rem;
          min-width: 120px;
          text-align: center;
        }
        .empty-slot-modern.blue { border-color: rgba(59, 130, 246, 0.3); color: rgba(59, 130, 246, 0.5); }
        .empty-slot-modern.orange { border-color: rgba(249, 115, 22, 0.3); color: rgba(249, 115, 22, 0.5); }
        
        .icon-btn-modern {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.2);
          width: 40px; height: 40px;
          display: flex; alignItems: center; justifyContent: center;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: all 0.2s;
          padding: 0;
          line-height: 0;
        }
        .icon-btn-modern:hover { background: rgba(255,255,255,0.1); border-color: #fff; }

        .btn-modern-large {
          background: #333;
          color: #888;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-weight: 800;
          display: flex; align-items: center; gap: 12px;
          font-size: 1rem;
          cursor: not-allowed;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 1px;
        }
        .btn-modern-large.ready {
          background: var(--primary);
          color: #fff;
          cursor: pointer;
          box-shadow: 0 0 30px rgba(34, 197, 94, 0.3);
        }
        .btn-modern-large.ready:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 50px rgba(34, 197, 94, 0.5);
        }

        .cursor-blink { animation: blink 1s step-end infinite; }
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}

export default BlockAssembly;