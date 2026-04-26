'use client';

import { useState } from 'react';
import { Wizard } from '@/components/Wizard';
import { LoginScreen } from '@/components/LoginScreen';
import { DataProvider } from '@/context/DataContext';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <DataProvider>
      <Wizard />
    </DataProvider>
  );
}
