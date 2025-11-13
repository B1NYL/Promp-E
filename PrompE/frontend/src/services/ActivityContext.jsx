import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// 1. Context 객체 생성
const ActivityContext = createContext();

// 2. 다른 컴포넌트에서 쉽게 사용할 수 있도록 커스텀 훅(hook) 생성
export const useActivity = () => {
  return useContext(ActivityContext);
};

// 3. 상태와 함수를 자식 컴포넌트에 제공하는 Provider 컴포넌트 생성
export const ActivityProvider = ({ children }) => {
  // '최근 활동' 목록을 저장하는 state
  const [activities, setActivities] = useState([
    { icon: '👋', title: 'PrompE에 오신 것을 환영합니다!', time: '방금 전' },
  ]);

  /**
   * 새로운 활동을 목록의 맨 위에 추가하는 함수
   * useCallback으로 감싸서 불필요한 함수 재생성을 방지합니다.
   * @param {object} newActivity - { icon, title, time } 형태의 객체
   */
  const addActivity = useCallback((newActivity) => {
    // setActivities의 함수형 업데이트를 사용하여 항상 최신 상태를 기반으로 업데이트합니다.
    // 이렇게 하면 의존성 배열에서 prevActivities를 생략할 수 있습니다.
    setActivities(prevActivities => [newActivity, ...prevActivities].slice(0, 5));
  }, []); // 의존성 배열이 비어 있으므로 이 함수는 컴포넌트가 처음 마운트될 때 한 번만 생성됩니다.

  // 자식 컴포넌트에 전달할 값들 (상태와 상태를 변경하는 함수)
  const value = {
    activities,
    addActivity,
  };

  return (
    <ActivityContext.Provider value={value}>
      {children}
    </ActivityContext.Provider>
  );
};