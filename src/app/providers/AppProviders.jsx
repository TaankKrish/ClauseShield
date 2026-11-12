import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext(null);

export function AppProviders({ children }) {
  const [activeSession, setActiveSession] = useState(null);

  return (
    <AppContext.Provider value={{ activeSession, setActiveSession }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProviders tree');
  }
  return context;
}
