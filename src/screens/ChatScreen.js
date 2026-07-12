import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from "react-native";

import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function ChatScreen({
  route,
  navigation,
}) {
  const insets = useSafeAreaInsets();

  const roomId = route?.params?.roomId;
  const otherUserNameFromParams =
    route?.params?.otherUserName;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [roomData, setRoomData] = useState(null);

  const [otherUserName, setOtherUserName] =
    useState(otherUserNameFromParams || "User");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!roomId || !auth.currentUser) {
      setLoading(false);
      return;
    }

    const roomRef = doc(db, "chatRooms", roomId);

    const unsubscribeRoom = onSnapshot(
      roomRef,
      async (snapshot) => {
        if (!snapshot.exists()) {
          setRoomData(null);
          setLoading(false);
          return;
        }

        const data = snapshot.data();
        setRoomData(data);

        try {
          if (data?.users) {
            const userIds = Object.keys(data.users);

            const otherUserId = userIds.find(
              (uid) => uid !== auth.currentUser.uid
            );

            if (otherUserId) {
              const userSnap = await getDoc(
                doc(db, "users", otherUserId)
              );

              if (userSnap.exists()) {
                const userData = userSnap.data();

                setOtherUserName(
                  userData?.name ||
                    getShortEmailName(userData?.email) ||
                    otherUserNameFromParams ||
                    "User"
                );
              }
            }
          }
        } catch (error) {
          console.log("Other user load error:", error.message);
        }
      },
      (error) => {
        console.log("Chat room load error:", error.message);
        alert(error.message);
        setLoading(false);
      }
    );

    const messagesQuery = query(
      collection(db, "chatRooms", roomId, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const fetchedMessages = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setMessages(fetchedMessages);
        setLoading(false);
      },
      (error) => {
        console.log("Messages load error:", error.message);
        alert(error.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeRoom();
      unsubscribeMessages();
    };
  }, [roomId]);

  const getShortEmailName = (email) => {
    if (!email) return "";

    return email.split("@")[0];
  };

  const getInputBottomPadding = () => {
    if (Platform.OS === "ios") {
      return keyboardVisible ? 8 : insets.bottom + 8;
    }

    return keyboardVisible
      ? 4
      : Math.max(insets.bottom, 28);
  };

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    if (!auth.currentUser) {
      alert("Please login again to send message");
      return;
    }

    if (!roomId) {
      alert("Chat room not found");
      return;
    }

    try {
      setSending(true);

      await addDoc(
        collection(db, "chatRooms", roomId, "messages"),
        {
          text: cleanMessage,
          senderId: auth.currentUser.uid,
          senderEmail: auth.currentUser.email,
          createdAt: serverTimestamp(),
        }
      );

      await updateDoc(doc(db, "chatRooms", roomId), {
        lastMessage: cleanMessage,
        lastMessageSenderId: auth.currentUser.uid,
        updatedAt: serverTimestamp(),
      });

      setMessage("");
      inputRef.current?.focus?.();
    } catch (error) {
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    try {
      if (!timestamp?.toDate) return "";

      const date = timestamp.toDate();

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const renderMessage = ({ item }) => {
    const isMe =
      item.senderId === auth.currentUser?.uid;

    return (
      <View
        style={[
          styles.messageWrapper,
          {
            alignItems: isMe
              ? "flex-end"
              : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isMe
                ? "#2563EB"
                : "#FFFFFF",

              borderTopRightRadius: isMe
                ? 6
                : 20,

              borderTopLeftRadius: isMe
                ? 20
                : 6,

              borderWidth: isMe ? 0 : 1,
              borderColor: "#E5E7EB",
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              {
                color: isMe
                  ? "#FFFFFF"
                  : "#111827",
              },
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.timeText,
              {
                color: isMe
                  ? "#DBEAFE"
                  : "#94A3B8",

                textAlign: isMe
                  ? "right"
                  : "left",
              },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  if (!roomId) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={48}
          color="#2563EB"
        />

        <Text style={styles.emptyTitle}>
          No chat selected
        </Text>

        <Text style={styles.emptyText}>
          Please open a chat from your inbox.
        </Text>

        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

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
          Loading chat...
        </Text>
      </SafeAreaView>
    );
  }

  if (!roomData) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color="#EF4444"
        />

        <Text style={styles.emptyTitle}>
          Chat Not Found
        </Text>

        <Text style={styles.emptyText}>
          This chat room does not exist or may have been removed.
        </Text>

        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
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
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation?.goBack?.()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#111827"
            />
          </TouchableOpacity>

          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {(otherUserName || "U")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {otherUserName || "Chat"}
            </Text>

            <Text style={styles.headerSubtitle}>
              Task conversation
            </Text>
          </View>
        </View>

        <FlatList
          data={messages}
          inverted
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom:
              messages.length === 0
                ? 40
                : 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            <View style={styles.emptyChatBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="chatbubbles-outline"
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No messages yet
              </Text>

              <Text style={styles.emptyText}>
                Start the conversation by sending your first message.
              </Text>
            </View>
          }
        />

        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: getInputBottomPadding(),
            },
          ]}
        >
          <TextInput
            ref={inputRef}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#9CA3AF"
            editable={!sending}
            multiline
            maxLength={800}
            blurOnSubmit={false}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={sending || !message.trim()}
            activeOpacity={0.85}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  sending || !message.trim()
                    ? "#93C5FD"
                    : "#2563EB",
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator
                color="#FFFFFF"
                size="small"
              />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color="#FFFFFF"
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerAvatarText: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "900",
  },

  headerTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },

  headerSubtitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
    fontWeight: "600",
  },

  messageWrapper: {
    marginBottom: 10,
  },

  messageBubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },

  timeText: {
    marginTop: 5,
    fontSize: 11,
    fontWeight: "700",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },

  input: {
    flex: 1,
    maxHeight: 110,
    minHeight: 46,
    backgroundColor: "#F9FAFB",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    fontSize: 15,
    textAlignVertical: "top",
  },

  sendButton: {
    marginLeft: 10,
    width: 48,
    minHeight: 46,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyChatBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
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
  },

  primaryButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
};