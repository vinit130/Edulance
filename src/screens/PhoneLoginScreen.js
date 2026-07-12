import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";

import nativeAuth from "@react-native-firebase/auth";
import nativeFirestore from "@react-native-firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  registerForPushNotifications,
} from "../services/notifications";

export default function PhoneLoginScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [confirmation, setConfirmation] = useState(null);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const formatPhoneNumber = () => {
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    }

    if (cleanPhone.startsWith("91") && cleanPhone.length === 12) {
      return `+${cleanPhone}`;
    }

    if (phone.startsWith("+")) {
      return phone.trim();
    }

    return "";
  };

  const sendOtp = async () => {
    const formattedPhone = formatPhoneNumber();

    if (!formattedPhone) {
      Alert.alert(
        "Invalid Number",
        "Enter a valid 10 digit Indian mobile number."
      );
      return;
    }

    try {
      setSendingOtp(true);

      const result = await nativeAuth().signInWithPhoneNumber(
        formattedPhone
      );

      setConfirmation(result);

      Alert.alert(
        "OTP Sent",
        `OTP has been sent to ${formattedPhone}`
      );
    } catch (error) {
      console.log("Send OTP Error:", error);

      Alert.alert(
        "OTP Failed",
        error.message || "Could not send OTP."
      );
    } finally {
      setSendingOtp(false);
    }
  };

 const verifyOtp = async () => {
  if (!confirmation) {
    Alert.alert(
      "OTP Required",
      "Please request OTP first."
    );
    return;
  }

  if (otp.trim().length !== 6) {
    Alert.alert(
      "Invalid OTP",
      "Please enter the 6 digit OTP."
    );
    return;
  }

  try {
    setVerifyingOtp(true);

    const userCredential =
      await confirmation.confirm(otp.trim());

    const user = userCredential.user;

    await nativeFirestore()
      .collection("users")
      .doc(user.uid)
      .set(
        {
          uid: user.uid,
          phoneNumber: user.phoneNumber,
          name: user.phoneNumber,
          email: "",
          college: "",
          skills: [],
          bio: "",
          photoURL: "",
          authProvider: "phone",
          isVerified: true,
          rating: 0,
          totalRatings: 0,
          completedTasks: 0,
          walletBalance: 0,
          createdAt:
            nativeFirestore.FieldValue.serverTimestamp(),
          updatedAt:
            nativeFirestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    try {
      await registerForPushNotifications(user.uid);
    } catch (e) {
      console.log(e);
    }

    Alert.alert(
      "Success",
      "Phone number verified successfully."
    );

  } catch (error) {
    console.log(error);

    Alert.alert(
      "Verification Failed",
      error.message
    );
  } finally {
    setVerifyingOtp(false);
  }
};
  const isBusy = sendingOtp || verifyingOtp;

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />


      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color="#111827"
        />
      </TouchableOpacity>

      <View style={styles.logoCircle}>
        <Ionicons
          name="phone-portrait-outline"
          size={38}
          color="#2563EB"
        />
      </View>

      <Text style={styles.title}>
        Login with OTP
      </Text>

      <Text style={styles.subtitle}>
        Enter your mobile number and verify with OTP
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>
          Mobile Number
        </Text>

        <View style={styles.inputWrapper}>
          <Text style={styles.countryCode}>
            +91
          </Text>

          <TextInput
            placeholder="Enter mobile number"
            placeholderTextColor="#94A3B8"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!isBusy}
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          onPress={sendOtp}
          disabled={isBusy}
          style={[
            styles.primaryButton,
            {
              backgroundColor: isBusy ? "#93C5FD" : "#2563EB",
            },
          ]}
        >
          {sendingOtp ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              Send OTP
            </Text>
          )}
        </TouchableOpacity>

        {confirmation ? (
          <>
            <Text style={styles.label}>
              Enter OTP
            </Text>

            <View style={styles.inputWrapper}>
              <Ionicons
                name="keypad-outline"
                size={20}
                color="#64748B"
                style={{ marginRight: 8 }}
              />

              <TextInput
                placeholder="6 digit OTP"
                placeholderTextColor="#94A3B8"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isBusy}
                style={styles.input}
              />
            </View>

            <TouchableOpacity
              onPress={verifyOtp}
              disabled={isBusy}
              style={[
                styles.verifyButton,
                {
                  backgroundColor: isBusy ? "#86EFAC" : "#16A34A",
                },
              ]}
            >
              {verifyingOtp ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Verify & Login
                </Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    justifyContent: "center",
  },

  backButton: {
    position: "absolute",
    top: 48,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  logoCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 8,
    marginBottom: 28,
    color: "#64748B",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
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

  countryCode: {
    color: "#111827",
    fontWeight: "900",
    marginRight: 8,
    fontSize: 15,
  },

  input: {
    flex: 1,
    color: "#111827",
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "600",
  },

  primaryButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },

  verifyButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
};