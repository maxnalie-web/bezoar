import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import DrugsScreen from "@/screens/DrugsScreen";
import DrugDetailScreen from "@/screens/DrugDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type DrugsStackParamList = {
  DrugsList: undefined;
  DrugDetail: { drugId?: string };
};

const Stack = createStackNavigator<DrugsStackParamList>();

export default function DrugsStackNavigator() {
  const screenOptions = {
    ...useScreenOptions({ transparent: false }),
    keyboardHandlingEnabled: false,
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="DrugsList"
        component={DrugsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DrugDetail"
        component={DrugDetailScreen}
        options={{ headerTitle: "جزئیات دارو" }}
      />
    </Stack.Navigator>
  );
}
