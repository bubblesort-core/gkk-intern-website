import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import PendingScreen from '../screens/PendingScreen';
import PaymentRequiredScreen from '../screens/PaymentRequiredScreen';
import MainTabs from './MainTabs';
import NoAccountScreen from '../screens/NoAccountScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Debug: log profile data to see exact field names and values
  if (profile) {
    console.log('COMBINED PROFILE DATA:', JSON.stringify(profile, null, 2));
  }

  const hasApplication = !!profile?.application;
  const isApproved = profile?.application?.status?.toLowerCase() === 'approved';
  
  // According to the web dashboard, a paid user has a profile with status === 'active'
  const isPaid = profile?.userProfile?.status === 'active';

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!session ? (
          // Not logged in
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !hasApplication ? (
          // Logged in but no application found
          <Stack.Screen name="NoAccount" component={NoAccountScreen} />
        ) : !isApproved ? (
          // Application not approved yet
          <Stack.Screen name="Pending" component={PendingScreen} />
        ) : !isPaid ? (
          // Approved but payment not completed (or account not created yet on web)
          <Stack.Screen name="PaymentRequired" component={PaymentRequiredScreen} />
        ) : (
          // Approved and Paid — full access
          <Stack.Screen name="Dashboard" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
