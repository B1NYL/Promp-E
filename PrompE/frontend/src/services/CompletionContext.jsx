import React, { createContext, useContext, useState, useEffect } from 'react';

// Context 객체 생성
const CompletionContext = createContext();

// 다른 컴포넌트에서 쉽게 사용할 커스텀 훅
export const useCompletion = () => {
  return useContext(CompletionContext);
};

// 상태와 함수를 자식 컴포넌트에 제공하는 Provider
export const CompletionProvider = ({ children }) => {
  // 1. localStorage에서 저장된 완료 목록을 가져와 Set으로 초기화
  const [completedLessons, setCompletedLessons] = useState(() => {
    const saved = localStorage.getItem('completedLessons');
    return new Set(saved ? JSON.parse(saved) : []);
  });

  // 2. completedLessons 상태가 바뀔 때마다 localStorage에 저장
  useEffect(() => {
    // Set은 직접 JSON으로 변환할 수 없으므로, Array로 변환 후 저장
    localStorage.setItem('completedLessons', JSON.stringify(Array.from(completedLessons)));
  }, [completedLessons]);

  /**
   * 특정 레슨을 완료 상태로 표시하는 함수
   * @param {string} lessonId - 완료 처리할 레슨의 고유 ID
   */
  const completeLesson = (lessonId) => {
    setCompletedLessons(prevSet => {
      const newSet = new Set(prevSet);
      newSet.add(lessonId);
      return newSet;
    });
  };

  /**
   * 특정 레슨이 완료되었는지 확인하는 함수
   * @param {string} lessonId - 확인할 레슨의 고유 ID
   * @returns {boolean}
   */
  const isCompleted = (lessonId) => {
    return completedLessons.has(lessonId);
  };

  // 자식 컴포넌트에 전달할 값
  const value = {
    isCompleted,
    completeLesson,
  };

  return (
    <CompletionContext.Provider value={value}>
      {children}
    </CompletionContext.Provider>
  );
};