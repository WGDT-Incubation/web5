import React, { createContext, useContext, useState, ReactNode } from 'react';

type SelectedDIDContextType = {
  selectedDID: string;
  setSelectedDID: (did: string) => void;
};

const SelectedDIDContext = createContext<SelectedDIDContextType | undefined>(undefined);

export function SelectedDIDProvider({ children }: { children: ReactNode }) {
  const [selectedDID, setSelectedDID] = useState('');
  return (
    <SelectedDIDContext.Provider value={{ selectedDID, setSelectedDID }}>
      {children}
    </SelectedDIDContext.Provider>
  );
}

export function useSelectedDID() {
  const context = useContext(SelectedDIDContext);
  if (!context) throw new Error('useSelectedDID must be used within SelectedDIDProvider');
  return context;
}