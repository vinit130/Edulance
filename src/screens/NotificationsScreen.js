import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function NotificationsScreen({
  navigation,
}) {
  const [notifications, setNotifications] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setErrorText("Please login again.");
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setNotifications(data);
        setErrorText("");
        setLoading(false);
      },
      (error) => {
        console.log("Notifications error:", error.message);
        setErrorText(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(
        doc(db, "notifications", notificationId),
        {
          read: true,
          readAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.log("Mark read error:", error.message);
    }
  };

  const openNotification = async (item) => {
    await markAsRead(item.id);

    const type = item?.type;
    const data = item?.data || {};

    if (
      type === "new_application" &&
      data?.taskId
    ) {
      Alert.alert(
        "Application",
        "Open My Posted Tasks to view applicants."
      );
      navigation.navigate("MyPostedTasks");
      return;
    }

    if (
      type === "application_accepted" &&
      data?.taskId
    ) {
      navigation.navigate("MyTasks");
      return;
    }

    if (
      type === "task_completed" &&
      data?.taskId
    ) {
      navigation.navigate("MyPostedTasks");
      return;
    }

    if (
      type === "new_message" &&
      data?.roomId
    ) {
      navigation.navigate("Chat", {
        roomId: data.roomId,
        otherUserName: data.otherUserName || "User",
      });
      return;
    }
  };

  const getIconMeta = (type) => {
    if (type === "new_application") {
      return {
        icon: "document-text-outline",
        bg: "#DBEAFE",
        color: "#2563EB",
      };
    }

    if (type === "application_accepted") {
      return {
        icon: "checkmark-circle-outline",
        bg: "#DCFCE7",
        color: "#16A34A",
      };
    }

    if (type === "task_completed") {
      return {
        icon: "flag-outline",
        bg: "#FEF3C7",
        color: "#D97706",
      };
    }

    if (type === "new_message") {
      return {
        icon: "chatbubble-ellipses-outline",
        bg: "#E0F2FE",
        color: "#0284C7",
      };
    }

    return {
      icon: "notifications-outline",
      bg: "#F1F5F9",
      color: "#64748B",
    };
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp?.toDate) return "Now";

      const date = timestamp.toDate();

      return date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Now";
    }
  };

  const renderNotification = ({ item }) => {
    const meta = getIconMeta(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => openNotification(item)}
        style={[
          styles.notificationCard,
          !item.read && styles.unreadCard,
        ]}
      >
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: meta.bg,
            },
          ]}
        >
          <Ionicons
            name={meta.icon}
            size={24}
            color={meta.color}
          />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.notificationTopRow}>
            <Text
              style={styles.notificationTitle}
              numberOfLines={1}
            >
              {item.title || "Notification"}
            </Text>

            {!item.read ? (
              <View style={styles.unreadDot} />
            ) : null}
          </View>

          <Text
            style={styles.notificationBody}
            numberOfLines={2}
          >
            {item.body || ""}
          </Text>

          <Text style={styles.notificationTime}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading notifications...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <View style={styles.header}>
        <Text style={styles.title}>
          Notifications
        </Text>

        <Text style={styles.subtitle}>
          Updates about your tasks, applications and messages
        </Text>
      </View>

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Could not load notifications
          </Text>

          <Text style={styles.errorText}>
            {errorText}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 145,
        }}
        ListEmptyComponent={
          !errorText ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No notifications yet
              </Text>

              <Text style={styles.emptyText}>
                Your task updates and messages will appear here.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  centerContainer: {
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

  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 15,
    borderRadius: 18,
  },

  errorTitle: {
    color: "#991B1B",
    fontWeight: "900",
  },

  errorText: {
    color: "#B91C1C",
    marginTop: 5,
    fontWeight: "600",
  },

  notificationCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 22,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  unreadCard: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FFFFFF",
  },

  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 13,
  },

  notificationTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  notificationTitle: {
    flex: 1,
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },

  notificationBody: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  notificationTime: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },

  emptyBox: {
    marginTop: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },
};