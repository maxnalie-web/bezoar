import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DrawerNavigator from "@/navigation/DrawerNavigator";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import * as LocalAuthentication from "expo-local-authentication";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, Button, StyleSheet, ActivityIndicator } from "react-native";

export type RootStackParamList = {
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to unlock",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });
      if (result.success) {
        await AsyncStorage.setItem("@security/enabled", "true");
        onUnlock();
      } else {
        setError("Authentication failed. Please try again.");
      }
    } catch (e) {
      setError("Authentication error. Please try again.");
    }
    setLoading(false);
  };

  useEffect(() => {
    authenticate();
  }, []);

  return (
    <View style={styles.container}>
      {loading && <ActivityIndicator size="large" />}
      {!loading && error && (
        <>
          <Text style={styles.errorText}>{error}</Text>
          <Button title="Try Again" onPress={authenticate} />
        </>
      )}
    </View>
  );
}

export default function RootStackNavigator() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSecurityFlag = async () => {
      try {
        const enabled = await AsyncStorage.getItem("@security/enabled");
        if (enabled === "true") {
          setAuthenticated(false);
        } else {
          setAuthenticated(true);
        }
      } catch {
        setAuthenticated(true);
      }
      setCheckingAuth(false);
    };
    checkSecurityFlag();
  }, []);

  const screenOptions = {
    ...useScreenOptions({ transparent: false }),
    keyboardHandlingEnabled: false,
  };

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!authenticated) {
    return <LockScreen onUnlock={() => setAuthenticated(true)} />;
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
});
