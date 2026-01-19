import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { missions as missionData } from '../data/mission';

const MissionContext = createContext();

export const useMissions = () => useContext(MissionContext);

export const MissionProvider = ({ children }) => {
  const [completedMissions, setCompletedMissions] = useState(() => {
    const saved = localStorage.getItem('completedMissions');
    return new Set(saved ? JSON.parse(saved) : []);
  });
  const [missionDate, setMissionDate] = useState(() => localStorage.getItem('missionDate') || '');
  const [missionWeek, setMissionWeek] = useState(() => localStorage.getItem('missionWeek') || '');

  useEffect(() => {
    const today = new Date().toDateString();
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const weekKey = new Date(startOfWeek.setDate(diff)).toDateString();

    if (missionDate !== today || missionWeek !== weekKey) {
      setCompletedMissions(prev => {
        const next = new Set(prev);
        missionData.forEach(mission => {
          if (mission.type === 'daily' && missionDate !== today) {
            next.delete(mission.id);
          }
          if (mission.type === 'weekly' && missionWeek !== weekKey) {
            next.delete(mission.id);
          }
        });
        return next;
      });
      setMissionDate(today);
      setMissionWeek(weekKey);
    }
  }, [missionDate, missionWeek]);

  useEffect(() => {
    localStorage.setItem('completedMissions', JSON.stringify(Array.from(completedMissions)));
    if (missionDate) localStorage.setItem('missionDate', missionDate);
    if (missionWeek) localStorage.setItem('missionWeek', missionWeek);
  }, [completedMissions, missionDate, missionWeek]);

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
