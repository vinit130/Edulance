import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendEmailVerification,
} from "firebase/auth";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import Ionicons from "@expo/vector-icons/Ionicons";

import { auth, db } from "../services/firebaseConfig";

import { registerForPushNotifications } from "../services/notifications";

export default function SignupScreen({ navigation }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "700394410080-vmhk8tfi7fo1cgpusb32n0plj89hkfnl.apps.googleusercontent.com",
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
  }, []);

  const saveUserProfile = async ({
    uid,
    name,
    email,
    college = "",
    photoURL = "",
    authProvider = "email",
  }) => {
    await setDoc(
      doc(db, "users", uid),
      {
        uid,
        name: name || email?.split("@")[0] || "User",
        email: email || "",
        college,
        skills: "",
        bio: "",
        photoURL,
        authProvider,
        isVerified: false,
        rating: 0,
        totalRatings: 0,
        completedTasks: 0,
        walletBalance: 0,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const getFriendlyError = (code, message) => {
    if (code === "auth/email-already-in-use") {
      return "This email is already registered. Please login instead.";
    }

    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (code === "auth/weak-password") {
      return "Password is too weak. Please use at least 6 characters.";
    }

    if (code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection.";
    }

    return message || "Signup failed. Please try again.";
  };

  const validateForm = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanCollege = college.trim();

    if (!cleanName) {
      Alert.alert("Name Required", "Please enter your full name.");
      return false;
    }

    if (cleanName.length < 2) {
      Alert.alert("Invalid Name", "Name should be at least 2 characters.");
      return false;
    }

    if (!cleanEmail) {
      Alert.alert("Email Required", "Please enter your email address.");
      return false;
    }

    if (!cleanEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return false;
    }

    if (!cleanCollege) {
      Alert.alert("College Required", "Please enter your college name.");
      return false;
    }

    if (!password) {
      Alert.alert("Password Required", "Please create a password.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak Password",
        "Password should be at least 6 characters long."
      );
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        "Password Mismatch",
        "Password and confirm password do not match."
      );
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (loading || googleLoading) return;
    if (!validateForm()) return;

    try {
      setLoading(true);

      const cleanName = name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const cleanCollege = college.trim();

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const user = userCredential.user;
await sendEmailVerification(user);
      await saveUserProfile({
        uid: user.uid,
        name: cleanName,
        email: cleanEmail,
        college: cleanCollege,
        photoURL: "",
        authProvider: "email",
      });

      try {
        await registerForPushNotifications(user.uid);
      } catch (notificationError) {
        console.log(
          "Notification registration failed:",
          notificationError.message
        );
      }

    Alert.alert(
  "Verify your Email",
  "Your account has been created successfully.\n\nA verification email has been sent to your inbox.\n\nPlease verify your email before logging in."
);
    } catch (error) {
      Alert.alert(
        "Signup Failed",
        getFriendlyError(error.code, error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (loading || googleLoading) return;

    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      await GoogleSignin.signOut();

      const userInfo = await GoogleSignin.signIn();

      const idToken = userInfo?.data?.idToken || userInfo?.idToken;

      if (!idToken) {
        Alert.alert(
          "Google Signup Failed",
          "Google ID token was not received."
        );
        return;
      }

      const credential = GoogleAuthProvider.credential(idToken);

      const userCredential = await signInWithCredential(auth, credential);

      const user = userCredential.user;

      await saveUserProfile({
        uid: user.uid,
        name: user.displayName || user.email?.split("@")[0] || "User",
        email: user.email || "",
        college: "",
        photoURL: user.photoURL || "",
        authProvider: "google",
      });

      try {
        await registerForPushNotifications(user.uid);
      } catch (notificationError) {
        console.log(
          "Notification registration failed:",
          notificationError.message
        );
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("Google Signup", "Google signup is already in progress.");
        return;
      }

      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          "Google Play Services",
          "Google Play Services is not available or outdated."
        );
        return;
      }

      Alert.alert(
        "Google Signup Failed",
        error.message || "Something went wrong."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoCircle}>
          <Ionicons name="briefcase-outline" size={38} color="#2563EB" />
        </View>

        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.subtitle}>
          Join Edulance and start working with students
        </Text>

        <View style={styles.formCard}>
          <TouchableOpacity
            onPress={handleGoogleSignup}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
            style={styles.googleButton}
          >
            {googleLoading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons name="logo-google" size={21} color="#EA4335" />

                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>Full Name</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="person-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!loading && !googleLoading}
              maxLength={50}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Email Address</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="mail-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !googleLoading}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>College Name</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="school-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Enter your college name"
              placeholderTextColor="#94A3B8"
              value={college}
              onChangeText={setCollege}
              autoCapitalize="words"
              editable={!loading && !googleLoading}
              maxLength={80}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>Password</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Create password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !googleLoading}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={loading || googleLoading}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Confirm password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !googleLoading}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={loading || googleLoading}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={21}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading || googleLoading}
            activeOpacity={0.85}
            style={[
              styles.signupButton,
              {
                backgroundColor:
                  loading || googleLoading ? "#93C5FD" : "#2563EB",
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.signupButtonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Login")}
            disabled={loading || googleLoading}
            style={styles.loginLink}
          >
            <Text style={styles.loginText}>
              Already have an account?{" "}
              <Text style={styles.loginBold}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          By signing up, you create a student profile on Edulance
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: -0.7,
  },

  subtitle: {
    color: "#64748B",
    fontSize: 15,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 22,
    fontWeight: "600",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 14,
    elevation: 4,
  },

  googleButton: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },

  googleButtonText: {
    marginLeft: 10,
    color: "#111827",
    fontSize: 15,
    fontWeight: "900",
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },

  dividerText: {
    marginHorizontal: 10,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "900",
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: "#334155",
    marginBottom: 8,
    marginTop: 6,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 12,
    marginBottom: 14,
  },

  inputIcon: {
    marginRight: 8,
  },

  input: {
    flex: 1,
    color: "#111827",
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },

  eyeButton: {
    paddingLeft: 8,
    paddingVertical: 8,
  },

  signupButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  loginLink: {
    marginTop: 18,
    alignItems: "center",
  },

  loginText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  loginBold: {
    color: "#2563EB",
    fontWeight: "900",
  },

  footerText: {
    marginTop: 22,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
  },
};