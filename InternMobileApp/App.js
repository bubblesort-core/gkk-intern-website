import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { DashboardProvider } from './src/context/DashboardContext';
import AppNavigator from './src/navigation/AppNavigator';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setSplashDone(true)} />
      </>
    );
  }

  return (
    <AuthProvider>
      <DashboardProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </DashboardProvider>
    </AuthProvider>
  );
}
