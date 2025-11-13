import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { missions as missionData } from '../data/mission';

const MissionContext = createContext();

export const useMissions = () => useContext(MissionContext);

export const MissionProvider = ({ children }) => {
  const [completedMissions, setCompletedMissions] = useState(() => {
    const saved = localStorage.getItem('completedMissions');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  useEffect(() => {
    localStorage.setItem('completedMissions', JSON.stringify(Array.from(completedMissions)));
  }, [completedMissions]);

  const completeMission = useCallback((missionId) => {
    setCompletedMissions(prev => {
      if (prev.has(missionId)) return prev; // 이미 완료되었으면 변경하지 않음
      const newSet = new Set(prev);
      newSet.add(missionId);
      return newSet;
    });
  }, []);

  const isMissionCompleted = useCallback((missionId) => {
    return completedMissions.has(missionId);
  }, [completedMissions]);

  const value = {
    missions: missionData,
    isMissionCompleted,
    completeMission,
  };

  return (
    <MissionContext.Provider value={value}>
      {children}
    </MissionContext.Provider>
  );
};