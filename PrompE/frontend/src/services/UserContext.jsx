import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const getExpForNextLevel = (level) => Math.floor(30 * Math.pow(level, 1.2));

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setHours(0, 0, 0, 0);
  return new Date(d.setDate(diff)).toDateString();
};

const UserContext = createContext();
export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [level, setLevel] = useState(() => parseInt(localStorage.getItem('userLevel')) || 1);
  const [exp, setExp] = useState(() => parseInt(localStorage.getItem('userExp')) || 0);
  const [lastLoginDate, setLastLoginDate] = useState(() => localStorage.getItem('lastLoginDate') || null);
  
  const [todayCompletedCount, setTodayCompletedCount] = useState(0);
  const [weekCompletedCount, setWeekCompletedCount] = useState(0);

  useEffect(() => {
    const today = new Date().toDateString();
    const startOfWeek = getStartOfWeek(new Date());

    const savedCompletionDate = localStorage.getItem('completionDate');
    if (savedCompletionDate === today) {
      setTodayCompletedCount(parseInt(localStorage.getItem('todayCompletedCount')) || 0);
    } else {
      setTodayCompletedCount(0);
    }

    const savedWeekStartDate = localStorage.getItem('weekStartDate');
    if (savedWeekStartDate === startOfWeek) {
      setWeekCompletedCount(parseInt(localStorage.getItem('weekCompletedCount')) || 0);
    } else {
      setWeekCompletedCount(0);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('userLevel', level.toString());
    localStorage.setItem('userExp', exp.toString());
    if (lastLoginDate) localStorage.setItem('lastLoginDate', lastLoginDate);
    localStorage.setItem('todayCompletedCount', todayCompletedCount.toString());
    localStorage.setItem('weekCompletedCount', weekCompletedCount.toString());
    localStorage.setItem('completionDate', new Date().toDateString());
    localStorage.setItem('weekStartDate', getStartOfWeek(new Date()));
  }, [level, exp, lastLoginDate, todayCompletedCount, weekCompletedCount]);
  
  const expForNextLevel = getExpForNextLevel(level);

  const gainExp = useCallback((baseAmount, isReview = false) => {
    const amountToGain = isReview ? Math.max(1, Math.floor(baseAmount * 0.1)) : baseAmount;
    if (amountToGain <= 0) return;

    setExp(currentExp => {
      let newExp = currentExp + amountToGain;
      setLevel(currentLevel => {
        let finalLevel = currentLevel;
        let requiredExp = getExpForNextLevel(finalLevel);
        while (newExp >= requiredExp) {
          finalLevel++;
          newExp -= requiredExp;
          requiredExp = getExpForNextLevel(finalLevel);
        }
        return finalLevel;
      });
      return newExp;
    });
  }, []);

  const checkAndSetDailyLogin = useCallback(() => {
    const today = new Date().toDateString();
    if (lastLoginDate !== today) {
      setLastLoginDate(today);
      return true;
    }
    return false;
  }, [lastLoginDate]);

  const incrementCompletionCounts = useCallback(() => {
    setTodayCompletedCount(prevCount => prevCount + 1);
    setWeekCompletedCount(prevCount => prevCount + 1);
  }, []);

  const value = {
    level, exp, expForNextLevel, gainExp,
    checkAndSetDailyLogin,
    todayCompletedCount, weekCompletedCount,
    incrementCompletionCounts,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};