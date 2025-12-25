import React, { useCallback } from "react";
import { StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppStatusBar } from "@/components/AppStatusBar";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    "Vazirmatn-Regular": require("./assets/fonts/Vazirmatn-Regular.ttf"),
    "Vazirmatn-Medium": require("./assets/fonts/Vazirmatn-Medium.ttf"),
    "Vazirmatn-Bold": require("./assets/fonts/Vazirmatn-Bold.ttf"),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
                <KeyboardProvider>
                  <NavigationContainer>
                    <RootStackNavigator />
                  </NavigationContainer>
                  <AppStatusBar />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </SafeAreaProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
