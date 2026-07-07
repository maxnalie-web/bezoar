import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import SalesScreen from "@/screens/SalesScreen";
import SaleDetailScreen from "@/screens/SaleDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type SalesStackParamList = {
  SalesList: undefined;
  SaleDetail: { saleId?: string };
};

const Stack = createStackNavigator<SalesStackParamList>();

export default function SalesStackNavigator() {
  const screenOptions = {
    ...useScreenOptions({ transparent: false }),
    keyboardHandlingEnabled: false,
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="SalesList"
        component={SalesScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SaleDetail"
        component={SaleDetailScreen}
        options={{ headerTitle: "جزئیات فروش" }}
      />
    </Stack.Navigator>
  );
}
