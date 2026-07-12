import { useEffect } from "react";
import auth from "@react-native-firebase/auth";



import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer } from "@react-navigation/native";

import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {

useEffect(() => {
  console.log("Native Firebase User:", auth().currentUser);
}, []);

  return (
  <NavigationContainer>
    <AppNavigator />
  </NavigationContainer>
);
}