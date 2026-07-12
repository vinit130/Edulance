import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

import {
  createOrGetChatRoom,
} from "../utils/chatService";

export default function PublicProfileScreen({
  route,
  navigation,
}) {
  const userId =
    route?.params?.userId ||
    route?.params?.workerId ||
    route?.params?.ownerId;

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      if (!userId) {
        setErrorText("User information is missing.");
        setLoading(false);
        return;
      }

      const userSnap = await getDoc(
        doc(db, "users", userId)
      );

      if (!userSnap.exists()) {
        setErrorText("This user profile was not found.");
        setLoading(false);
        return;
      }

      setUserData({
        uid: userSnap.id,
        ...userSnap.data(),
      });

      setErrorText("");
    } catch (error) {
      console.log("Public profile load error:", error.message);
      setErrorText(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getShortEmailName = (email) => {
    if (!email) return "User";
    return email.split("@")[0];
  };

  const displayName =
    userData?.name ||
    getShortEmailName(userData?.email);

  const averageRating = useMemo(() => {
    const rating = Number(userData?.rating || 0);
    const totalRatings = Number(userData?.totalRatings || 0);

    if (totalRatings <= 0) return "0.0";

    return (rating / totalRatings).toFixed(1);
  }, [userData]);

  const skillsArray = useMemo(() => {
  if (!userData?.skills) return [];

  if (Array.isArray(userData.skills)) {
    return userData.skills;
  }

  if (typeof userData.skills === "string") {
    return userData.skills
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);
  }

  return [];
}, [userData]);

  const openChat = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Login Required", "Please login again.");
        return;
      }

      if (!userId) {
        Alert.alert("Missing User", "User id is missing.");
        return;
      }

      if (userId === auth.currentUser.uid) {
        Alert.alert("This is You", "You cannot message yourself.");
        return;
      }

      setMessageLoading(true);

      const roomId = await createOrGetChatRoom({
        user1: auth.currentUser.uid,
        user2: userId,
      });

      navigation.navigate("Chat", {
        roomId,
        otherUserName: displayName,
      });
    } catch (error) {
      Alert.alert("Chat Error", error.message);
    } finally {
      setMessageLoading(false);
    }
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
          Loading profile...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorText || !userData) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color="#EF4444"
          />
        </View>

        <Text style={styles.errorTitle}>
          Profile Not Found
        </Text>

        <Text style={styles.errorText}>
          {errorText || "Unable to load this profile."}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isMe = userId === auth.currentUser?.uid;

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color="#111827"
            />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            Public Profile
          </Text>

          <View style={{ width: 44 }} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(displayName || "U")
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <Text
            style={styles.name}
            numberOfLines={1}
          >
            {displayName}
          </Text>

          <Text
            style={styles.email}
            numberOfLines={1}
          >
            {userData.email || ""}
          </Text>

          <View
            style={[
              styles.verifiedBadge,
              {
                backgroundColor: userData?.isVerified
                  ? "#DCFCE7"
                  : "#FEF3C7",
              },
            ]}
          >
            <Ionicons
              name={
                userData?.isVerified
                  ? "shield-checkmark"
                  : "alert-circle"
              }
              size={15}
              color={
                userData?.isVerified
                  ? "#166534"
                  : "#92400E"
              }
            />

            <Text
              style={[
                styles.verifiedText,
                {
                  color: userData?.isVerified
                    ? "#166534"
                    : "#92400E",
                },
              ]}
            >
              {userData?.isVerified
                ? "Verified Student"
                : "Not Verified"}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons
              name="star"
              size={23}
              color="#F59E0B"
            />

            <Text style={styles.statValue}>
              {averageRating}
            </Text>

            <Text style={styles.statLabel}>
              Rating
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-done-circle"
              size={23}
              color="#16A34A"
            />

            <Text style={styles.statValue}>
              {userData?.completedTasks || 0}
            </Text>

            <Text style={styles.statLabel}>
              Completed
            </Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="people"
              size={23}
              color="#2563EB"
            />

            <Text style={styles.statValue}>
              {userData?.totalRatings || 0}
            </Text>

            <Text style={styles.statLabel}>
              Reviews
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Student Details
          </Text>

          <InfoRow
            icon="school-outline"
            label="College"
            value={userData?.college || "Not added"}
          />

          <InfoRow
            icon="mail-outline"
            label="Email"
            value={userData?.email || "Not added"}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Skills
          </Text>

          {skillsArray.length > 0 ? (
            <View style={styles.skillsWrap}>
              {skillsArray.map((skill) => (
                <View
                  key={skill}
                  style={styles.skillChip}
                >
                  <Text style={styles.skillText}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyInfoText}>
              No skills added yet.
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Bio
          </Text>

          <Text style={styles.bioText}>
            {userData?.bio?.trim() ||
              "This user has not added a bio yet."}
          </Text>
        </View>

        {!isMe ? (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={openChat}
            disabled={messageLoading}
            style={styles.messageButton}
          >
            {messageLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="chatbubble-ellipses"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.messageButtonText}>
                  Message {displayName}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => navigation.navigate("Profile")}
            style={styles.editButton}
          >
            <Ionicons
              name="create-outline"
              size={21}
              color="#2563EB"
            />

            <Text style={styles.editButtonText}>
              Edit My Profile
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconBox}>
        <Ionicons
          name={icon}
          size={20}
          color="#2563EB"
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text
          style={styles.infoValue}
          numberOfLines={2}
        >
          {value}
        </Text>
      </View>
    </View>
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

  scrollContent: {
    padding: 20,
    paddingBottom: 150,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
  },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  avatar: {
    width: 92,
    height: 92,
    borderRadius: 34,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  avatarText: {
    color: "#2563EB",
    fontSize: 38,
    fontWeight: "900",
  },

  name: {
    color: "#111827",
    fontSize: 25,
    fontWeight: "900",
  },

  email: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  verifiedBadge: {
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },

  verifiedText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "900",
  },

  statsRow: {
    flexDirection: "row",
    marginTop: 16,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statValue: {
    marginTop: 8,
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 13,
  },

  infoIconBox: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  infoValue: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  skillChip: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },

  skillText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },

  emptyInfoText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },

  bioText: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "600",
  },

  messageButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  messageButtonText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  editButton: {
    marginTop: 20,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  editButtonText: {
    marginLeft: 8,
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "900",
  },

  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
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