import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import PatientsScreen from "@/screens/PatientsScreen";
import PatientDetailScreen from "@/screens/PatientDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type PatientsStackParamList = {
  PatientsList: undefined;
  PatientDetail: { patientId?: string };
};

const Stack = createStackNavigator<PatientsStackParamList>();

export default function PatientsStackNavigator() {
  const screenOptions = {
    ...useScreenOptions({ transparent: false }),
    keyboardHandlingEnabled: false,
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="PatientsList"
        component={PatientsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{ headerTitle: "جزئیات بیمار" }}
      />
    </Stack.Navigator>
  );
}
