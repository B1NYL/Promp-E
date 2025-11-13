import React, { useState } from 'react';
import { Hand } from 'lucide-react';
import '../css/BlockCoding.css';

const blockData = {
  adjectives: ["행복한", "용감한", "빛나는", "작은", "화려한", "푹신한", "고대의", "신비로운", "거대한", "빨간색", "파란색", "금색"],
  verbs: ["날아가는", "불을 뿜는", "춤추는", "노래하는", "싸우는", "웃고 있는", "달리는", "점프하는"],
  locations: ["하늘에서", "바다 속에서", "숲 속에서", "성 안에서", "우주에서", "산 위에서"],
};

function BlockCard({ text, color, onClick }) {
  return (
    <button className={`block-card ${color}`} onClick={onClick}>
      {text}
    </button>
  );
}

function BlockLibrary({ onBlockSelect }) {
  const [activeTab, setActiveTab] = useState('adjectives');

  return (
    <div className="block-library">
      <div className="library-header">
        <h2>블록 라이브러리</h2>
        <Hand className="header-icon" />
      </div>

      <div className="tabs">
        <button className={activeTab === 'adjectives' ? 'active' : ''} onClick={() => setActiveTab('adjectives')}>꾸미는 말</button>
        <button className={activeTab === 'verbs' ? 'active' : ''} onClick={() => setActiveTab('verbs')}>동사</button>
        <button className={activeTab === 'locations' ? 'active' : ''} onClick={() => setActiveTab('locations')}>장소</button>
      </div>

      <div className="tabs-content">
        {activeTab === 'adjectives' && (
          <div className="block-grid">
            {blockData.adjectives.map((word) => (
              <BlockCard key={word} text={word} color="green" onClick={() => onBlockSelect('adjectives', word)} />
            ))}
          </div>
        )}
        {activeTab === 'verbs' && (
          <div className="block-grid">
            {blockData.verbs.map((word) => (
              <BlockCard key={word} text={word} color="orange" onClick={() => onBlockSelect('action', word)} />
            ))}
          </div>
        )}
        {activeTab === 'locations' && (
          <div className="block-grid">
            {blockData.locations.map((word) => (
              <BlockCard key={word} text={word} color="blue" onClick={() => onBlockSelect('location', word)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockLibrary;