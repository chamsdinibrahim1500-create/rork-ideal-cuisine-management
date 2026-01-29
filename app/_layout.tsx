import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { DataProvider } from "@/contexts/DataContext";
import { trpc, trpcClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen 
        name="project/[id]" 
        options={{ 
          headerShown: true,
          headerTitle: "",
        }} 
      />
      <Stack.Screen 
        name="project/create" 
        options={{ 
          headerShown: true,
          presentation: "modal",
        }} 
      />
      <Stack.Screen 
        name="project/[id]/workflow" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="task/[id]" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="notifications" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="messages/index" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="messages/[userId]" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="employee/[id]" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="admin/users" 
        options={{ 
          headerShown: true,
        }} 
      />
      <Stack.Screen 
        name="admin/permissions" 
        options={{ 
          headerShown: true,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <LanguageProvider>
              <AuthProvider>
                <DataProvider>
                  <RootLayoutNav />
                </DataProvider>
              </AuthProvider>
            </LanguageProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
