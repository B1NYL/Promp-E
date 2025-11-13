import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  return useContext(ThemeContext);
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'system');

  useEffect(() => {
    const root = window.document.documentElement; // <html> 태그
    
    // 현재 시스템이 다크 모드인지 확인
    const systemIsDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 최종적으로 다크 모드를 적용할지 결정
    const applyDark = theme === 'dark' || (theme === 'system' && systemIsDark);

    // 기존 클래스를 지우고 새로운 클래스를 추가
    root.classList.remove(applyDark ? 'light' : 'dark');
    root.classList.add(applyDark ? 'dark' : 'light');
    
    localStorage.setItem('theme', theme);
  }, [theme]); // theme 상태가 바뀔 때마다 이 로직이 실행됨

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};