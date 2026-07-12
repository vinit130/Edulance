import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
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
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function MessageScreen() {
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [userNames, setUserNames] = useState({});
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState("");

  const inputRef = useRef(null);
  const userNamesRef = useRef({});

  useEffect(() => {
    userNamesRef.current = userNames;
  }, [userNames]);

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

  const getShortEmailName = (email) => {
    if (!email) return "";
    return email.split("@")[0];
  };

  const loadMissingUserNames = useCallback(async (fetchedMessages) => {
    const uniqueUserIds = [
      ...new Set(
        fetchedMessages
          .map((msg) => msg.senderId)
          .filter(Boolean)
      ),
    ];

    const missingUserIds = uniqueUserIds.filter(
      (uid) => !userNamesRef.current[uid]
    );

    if (missingUserIds.length === 0) return;

    const fetchedNames = {};

    await Promise.all(
      missingUserIds.map(async (uid) => {
        try {
          const userSnap = await getDoc(doc(db, "users", uid));

          if (userSnap.exists()) {
            const data = userSnap.data();

            fetchedNames[uid] =
              data?.name ||
              getShortEmailName(data?.email) ||
              "User";
          } else {
            fetchedNames[uid] = "User";
          }
        } catch {
          fetchedNames[uid] = "User";
        }
      })
    );

    setUserNames((prev) => ({
      ...prev,
      ...fetchedNames,
    }));
  }, []);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setErrorText("Please login again to view messages.");
      return;
    }

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const fetchedMessages = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          setMessages(fetchedMessages);
          setErrorText("");
          setLoading(false);

          await loadMissingUserNames(fetchedMessages);
        } catch (error) {
          console.log("Messages processing error:", error.message);
          setErrorText(error.message);
          setLoading(false);
        }
      },
      (error) => {
        console.log("Messages load error:", error.message);
        setErrorText(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [loadMissingUserNames]);

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage) return;

    if (!auth.currentUser) {
      alert("Please login again to send a message");
      return;
    }

    try {
      setSending(true);

      await addDoc(collection(db, "messages"), {
        text: cleanMessage,
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        senderName:
          userNames[auth.currentUser.uid] ||
          getShortEmailName(auth.currentUser.email) ||
          "Me",
        createdAt: serverTimestamp(),
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

  const getDisplayName = (item) => {
    if (item.senderId === auth.currentUser?.uid) {
      return "You";
    }

    return (
      userNames[item.senderId] ||
      item.senderName ||
      getShortEmailName(item.senderEmail) ||
      "User"
    );
  };

  const getInputBottomPadding = () => {
    if (Platform.OS === "ios") {
      return keyboardVisible ? 8 : insets.bottom + 8;
    }

    return keyboardVisible
      ? 4
      : Math.max(insets.bottom, 28);
  };

  const renderMessage = ({ item }) => {
    const isMe = item.senderId === auth.currentUser?.uid;

    return (
      <View
        style={[
          styles.messageRow,
          {
            alignItems: isMe ? "flex-end" : "flex-start",
          },
        ]}
      >
        <View
          style={[
            styles.bubble,
            {
              backgroundColor: isMe ? "#2563EB" : "#FFFFFF",
              borderTopRightRadius: isMe ? 6 : 20,
              borderTopLeftRadius: isMe ? 20 : 6,
              borderWidth: isMe ? 0 : 1,
              borderColor: "#E5E7EB",
            },
          ]}
        >
          {!isMe && (
            <Text
              style={styles.senderName}
              numberOfLines={1}
            >
              {getDisplayName(item)}
            </Text>
          )}

          <Text
            style={[
              styles.messageText,
              {
                color: isMe ? "#FFFFFF" : "#111827",
              },
            ]}
          >
            {item.text}
          </Text>

          <Text
            style={[
              styles.timeText,
              {
                color: isMe ? "#DBEAFE" : "#94A3B8",
                textAlign: isMe ? "right" : "left",
              },
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
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
          Loading messages...
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
        backgroundColor="#FFFFFF"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={24}
              color="#2563EB"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>
              Community Chat
            </Text>

            <Text style={styles.headerSubtitle}>
              General discussion with students
            </Text>
          </View>
        </View>

        {errorText ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>
              Could not load messages
            </Text>

            <Text style={styles.errorText}>
              {errorText}
            </Text>
          </View>
        ) : null}

        <FlatList
          data={messages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: messages.length === 0 ? 40 : 16,
            flexGrow: 1,
          }}
          ListEmptyComponent={
            !errorText ? (
              <View style={styles.emptyBox}>
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
                  Start the community conversation by sending the first message.
                </Text>
              </View>
            ) : null
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
            placeholder="Type message..."
            placeholderTextColor="#94A3B8"
            value={message}
            onChangeText={setMessage}
            editable={!sending}
            multiline
            maxLength={600}
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
                size="small"
                color="#FFFFFF"
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
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  headerSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  errorBox: {
    margin: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 18,
    padding: 15,
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

  messageRow: {
    marginBottom: 10,
  },

  bubble: {
    maxWidth: "82%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },

  senderName: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 5,
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
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 10,
    paddingTop: 10,
  },

  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    fontSize: 15,
    textAlignVertical: "top",
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 18,
    marginLeft: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyBox: {
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
    fontWeight: "600",
  },
};