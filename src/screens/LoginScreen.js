import React, {
  useEffect,
  useState,
} from "react";

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
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  sendPasswordResetEmail,
  signOut,
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

import {
  auth,
  db,
} from "../services/firebaseConfig";

import {
  registerForPushNotifications,
} from "../services/notifications";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
   GoogleSignin.configure({
  webClientId:
    "700394410080-vmhk8tfi7fo1cgpusb32n0plj89hkfnl.apps.googleusercontent.com",

  offlineAccess: false,

  forceCodeForRefreshToken: false,

  scopes: ["profile", "email"],
});
  }, []);

  const saveUserProfile = async (user) => {
    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        name:
          user.displayName ||
          user.email?.split("@")[0] ||
          "User",
        email: user.email || "",
        photoURL: user.photoURL || "",
        authProvider: "google",
        isVerified: false,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const validateEmail = (value) => {
    const cleanEmail = value.trim().toLowerCase();

    if (!cleanEmail) {
      return "Please enter your email address.";
    }

    if (!cleanEmail.includes("@")) {
      return "Please enter a valid email address.";
    }

    return "";
  };

  const validateForm = () => {
    const emailError = validateEmail(email);

    if (emailError) {
      Alert.alert("Email Error", emailError);
      return false;
    }

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password."
      );
      return false;
    }

    if (password.length < 6) {
      Alert.alert(
        "Invalid Password",
        "Password should be at least 6 characters."
      );
      return false;
    }

    return true;
  };

  const getFriendlyError = (code, message) => {
    if (code === "auth/invalid-email") {
      return "Please enter a valid email address.";
    }

    if (code === "auth/user-not-found") {
      return "No account found with this email.";
    }

    if (code === "auth/wrong-password") {
      return "Incorrect password. Please try again.";
    }

    if (code === "auth/invalid-credential") {
      return "Invalid email or password.";
    }

    if (code === "auth/too-many-requests") {
      return "Too many attempts. Please try again later.";
    }

    if (code === "auth/network-request-failed") {
      return "Network error. Please check your internet connection.";
    }

    return message || "Login failed. Please try again.";
  };

  const handleLogin = async () => {
    if (loading || googleLoading || resetLoading) return;

    if (!validateForm()) return;

    try {
      setLoading(true);

      const cleanEmail = email.trim().toLowerCase();

      const userCredential =
        await signInWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        await userCredential.user.reload();

if (!userCredential.user.emailVerified) {
  Alert.alert(
    "Email Not Verified",
    "Please verify your email first.\n\nCheck your inbox or spam folder."
  );

  await signOut(auth);

  return;
}

      try {
        await registerForPushNotifications(
          userCredential.user.uid
        );
      } catch (notificationError) {
        console.log(
          "Notification registration failed:",
          notificationError.message
        );
      }
    } catch (error) {
      Alert.alert(
        "Login Failed",
        getFriendlyError(error.code, error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (loading || googleLoading || resetLoading) return;

    const cleanEmail = email.trim().toLowerCase();
    const emailError = validateEmail(cleanEmail);

    if (emailError) {
      Alert.alert(
        "Email Required",
        "Enter your registered email first."
      );
      return;
    }

    try {
      setResetLoading(true);

      await sendPasswordResetEmail(auth, cleanEmail);

      Alert.alert(
        "Reset Link Sent",
        "A password reset link has been sent to your email. Check your inbox or spam folder."
      );
    } catch (error) {
      Alert.alert(
        "Reset Password Failed",
        getFriendlyError(error.code, error.message)
      );
    } finally {
      setResetLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (loading || googleLoading || resetLoading) return;

    try {
      setGoogleLoading(true);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      try {
  await GoogleSignin.signOut();
} catch (e) {}

      const userInfo = await GoogleSignin.signIn();

      const idToken =
        userInfo?.data?.idToken ||
        userInfo?.idToken;

      if (!idToken) {
        Alert.alert(
          "Google Login Failed",
          "Google ID token was not received."
        );
        return;
      }

      const credential =
        GoogleAuthProvider.credential(idToken);

      const userCredential =
        await signInWithCredential(auth, credential);

      const user = userCredential.user;

      await saveUserProfile(user);

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
        Alert.alert(
          "Google Login",
          "Google login is already in progress."
        );
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
        "Google Login Failed",
        error.message || "Something went wrong."
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const isBusy = loading || googleLoading || resetLoading;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.logoCircle}>
          <Ionicons
            name="briefcase-outline"
            size={38}
            color="#2563EB"
          />
        </View>

        <Text style={styles.title}>
          Welcome Back
        </Text>

        <Text style={styles.subtitle}>
          Login to continue your Edulance journey
        </Text>

        <View style={styles.formCard}>

<TouchableOpacity
  onPress={() => navigation.navigate("PhoneLogin")}
  disabled={isBusy}
  activeOpacity={0.85}
  style={styles.phoneButton}
>
  <Ionicons
    name="phone-portrait-outline"
    size={21}
    color="#2563EB"
  />

  <Text style={styles.phoneButtonText}>
    Login with OTP
  </Text>
</TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleGoogleLogin}
            disabled={isBusy}
            activeOpacity={0.85}
            style={styles.googleButton}
          >
            {googleLoading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons
                  name="logo-google"
                  size={21}
                  color="#EA4335"
                />

                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />

            <Text style={styles.dividerText}>
              OR
            </Text>

            <View style={styles.dividerLine} />
          </View>

          <Text style={styles.label}>
            Email Address
          </Text>

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
              editable={!isBusy}
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>
            Password
          </Text>

          <View style={styles.inputWrapper}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#64748B"
              style={styles.inputIcon}
            />

            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isBusy}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
              disabled={isBusy}
              style={styles.eyeButton}
            >
              <Ionicons
                name={
                  showPassword
                    ? "eye-off-outline"
                    : "eye-outline"
                }
                size={21}
                color="#64748B"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleForgotPassword}
            disabled={isBusy}
            activeOpacity={0.75}
            style={styles.forgotPasswordButton}
          >
            {resetLoading ? (
              <ActivityIndicator
                size="small"
                color="#2563EB"
              />
            ) : (
              <Text style={styles.forgotPasswordText}>
                Forgot Password?
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isBusy}
            activeOpacity={0.85}
            style={[
              styles.loginButton,
              {
                backgroundColor:
                  isBusy ? "#93C5FD" : "#2563EB",
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Signup")
            }
            disabled={isBusy}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.signupBold}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Secure login powered by Firebase
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

  phoneButton: {
  minHeight: 52,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#BFDBFE",
  backgroundColor: "#EFF6FF",
  justifyContent: "center",
  alignItems: "center",
  flexDirection: "row",
  marginTop: 12,
},

phoneButtonText: {
  marginLeft: 10,
  color: "#2563EB",
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

  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: -4,
    marginBottom: 16,
    paddingVertical: 4,
  },

  forgotPasswordText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },

  loginButton: {
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
  },

  signupLink: {
    marginTop: 18,
    alignItems: "center",
  },

  signupText: {
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  signupBold: {
    color: "#2563EB",
    fontWeight: "900",
  },

  footerText: {
    marginTop: 22,
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },
};