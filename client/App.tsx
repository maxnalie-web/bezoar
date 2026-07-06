import 'react-native-gesture-handler';
import React, { useCallback } from "react";
import { I18nManager, Platform, StyleSheet, KeyboardAvoidingView, View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
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

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);
I18nManager.swapLeftAndRightInRTL?.(true);

SplashScreen.preventAutoHideAsync();

const KeyboardProvider =
  Platform.OS === "ios"
    ? require("react-native-keyboard-controller").KeyboardProvider
    : React.Fragment;

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
    return (
      <View style={[styles.root, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <NavigationContainer>
                {Platform.OS === "ios" ? (
                  <KeyboardAvoidingView style={styles.root} behavior="padding">
                    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
                      <KeyboardProvider>
                        <RootStackNavigator />
                        <AppStatusBar />
                      </KeyboardProvider>
                    </GestureHandlerRootView>
                  </KeyboardAvoidingView>
                ) : (
                  <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
                    <KeyboardProvider>
                      <RootStackNavigator />
                      <AppStatusBar />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                )}
              </NavigationContainer>
            </SafeAreaProvider>
          </QueryClientProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
