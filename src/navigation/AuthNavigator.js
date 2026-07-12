import React from "react";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import PhoneLoginScreen from "../screens/PhoneLoginScreen";
const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#F8FAFC",
        },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />

      <Stack.Screen
  name="PhoneLogin"
  component={PhoneLoginScreen}
/>

      <Stack.Screen
        name="Signup"
        component={SignupScreen}
      />
    </Stack.Navigator>
  );
}