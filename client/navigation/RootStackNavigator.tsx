import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DrawerNavigator from "@/navigation/DrawerNavigator";
import PatientDetailScreen from "@/screens/PatientDetailScreen";
import DrugDetailScreen from "@/screens/DrugDetailScreen";
import SaleDetailScreen from "@/screens/SaleDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  PatientDetail: { patientId?: string };
  DrugDetail: { drugId?: string };
  SaleDetail: { saleId?: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PatientDetail"
        component={PatientDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Patient Details",
        }}
      />
      <Stack.Screen
        name="DrugDetail"
        component={DrugDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Drug Details",
        }}
      />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{
          presentation: "modal",
          headerTitle: "Sale Details",
        }}
      />
    </Stack.Navigator>
  );
}
