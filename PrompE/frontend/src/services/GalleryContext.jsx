import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

const GalleryContext = createContext();

export const useGallery = () => {
  return useContext(GalleryContext);
};

export const GalleryProvider = ({ children }) => {
  const [myCreations, setMyCreations] = useState(() => {
    try {
      const saved = localStorage.getItem('myCreations');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('myCreations', JSON.stringify(myCreations));
  }, [myCreations]);

  const addCreation = useCallback((creation) => {
    const newCreation = {
      id: uuidv4(),
      ...creation,
      createdAt: new Date().toISOString(),
    };
    setMyCreations(prevCreations => [newCreation, ...prevCreations]);
  }, []);

  const value = { myCreations, addCreation };

  return (
    <GalleryContext.Provider value={value}>
      {children}
    </GalleryContext.Provider>
  );
};