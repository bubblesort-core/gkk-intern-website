import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import PendingScreen from '../screens/PendingScreen';
import PaymentRequiredScreen from '../screens/PaymentRequiredScreen';
import DashboardScreen from '../screens/DashboardScreen';
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

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!session ? (
          // Not logged in
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : !profile ? (
          // Logged in but profile data is still fetching (or not found in applications table)
          <Stack.Screen name="Pending" component={PendingScreen} />
        ) : !profile.is_approved ? (
          // Not approved yet
          <Stack.Screen name="Pending" component={PendingScreen} />
        ) : profile.payment_status !== 'paid' && profile.payment_status !== 'successful' && profile.payment_status !== 'success' ? (
          // Approved but not paid
          <Stack.Screen name="PaymentRequired" component={PaymentRequiredScreen} />
        ) : (
          // Approved and Paid
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
