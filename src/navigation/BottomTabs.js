import React from "react";

import {
  View,
  Text,
  StyleSheet,
  Platform,
} from "react-native";

import {
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";

import Ionicons from "@expo/vector-icons/Ionicons";
import { BlurView } from "expo-blur";

import HomeScreen from "../screens/HomeScreen";
import PostTaskScreen from "../screens/PostTaskScreen";

const Tab = createBottomTabNavigator();

function EmptyMenuScreen() {
  return <View style={{ flex: 1 }} />;
}

export default function BottomTabs() {
  const getIconName = (routeName, focused) => {
    if (routeName === "Home") {
      return focused ? "home" : "home-outline";
    }

    if (routeName === "Post") {
      return focused ? "add-circle" : "add-circle-outline";
    }

    if (routeName === "Menu") {
      return focused ? "menu" : "menu-outline";
    }

    return "ellipse-outline";
  };

  const getLabel = (routeName) => {
    if (routeName === "Home") return "Home";
    if (routeName === "Post") return "Post";
    if (routeName === "Menu") return "Menu";
    return routeName;
  };

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          position: "absolute",
          left: 24,
          right: 24,

          // safer for Android 3-button navigation
          bottom: Platform.OS === "ios" ? 18 : 18,

          height: 56,
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
        },

        tabBarItemStyle: {
          height: 56,
        },

        tabBarBackground: () => (
          <BlurView
            intensity={90}
            tint="dark"
            style={styles.blurContainer}
          />
        ),

        tabBarIcon: ({ focused }) => (
          <View
            style={[
              styles.tabItem,
              focused && styles.activeTabItem,
            ]}
          >
            <Ionicons
              name={getIconName(route.name, focused)}
              size={route.name === "Menu" ? 26 : 21}
              color={focused ? "#60A5FA" : "#CBD5E1"}
            />

            <Text
              style={[
                styles.tabLabel,
                {
                  color: focused ? "#60A5FA" : "#CBD5E1",
                },
              ]}
            >
              {getLabel(route.name)}
            </Text>
          </View>
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Post"
        component={PostTaskScreen}
      />

      <Tab.Screen
        name="Menu"
        component={EmptyMenuScreen}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();

            const drawerNavigation = navigation.getParent();

            if (drawerNavigation?.openDrawer) {
              drawerNavigation.openDrawer();
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(15,23,42,0.86)",
  },

  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    width: 62,
    height: 44,
    borderRadius: 16,
  },

  activeTabItem: {
    backgroundColor: "rgba(59,130,246,0.22)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.35)",
  },

  tabLabel: {
    fontSize: 9,
    fontWeight: "900",
    marginTop: 1,
  },
});