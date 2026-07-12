import React, { useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function ApplyScreen({ route, navigation }) {
  const { task } = route.params || {};

  const [proposal, setProposal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getShortEmailName = (email) => {
    if (!email) return "Someone";
    return email.split("@")[0];
  };

  const sendPushNotification = async ({
    expoPushToken,
    title,
    body,
    data = {},
  }) => {
    try {
      if (!expoPushToken) return;

      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Accept-Encoding": "gzip, deflate",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: expoPushToken,
            sound: "default",
            title,
            body,
            data,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.log("Push notification failed:", result);
      }
    } catch (error) {
      console.log("Push notification error:", error.message);
    }
  };

  const createInAppNotification = async ({
    receiverId,
    title,
    body,
    type,
    data = {},
  }) => {
    try {
      if (!receiverId) return;

      await addDoc(collection(db, "notifications"), {
        receiverId,
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        title,
        body,
        type,
        data,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.log("In-app notification error:", error.message);
    }
  };

  const notifyTaskOwner = async () => {
    try {
      const ownerSnap = await getDoc(
        doc(db, "users", task.userId)
      );

      const applicantName =
        getShortEmailName(auth.currentUser?.email);

      const title = "New Application";
      const body = `${applicantName} applied to your task: ${
        task?.title || "Untitled Task"
      }`;

      await createInAppNotification({
        receiverId: task.userId,
        title,
        body,
        type: "new_application",
        data: {
          taskId: task.id,
          taskTitle: task.title || "",
          applicantId: auth.currentUser.uid,
        },
      });

      if (ownerSnap.exists()) {
        const ownerData = ownerSnap.data();

        if (ownerData?.expoPushToken) {
          await sendPushNotification({
            expoPushToken: ownerData.expoPushToken,
            title,
            body,
            data: {
              type: "new_application",
              taskId: task.id,
              applicantId: auth.currentUser.uid,
            },
          });
        }
      }
    } catch (error) {
      console.log("Owner notification error:", error.message);
    }
  };

  const handleApply = async () => {
    try {
      if (!auth.currentUser) {
        alert("Please login again to apply");
        return;
      }

      if (!task?.id) {
        alert("Task information is missing");
        return;
      }

      if (
        task.status === "assigned" ||
        task.status === "in progress" ||
        task.status === "completed"
      ) {
        alert("This task is no longer available");
        navigation.goBack();
        return;
      }

      if (task.userId === auth.currentUser.uid) {
        alert("You cannot apply to your own task");
        return;
      }

      if (!proposal.trim()) {
        alert("Please write a short proposal before submitting");
        return;
      }

      if (proposal.trim().length < 20) {
        alert("Please write at least 20 characters in your proposal");
        return;
      }

      setSubmitting(true);

      const duplicateQuery = query(
        collection(db, "applications"),
        where("taskId", "==", task.id),
        where("applicantId", "==", auth.currentUser.uid)
      );

      const duplicateSnapshot = await getDocs(duplicateQuery);

      if (!duplicateSnapshot.empty) {
        alert("You have already applied for this task");
        return;
      }

      await addDoc(collection(db, "applications"), {
        taskId: task.id,
        taskTitle: task.title || "Untitled Task",
        taskOwnerId: task.userId,

        applicantId: auth.currentUser.uid,
        applicantEmail: auth.currentUser.email,

        proposal: proposal.trim(),
        status: "pending",

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await notifyTaskOwner();

      Alert.alert(
        "Application Submitted",
        "Your proposal has been sent to the task owner.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!task) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={44}
          color="#EF4444"
        />

        <Text style={styles.errorTitle}>
          Task Not Found
        </Text>

        <Text style={styles.errorText}>
          The task information was not loaded correctly.
        </Text>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backHomeButton}
        >
          <Text style={styles.backHomeButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const remainingCharacters = Math.max(
    0,
    20 - proposal.trim().length
  );

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 60,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              disabled={submitting}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#111827"
              />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Apply For Task
              </Text>

              <Text style={styles.subtitle}>
                Send a clear proposal to increase your selection chance
              </Text>
            </View>
          </View>

          <View style={styles.taskCard}>
            <Text style={styles.taskLabel}>
              Task
            </Text>

            <Text style={styles.taskTitle}>
              {task.title || "Untitled Task"}
            </Text>

            <Text style={styles.taskBudget}>
              ₹ {task.budget || 0}
            </Text>

            <Text
              style={styles.taskDescription}
              numberOfLines={4}
            >
              {task.description || "No description available"}
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.inputLabel}>
              Your Proposal
            </Text>

            <TextInput
              placeholder="Explain why you are suitable for this task..."
              placeholderTextColor="#9CA3AF"
              value={proposal}
              onChangeText={setProposal}
              multiline
              editable={!submitting}
              maxLength={600}
              style={styles.proposalInput}
            />

            <View style={styles.helperRow}>
              <Text
                style={[
                  styles.helperText,
                  {
                    color:
                      proposal.trim().length >= 20
                        ? "#16A34A"
                        : "#EF4444",
                  },
                ]}
              >
                {proposal.trim().length >= 20
                  ? "Looks good"
                  : `${remainingCharacters} more characters required`}
              </Text>

              <Text style={styles.counterText}>
                {proposal.length}/600
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleApply}
              disabled={submitting}
              style={[
                styles.submitButton,
                {
                  backgroundColor: submitting
                    ? "#93C5FD"
                    : "#2563EB",
                },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name="send"
                    size={19}
                    color="#FFFFFF"
                  />

                  <Text style={styles.submitButtonText}>
                    Submit Application
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              Tips for a strong proposal
            </Text>

            <Text style={styles.tipText}>
              • Mention your relevant skills
            </Text>

            <Text style={styles.tipText}>
              • Explain how quickly you can complete the work
            </Text>

            <Text style={styles.tipText}>
              • Keep it polite, clear, and specific
            </Text>
          </View>
        </ScrollView>
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

  errorTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#111827",
    marginTop: 12,
  },

  errorText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  backHomeButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
  },

  backHomeButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  taskLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },

  taskTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  taskBudget: {
    marginTop: 10,
    color: "#16A34A",
    fontSize: 24,
    fontWeight: "900",
  },

  taskDescription: {
    marginTop: 10,
    color: "#475569",
    lineHeight: 22,
    fontSize: 14,
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 10,
  },

  proposalInput: {
    minHeight: 170,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    color: "#111827",
    padding: 14,
    borderRadius: 16,
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
  },

  helperRow: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  helperText: {
    fontSize: 13,
    fontWeight: "700",
  },

  counterText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  submitButton: {
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
  },

  tipsCard: {
    marginTop: 18,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  tipsTitle: {
    color: "#1E3A8A",
    fontWeight: "900",
    fontSize: 15,
    marginBottom: 8,
  },

  tipText: {
    color: "#1E40AF",
    lineHeight: 23,
    fontWeight: "600",
  },
};