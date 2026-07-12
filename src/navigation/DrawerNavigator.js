import React, {
  useEffect,
  useState,
} from "react";
import FaqScreen from "../screens/FaqScreen";
import SupportScreen from "../screens/SupportScreen";
import SubmitReviewScreen from "../screens/SubmitReviewScreen";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
} from "react-native";

import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  signOut,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../services/firebaseConfig";

import BottomTabs from "./BottomTabs";

import ProfileScreen from "../screens/ProfileScreen";
import ApplicationsScreen from "../screens/ApplicationsScreen";
import MyTasksScreen from "../screens/MyTasksScreen";
import MyPostedTasksScreen from "../screens/MyPostedTasksScreen";
import MyApplicationsScreen from "../screens/MyApplicationsScreen";
import InboxScreen from "../screens/InboxScreen";
import MessageScreen from "../screens/MessageScreen";
import NotificationsScreen from "../screens/NotificationsScreen";

const Drawer = createDrawerNavigator();

function CustomDrawerContent({ navigation }) {
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", auth.currentUser.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setUnreadNotifications(snapshot.size);
      },
      (error) => {
        console.log("Unread notifications error:", error.message);
      }
    );

    return unsubscribe;
  }, []);

  const menuItems = [
    {
      label: "Profile",
      subtitle: "View and edit your profile",
      icon: "person-outline",
      screen: "Profile",
    },
    {
      label: "Notifications",
      subtitle: "Task and application updates",
      icon: "notifications-outline",
      screen: "Notifications",
      badge: unreadNotifications,
    },
{
      label: "Private Chat",
      subtitle: "Private task conversations",
      icon: "chatbubbles-outline",
      screen: "Inbox",
    },
 {
      label: "Anonymous Chat",
      subtitle: "General messages",
      icon: "mail-outline",
      screen: "Messages",
    },
 {
      label: "My Applied Task",
      subtitle: "Track applied tasks",
      icon: "document-text-outline",
      screen: "MyApplications",
    },

 {
      label: "To Do Task",
      subtitle: "Tasks assigned to you",
      icon: "briefcase-outline",
      screen: "MyTasks",
    },
  {
      label: "My Posted Tasks",
      subtitle: "Tasks created by you",
      icon: "clipboard-outline",
      screen: "MyPostedTasks",
    },

      {
      label: "All Applicants",
      subtitle: "Applicants on your tasks",
      icon: "people-outline",
      screen: "Applications",
    },
    
{
  label: "FAQ",
  subtitle: "Guidelines and common questions",
  icon: "help-circle-outline",
  screen: "FAQ",
},
{
  label: "Support",
  subtitle: "Contact developer",
  icon: "headset-outline",
  screen: "Support",
},
{
  label: "Submit Review",
  subtitle: "Share your feedback",
  icon: "create-outline",
  screen: "Submit Review",
},
   
  
   
  ];

  const handleNavigate = (screen) => {
    navigation.closeDrawer();
    navigation.navigate(screen);
  };

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              navigation.closeDrawer();
              await signOut(auth);
            } catch (error) {
              alert(error.message);
            }
          },
        },
      ]
    );
  };

  return (
    <DrawerContentScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.drawerContainer}
    >
      <View style={styles.drawerHeader}>
        <View style={styles.logoCircle}>
          <Ionicons
            name="briefcase-outline"
            size={32}
            color="#2563EB"
          />
        </View>

        <View style={styles.menuItem}>
    <Ionicons
        name="moon-outline"
        size={22}
        color="#2563EB"
    />

  
</View>

        <View style={{ flex: 1 }}>
          <Text style={styles.drawerTitle}>
            Edulance
          </Text>

          <Text style={styles.drawerSubtitle}>
            Student freelancing marketplace
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.closeDrawer()}
          style={styles.closeButton}
        >
          <Ionicons
            name="close"
            size={22}
            color="#334155"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.menuList}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.screen}
            activeOpacity={0.86}
            onPress={() => handleNavigate(item.screen)}
            style={styles.menuItem}
          >
            <View style={styles.menuIconBox}>
              <Ionicons
                name={item.icon}
                size={21}
                color="#2563EB"
              />

              {item.badge > 0 ? (
                <View style={styles.iconBadge}>
                  <Text style={styles.iconBadgeText}>
                    {item.badge > 99 ? "99+" : item.badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.menuTitleRow}>
                <Text style={styles.menuText}>
                  {item.label}
                </Text>

                {item.badge > 0 ? (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.menuSubtitle}>
                {item.subtitle}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color="#CBD5E1"
            />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.bottomSection}>
        <TouchableOpacity
          activeOpacity={0.86}
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <View style={styles.logoutIconBox}>
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#DC2626"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.logoutText}>
              Logout
            </Text>

            <Text style={styles.logoutSubtitle}>
              Sign out from this account
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => (
        <CustomDrawerContent {...props} />
      )}
      screenOptions={{
        headerShown: false,
        drawerPosition: "left",
        drawerType: "front",
        swipeEnabled: true,
        swipeEdgeWidth: 80,
        overlayColor: "rgba(15,23,42,0.45)",
        drawerStyle: {
          width: "84%",
          backgroundColor: "#F8FAFC",
        },
        sceneContainerStyle: {
          backgroundColor: "#F8FAFC",
        },
      }}
    >
      <Drawer.Screen
        name="Tabs"
        component={BottomTabs}
      />

      <Drawer.Screen
        name="Profile"
        component={ProfileScreen}
      />
<Drawer.Screen
  name="FAQ"
  component={FaqScreen}
/>

<Drawer.Screen
  name="Support"
  component={SupportScreen}
/>

<Drawer.Screen
  name="Submit Review"
  component={SubmitReviewScreen}
/>
      <Drawer.Screen
        name="Applications"
        component={ApplicationsScreen}
      />

      <Drawer.Screen
        name="MyTasks"
        component={MyTasksScreen}
      />

      <Drawer.Screen
        name="MyPostedTasks"
        component={MyPostedTasksScreen}
      />

      <Drawer.Screen
        name="MyApplications"
        component={MyApplicationsScreen}
      />

      <Drawer.Screen
        name="Inbox"
        component={InboxScreen}
      />

      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
      />

      <Drawer.Screen
        name="Messages"
        component={MessageScreen}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android"
        ? (StatusBar.currentHeight || 0) + 16
        : 24,
    paddingBottom: 28,
    backgroundColor: "#F8FAFC",
  },

  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },

  logoCircle: {
    width: 62,
    height: 62,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  drawerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
  },

  drawerSubtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },



  menuList: {
    marginTop: 4,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    position: "relative",
  },

  iconBadge: {
    position: "absolute",
    top: -6,
    right: -7,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  iconBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "900",
  },

  menuTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  menuText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },

  badgePill: {
    marginLeft: 8,
    backgroundColor: "#EF4444",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },

  badgePillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  menuSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  bottomSection: {
    marginTop: "auto",
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  logoutIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  logoutText: {
    color: "#DC2626",
    fontSize: 15,
    fontWeight: "900",
  },

  logoutSubtitle: {
    marginTop: 2,
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "600",
  },
});