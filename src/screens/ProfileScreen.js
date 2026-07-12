import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  RefreshControl,
} from "react-native";

import {
  signOut,
} from "firebase/auth";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";
import {
  getCurrentLocation,
  getAddressFromCoordinates,
} from "../services/location";
import {
  auth,
  db,
} from "../services/firebaseConfig";

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);

  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [skills, setSkills] = useState("");
  const [bio, setBio] = useState("");

  const [averageRating, setAverageRating] = useState("0.0");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const profileCompletion = useMemo(() => {
    let completed = 0;

   if (name.trim()) completed += 1;
if (college.trim()) completed += 1;

const skillsCompleted = Array.isArray(skills)
  ? skills.length > 0
  : String(skills || "").trim().length > 0;

if (skillsCompleted) completed += 1;

if (String(bio || "").trim().length > 0) completed += 1;

    return Math.round((completed / 4) * 100);
  }, [name, college, skills, bio]);

  const skillsArray = useMemo(() => {
  if (!userData?.skills) return [];

  if (Array.isArray(userData.skills)) {
    return userData.skills;
  }

  if (typeof userData.skills === "string") {
    return userData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
}, [userData]);
  const loadUser = async () => {
    try {
      if (!auth.currentUser) {
        setErrorText("Please login again to view your profile.");
        setLoading(false);
        setRefreshing(false);
        return;
      }
const location = await getCurrentLocation();

const address = await getAddressFromCoordinates(
  location.latitude,
  location.longitude
);
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();

        setUserData(data);

        setName(
          data.name ||
            auth.currentUser.displayName ||
            getShortEmailName(auth.currentUser.email)
        );

        setCollege(data.college || "");
        if (Array.isArray(data.skills)) {
  setSkills(data.skills.join(", "));
} else {
  setSkills(
  Array.isArray(data.skills)
    ? data.skills.join(", ")
    : data.skills || ""
);
}
        setBio(data.bio || "");

        const totalRating = Number(data.rating || 0);
        const totalRatings = Number(data.totalRatings || 0);

        if (totalRatings > 0) {
          setAverageRating((totalRating / totalRatings).toFixed(1));
        } else {
          setAverageRating("0.0");
        }
      } else {
        const defaultName =
          auth.currentUser.displayName ||
          getShortEmailName(auth.currentUser.email);

        setName(defaultName);

        await setDoc(
          userRef,
          {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            name: defaultName,
            college: "",
            skills: [],
            bio: [],
            isVerified: false,
            rating: 0,
            totalRatings: 0,
            completedTasks: 0,
            walletBalance: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            location: {
  latitude: location.latitude,
  longitude: location.longitude,
  city: address.city,
  address: address.address,
},
          },
          { merge: true }
        );
      }

      setErrorText("");
    } catch (error) {
      console.log("Profile load error:", error.message);
      setErrorText(error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

useEffect(() => {
  loadUser();
  testLocation();
}, []);

const testLocation = async () => {
  try {
    const location = await getCurrentLocation();

    console.log("Latitude:", location.latitude);
    console.log("Longitude:", location.longitude);

    const address = await getAddressFromCoordinates(
      location.latitude,
      location.longitude
    );

    console.log("City:", address.city);
    console.log("Address:", address.address);
  } catch (error) {
    console.log(error.message);
  }
};

  const getShortEmailName = (email) => {
    if (!email) return "User";

    return email.split("@")[0];
  };

  const validateProfile = () => {
    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please login again to update profile.");
      return false;
    }

    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return false;
    }

    if (name.trim().length < 2) {
      Alert.alert("Invalid Name", "Name should be at least 2 characters.");
      return false;
    }

    if (!college.trim()) {
      Alert.alert("College Required", "Please enter your college name.");
      return false;
    }

 const skillsText = Array.isArray(skills)
  ? skills.join(", ")
  : String(skills || "");

if (!skillsText.trim()) {
  Alert.alert(
    "Skills Required",
    "Please enter at least one skill, like Coding, Design, Writing."
  );
  return false;
}
    return true;
  };

  const saveProfile = async () => {
    if (saving) return;

    if (!validateProfile()) return;

    try {
      const location = await getCurrentLocation();

const address = await getAddressFromCoordinates(
  location.latitude,
  location.longitude
);
      setSaving(true);

      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          location: {
  latitude: location.latitude,
  longitude: location.longitude,
  city: address.city,
  address: address.address,
},
          name: String(name || "").trim(),
          college: String(college || "").trim(),
          skills: Array.isArray(skills)
  ? skills
  : String(skills || "")
      .split(",")
      .map(item => item.trim())
      .filter(Boolean),
          bio: String(bio || "").trim(),

          isVerified: userData?.isVerified || false,
          rating: userData?.rating || 0,
          totalRatings: userData?.totalRatings || 0,
          completedTasks: userData?.completedTasks || 0,
          walletBalance: userData?.walletBalance || 0,

          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Profile Updated", "Your profile has been saved successfully.");
      await loadUser();
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUser();
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
              await signOut(auth);
            } catch (error) {
              Alert.alert("Error", error.message);
            }
          },
        },
      ]
    );
  };

  const navigateTo = (screen) => {
    navigation.navigate(screen);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
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
      </View>
    );
  }

  return (
    <SafeAreaViewWrapper>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2563EB"
              colors={["#2563EB"]}
            />
          }
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                My Profile
              </Text>

              <Text style={styles.subtitle}>
                Manage your student profile and work identity
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleRefresh}
              style={styles.refreshButton}
            >
              <Ionicons
                name="refresh"
                size={22}
                color="#2563EB"
              />
            </TouchableOpacity>
          </View>

          {errorText ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>
                Profile Error
              </Text>

              <Text style={styles.errorText}>
                {errorText}
              </Text>
            </View>
          ) : null}

          <View style={styles.profileCard}>
            <View style={styles.avatarRow}>
<View style={styles.completionBox}>
      <TouchableOpacity
  activeOpacity={0.85}
  onPress={() => navigation.navigate("EditProfile")}
  style={styles.editProfileButton}
>
  <Ionicons
    name="create-outline"
    size={18}
    color="#2563EB"
  />

  <Text style={styles.editProfileText}>
    Edit Profile
  </Text>
</TouchableOpacity>
   </View>


              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(name || userData?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {name || "User"}
                </Text>

                <Text style={styles.profileEmail} numberOfLines={1}>
                  {userData?.email || auth.currentUser?.email || ""}
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
            </View>

            <View style={styles.completionBox}>
              <View style={styles.completionTop}>
                <Text style={styles.completionText}>
                  Profile Completion
                </Text>

                <Text style={styles.completionPercent}>
                  {profileCompletion}%
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${profileCompletion}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Ionicons
                name="star"
                size={22}
                color="#F59E0B"
              />

              <Text style={styles.summaryValue}>
                {averageRating}
              </Text>

              <Text style={styles.summaryLabel}>
                Rating
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Ionicons
                name="checkmark-done-circle"
                size={22}
                color="#16A34A"
              />

              <Text style={styles.summaryValue}>
                {userData?.completedTasks || 0}
              </Text>

              <Text style={styles.summaryLabel}>
                Completed
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <Ionicons
                name="wallet"
                size={22}
                color="#2563EB"
              />

              <Text style={styles.summaryValue}>
                ₹{userData?.walletBalance || 0}
              </Text>

              <Text style={styles.summaryLabel}>
                Wallet
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Student Details
            </Text>

            <Text style={styles.label}>
              Full Name
            </Text>

            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              value={String(name || "")}
              onChangeText={setName}
              editable={!saving}
              maxLength={50}
              style={styles.input}
            />

            <Text style={styles.label}>
              College Name
            </Text>

            <TextInput
              placeholder="Enter your college name"
              placeholderTextColor="#94A3B8"
              value={String(college || "")}
              onChangeText={setCollege}
              editable={!saving}
              maxLength={80}
              style={styles.input}
            />

            <Text style={styles.label}>
              Skills
            </Text>

            <TextInput
              placeholder="React Native, Design, Writing..."
              placeholderTextColor="#94A3B8"
              value={String(skills || "")}
              onChangeText={setSkills}
              editable={!saving}
              maxLength={150}
              style={styles.input}
            />

            {skillsArray.length > 0 ? (
              <View style={styles.skillsWrap}>
                {skillsArray.slice(0, 8).map((skill) => (
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
            ) : null}

            <Text style={styles.label}>
              Bio
            </Text>

            <TextInput
              placeholder="Write a short introduction about yourself..."
              placeholderTextColor="#94A3B8"
              value={String(bio || "")}
              onChangeText={setBio}
              editable={!saving}
              multiline
              maxLength={350}
              style={[
                styles.input,
                styles.bioInput,
              ]}
            />

            <View style={styles.counterRow}>
              <Text style={styles.helperText}>
                Tell clients what you are good at
              </Text>

              <Text style={styles.counterText}>
    {String(bio || "").length}/350
</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={saveProfile}
              disabled={saving}
              style={[
                styles.saveButton,
                {
                  backgroundColor: saving
                    ? "#93C5FD"
                    : "#2563EB",
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    Save Profile
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.quickActionsCard}>
            <Text style={styles.sectionTitle}>
              Quick Actions
            </Text>

            <ActionButton
              icon="clipboard-outline"
              title="My Posted Tasks"
              subtitle="Manage tasks you created"
              color="#2563EB"
              onPress={() => navigateTo("MyPostedTasks")}
            />

            <ActionButton
              icon="briefcase-outline"
              title="My Assigned Tasks"
              subtitle="Track work assigned to you"
              color="#16A34A"
              onPress={() => navigateTo("MyTasks")}
            />

            <ActionButton
              icon="document-text-outline"
              title="My Applications"
              subtitle="Check application status"
              color="#7C3AED"
              onPress={() => navigateTo("MyApplications")}
            />
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleLogout}
            style={styles.logoutButton}
          >
            <Ionicons
              name="log-out-outline"
              size={21}
              color="#FFFFFF"
            />

            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaViewWrapper>
  );
}

function SafeAreaViewWrapper({ children }) {
  const {
    SafeAreaView,
  } = require("react-native");

  return (
    <SafeAreaView style={styles.container}>
      {children}
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  title,
  subtitle,
  color,
  onPress,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.86}
      onPress={onPress}
      style={styles.actionButton}
    >
      <View
        style={[
          styles.actionIconBox,
          {
            backgroundColor: `${color}18`,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={22}
          color={color}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.actionTitle}>
          {title}
        </Text>

        <Text style={styles.actionSubtitle}>
          {subtitle}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#CBD5E1"
      />
    </TouchableOpacity>
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

  scrollContent: {
    padding: 20,
    paddingTop: 28,
    paddingBottom: 155,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.6,
  },

  subtitle: {
    marginTop: 6,
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },

  refreshButton: {
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

  errorBox: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 15,
    borderRadius: 18,
    marginBottom: 16,
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

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  avatarText: {
    fontSize: 32,
    fontWeight: "900",
    color: "#2563EB",
  },

  profileName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  profileEmail: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  verifiedBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },

  verifiedText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "900",
  },

  completionBox: {
    marginTop: 18,
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  completionTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  completionText: {
    color: "#334155",
    fontWeight: "800",
    fontSize: 13,
  },

  completionPercent: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 13,
  },

  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 999,
  },

  summaryGrid: {
    flexDirection: "row",
    marginTop: 16,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 16,
    alignItems: "center",
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  summaryValue: {
    marginTop: 8,
    color: "#111827",
    fontSize: 20,
    fontWeight: "900",
  },

  summaryLabel: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
  },

  formCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginTop: 8,
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    color: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: "600",
  },

  bioInput: {
    height: 110,
    textAlignVertical: "top",
    lineHeight: 22,
  },

  counterRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  helperText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  counterText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },

  skillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  skillChip: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },

  skillText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },

  saveButton: {
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 8,
  },

  quickActionsCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 11,
  },

  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  actionTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },

  actionSubtitle: {
    marginTop: 2,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  logoutButton: {
    marginTop: 22,
    backgroundColor: "#EF4444",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  logoutText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
    marginLeft: 8,
  },

editProfileButton: {
  marginTop: 16,
  alignSelf: "flex-start",
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#EFF6FF",
  borderWidth: 1,
  borderColor: "#BFDBFE",
  paddingHorizontal: 12,
  paddingVertical: 9,
  borderRadius: 999,
},

editProfileText: {
  marginLeft: 6,
  color: "#2563EB",
  fontWeight: "900",
  fontSize: 13,
},

};