'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface HintsContextValue {
  hintsEnabled: boolean;
  setHintsEnabled: (v: boolean) => void;
}

const HintsContext = createContext<HintsContextValue>({
  hintsEnabled: true,
  setHintsEnabled: () => {},
});

export function HintsProvider({ children }: { children: ReactNode }) {
  const [hintsEnabled, setHintsEnabled] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hints-mode');
    if (stored === 'off') setHintsEnabled(false);
  }, []);

  const toggle = (v: boolean) => {
    setHintsEnabled(v);
    localStorage.setItem('hints-mode', v ? 'on' : 'off');
  };

  return (
    <HintsContext.Provider value={{ hintsEnabled, setHintsEnabled: toggle }}>
      {children}
    </HintsContext.Provider>
  );
}

export function useHints() {
  return useContext(HintsContext);
}
