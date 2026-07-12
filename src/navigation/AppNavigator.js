import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  ActivityIndicator,
  Text,
} from "react-native";

import {
  createNativeStackNavigator,
} from "@react-navigation/native-stack";

import {
  onAuthStateChanged,
} from "firebase/auth";

import {
  auth,
} from "../services/firebaseConfig";

import {
  registerForPushNotifications,
} from "../services/notifications";

import AuthNavigator from "./AuthNavigator";
import DrawerNavigator from "./DrawerNavigator";

import TaskDetailScreen from "../screens/TaskDetailScreen";
import ChatScreen from "../screens/ChatScreen";
import ApplyScreen from "../screens/ApplyScreen";
import ApplicantsScreen from "../screens/ApplicantsScreen";
import ReviewScreen from "../screens/ReviewScreen";
import MyPostedTasksScreen from "../screens/MyPostedTasksScreen";
import MyTasksScreen from "../screens/MyTasksScreen";
import MyApplicationsScreen from "../screens/MyApplicationsScreen";
import PublicProfileScreen from "../screens/PublicProfileScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator
        size="large"
        color="#2563EB"
      />

      <Text style={styles.loadingText}>
        Loading Edulance...
      </Text>
    </View>
  );
}

export default function AppNavigator() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser);
        setCheckingAuth(false);

        if (currentUser?.uid) {
          try {
            await registerForPushNotifications(currentUser.uid);
          } catch (error) {
            console.log(
              "Notification registration error:",
              error.message
            );
          }
        }
      }
    );

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        contentStyle: {
          backgroundColor: "#F8FAFC",
        },
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={DrawerNavigator}
          />

          <Stack.Screen
            name="TaskDetail"
            component={TaskDetailScreen}
          />

          <Stack.Screen
            name="PublicProfile"
            component={PublicProfileScreen}
          />

          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              animation: "slide_from_right",
            }}
          />

          <Stack.Screen
            name="Apply"
            component={ApplyScreen}
          />

          <Stack.Screen
            name="Applicants"
            component={ApplicantsScreen}
          />

          <Stack.Screen
            name="Review"
            component={ReviewScreen}
          />

          <Stack.Screen
            name="MyPostedTasks"
            component={MyPostedTasksScreen}
          />

          <Stack.Screen
            name="MyTasks"
            component={MyTasksScreen}
          />

          <Stack.Screen
  name="EditProfile"
  component={EditProfileScreen}
/>

          <Stack.Screen
            name="MyApplications"
            component={MyApplicationsScreen}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{
            animation: "fade",
          }}
        />
      )}
    </Stack.Navigator>
  );
}

const styles = {
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "700",
  },
};