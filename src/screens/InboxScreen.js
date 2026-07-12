import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  StatusBar,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function InboxScreen({ navigation }) {
  const [chats, setChats] = useState([]);
  const [userCache, setUserCache] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [errorText, setErrorText] = useState("");

  const userCacheRef = useRef({});

  useEffect(() => {
    userCacheRef.current = userCache;
  }, [userCache]);

  const getShortEmailName = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  const getOtherUserId = (room) => {
    const usersObject = room?.users || {};
    const users = Object.keys(usersObject);

    return users.find(
      (uid) => uid !== auth.currentUser?.uid
    );
  };

  const getUserData = async (userId) => {
    if (!userId) {
      return {
        name: "User",
        email: "",
        college: "",
        photoURL: "",
      };
    }

    if (userCacheRef.current[userId]) {
      return userCacheRef.current[userId];
    }

    try {
      const userSnap = await getDoc(
        doc(db, "users", userId)
      );

      if (userSnap.exists()) {
        const data = userSnap.data();

        const userData = {
          name:
            data?.name ||
            getShortEmailName(data?.email) ||
            "User",

          email: data?.email || "",
          college: data?.college || "",
          photoURL: data?.photoURL || "",
        };

        setUserCache((prev) => ({
          ...prev,
          [userId]: userData,
        }));

        return userData;
      }
    } catch (error) {
      console.log("User fetch error:", error.message);
    }

    return {
      name: "User",
      email: "",
      college: "",
      photoURL: "",
    };
  };
useEffect(() => {
  if (!auth.currentUser) {
    setLoading(true);
    return;
  }

  const q = query(
    collection(db, "chatRooms"),
    where(`users.${auth.currentUser.uid}`, "==", true),
    orderBy("updatedAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      try {
        const rooms = await Promise.all(
          snapshot.docs.map(async (docSnap) => {
            const room = docSnap.data();
            const otherUserId = getOtherUserId(room);
            const otherUser = await getUserData(otherUserId);

            return {
              id: docSnap.id,
              ...room,
              otherUserId,
              otherUserName: otherUser.name,
              otherUserEmail: otherUser.email,
              otherUserCollege: otherUser.college,
              otherUserPhotoURL: otherUser.photoURL,
            };
          })
        );

        setChats(rooms);
        setErrorText("");
      } catch (error) {
        console.log("Inbox processing error:", error.message);
        setErrorText(error.message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    (error) => {
      console.log("Inbox load error:", error.message);
      setErrorText(error.message);
      setLoading(false);
      setRefreshing(false);
    }
  );

  return unsubscribe;
}, []);
 
  const filteredChats = useMemo(() => {
    const search = searchText.trim().toLowerCase();
if (loading) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={{ marginTop: 10 }}>Loading Inbox...</Text>
    </View>
  );
}
    if (!search) return chats;

    return chats.filter((chat) => {
      const name = chat.otherUserName?.toLowerCase() || "";
      const email = chat.otherUserEmail?.toLowerCase() || "";
      const college = chat.otherUserCollege?.toLowerCase() || "";
      const lastMessage = chat.lastMessage?.toLowerCase() || "";
      const taskTitle = chat.taskTitle?.toLowerCase() || "";

      return (
        name.includes(search) ||
        email.includes(search) ||
        college.includes(search) ||
        lastMessage.includes(search) ||
        taskTitle.includes(search)
      );
    });
  }, [chats, searchText]);

  const unreadChatsCount = useMemo(() => {
    return chats.filter((chat) => {
      const unread =
        chat?.unreadCount?.[auth.currentUser?.uid] || 0;

      return unread > 0;
    }).length;
  }, [chats]);

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const openChat = (item) => {
    if (!item?.id) {
      alert("Chat room not found");
      return;
    }

    navigation.navigate("Chat", {
      roomId: item.id,
      otherUserName: item.otherUserName,
      otherUserId: item.otherUserId,
    });
  };

  const openPublicProfile = (item) => {
    if (!item?.otherUserId) {
      alert("User profile not found");
      return;
    }

    navigation.navigate("PublicProfile", {
      userId: item.otherUserId,
    });
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp?.toDate) return "";

      const date = timestamp.toDate();
      const now = new Date();

      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);

      const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (isYesterday) {
        return "Yesterday";
      }

      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
      });
    } catch {
      return "";
    }
  };

  const getRoomTypeMeta = (room) => {
    if (room?.type === "task" || room?.taskId) {
      return {
        label: room?.taskTitle || "Task Chat",
        icon: "briefcase-outline",
        color: "#2563EB",
        bg: "#EFF6FF",
      };
    }

    return {
      label: "Direct Chat",
      icon: "chatbubble-outline",
      color: "#16A34A",
      bg: "#F0FDF4",
    };
  };

  const renderChat = ({ item }) => {
    const lastMessage =
      item.lastMessage?.trim() || "No messages yet";

    const isLastMessageMine =
      item.lastMessageSenderId === auth.currentUser?.uid;

    const unread =
      item?.unreadCount?.[auth.currentUser?.uid] || 0;

    const roomMeta = getRoomTypeMeta(item);

    return (
      <TouchableOpacity
        activeOpacity={0.86}
        onPress={() => openChat(item)}
        style={[
          styles.chatCard,
          unread > 0 && styles.unreadChatCard,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openPublicProfile(item)}
          style={styles.profileTapArea}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.otherUserName || "U")
                .charAt(0)
                .toUpperCase()}
            </Text>

            <View style={styles.onlineDot} />
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={styles.chatTopRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openPublicProfile(item)}
              style={{ flex: 1 }}
            >
              <Text
                style={[
                  styles.userName,
                  unread > 0 && styles.unreadUserName,
                ]}
                numberOfLines={1}
              >
                {item.otherUserName || "User"}
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                styles.timeText,
                unread > 0 && styles.unreadTimeText,
              ]}
            >
              {formatTime(item.updatedAt)}
            </Text>
          </View>

          <View style={styles.roomMetaRow}>
            <View
              style={[
                styles.roomTypeBadge,
                {
                  backgroundColor: roomMeta.bg,
                },
              ]}
            >
              <Ionicons
                name={roomMeta.icon}
                size={12}
                color={roomMeta.color}
              />

              <Text
                style={[
                  styles.roomTypeText,
                  {
                    color: roomMeta.color,
                  },
                ]}
                numberOfLines={1}
              >
                {roomMeta.label}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openPublicProfile(item)}
              style={styles.viewProfileBadge}
            >
              <Text style={styles.viewProfileText}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>

          {item.otherUserCollege ? (
            <Text
              style={styles.collegeText}
              numberOfLines={1}
            >
              {item.otherUserCollege}
            </Text>
          ) : null}

          <View style={styles.messagePreviewRow}>
            <Text
              style={[
                styles.lastMessage,
                unread > 0 && styles.unreadLastMessage,
              ]}
              numberOfLines={1}
            >
              {isLastMessageMine && item.lastMessage ? "You: " : ""}
              {lastMessage}
            </Text>

            {unread > 0 ? (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unread > 99 ? "99+" : unread}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={20}
          color="#CBD5E1"
          style={{ marginLeft: 7 }}
        />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading inbox...
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
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>
            Inbox
          </Text>

          <Text style={styles.subtitle}>
            {chats.length} conversation{chats.length === 1 ? "" : "s"}
            {unreadChatsCount > 0
              ? ` • ${unreadChatsCount} unread`
              : ""}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Home")}
          style={styles.newTaskButton}
        >
          <Ionicons
            name="home-outline"
            size={22}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#64748B"
          style={{ marginRight: 10 }}
        />

        <TextInput
          placeholder="Search by name, task, college..."
          placeholderTextColor="#94A3B8"
          value={searchText}
          onChangeText={setSearchText}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.searchInput}
        />

        {searchText.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchText("")}
            style={styles.clearSearchButton}
          >
            <Ionicons
              name="close"
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Could not load inbox
          </Text>

          <Text style={styles.errorText}>
            {errorText}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        renderItem={renderChat}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 145,
        }}
        ListEmptyComponent={
          !errorText ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={
                    searchText.trim()
                      ? "search-outline"
                      : "chatbubbles-outline"
                  }
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                {searchText.trim()
                  ? "No chats found"
                  : "No conversations yet"}
              </Text>

              <Text style={styles.emptyText}>
                {searchText.trim()
                  ? "Try searching with another name, task, or college."
                  : "Your task chats will appear here once you start messaging someone."}
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
    fontWeight: "600",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },

  newTaskButton: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginLeft: 12,
  },

  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    minHeight: 54,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    paddingVertical: 12,
    fontWeight: "600",
  },

  clearSearchButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
    fontSize: 15,
  },

  errorText: {
    color: "#B91C1C",
    marginTop: 5,
    lineHeight: 20,
    fontWeight: "600",
  },

  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },

  unreadChatCard: {
    borderColor: "#BFDBFE",
    backgroundColor: "#FFFFFF",
  },

  profileTapArea: {
    marginRight: 13,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    color: "#2563EB",
    fontSize: 22,
    fontWeight: "900",
  },

  onlineDot: {
    position: "absolute",
    right: 2,
    bottom: 3,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22C55E",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  chatTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  userName: {
    flex: 1,
    color: "#111827",
    fontSize: 17,
    fontWeight: "900",
    marginRight: 8,
  },

  unreadUserName: {
    color: "#0F172A",
  },

  timeText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "800",
  },

  unreadTimeText: {
    color: "#2563EB",
  },

  roomMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  roomTypeBadge: {
    maxWidth: "68%",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  roomTypeText: {
    marginLeft: 4,
    fontSize: 11,
    fontWeight: "900",
  },

  viewProfileBadge: {
    marginLeft: 8,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },

  viewProfileText: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "900",
  },

  collegeText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  messagePreviewRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  lastMessage: {
    flex: 1,
    color: "#64748B",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },

  unreadLastMessage: {
    color: "#111827",
    fontWeight: "800",
  },

  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
    marginLeft: 8,
  },

  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
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
    textAlign: "center",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },
};