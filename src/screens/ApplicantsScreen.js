import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  addDoc,
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

export default function ApplicantsScreen({ route, navigation }) {
  const { task } = route.params || {};
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!task?.id) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("taskId", "==", task.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setApplications(data);
        setLoading(false);
      },
      (error) => {
        console.log("Applicants load error:", error.message);
        alert(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [task?.id]);

  const getShortEmailName = (email) => {
    if (!email) return "Student";
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
      if (!receiverId || !auth.currentUser) return;

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

  const notifyApplicant = async ({
    application,
    type,
    title,
    body,
    extraData = {},
  }) => {
    try {
      if (!application?.applicantId) return;

      await createInAppNotification({
        receiverId: application.applicantId,
        title,
        body,
        type,
        data: {
          taskId: task.id,
          taskTitle: task.title || "",
          applicationId: application.id,
          ...extraData,
        },
      });

      const userSnap = await getDoc(
        doc(db, "users", application.applicantId)
      );

      if (userSnap.exists()) {
        const userData = userSnap.data();

        if (userData?.expoPushToken) {
          await sendPushNotification({
            expoPushToken: userData.expoPushToken,
            title,
            body,
            data: {
              type,
              taskId: task.id,
              applicationId: application.id,
              ...extraData,
            },
          });
        }
      }
    } catch (error) {
      console.log("Applicant notification error:", error.message);
    }
  };

  const acceptApplicant = async (application) => {
    if (!application?.id) return;

    Alert.alert(
      "Accept Applicant",
      `Accept ${application.applicantEmail}? Other pending applicants will be rejected.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setProcessingId(application.id);

              const roomId = await createOrGetChatRoom({
                user1: task.userId,
                user2: application.applicantId,
                taskId: task.id,
                taskTitle: task.title || "",
              });

              const batch = writeBatch(db);

              batch.update(doc(db, "tasks", task.id), {
                assignedTo: application.applicantId,
                assignedEmail: application.applicantEmail,
                status: "assigned",
                chatRoomId: roomId,
                assignedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              batch.update(doc(db, "applications", application.id), {
                status: "accepted",
                chatRoomId: roomId,
                updatedAt: serverTimestamp(),
              });

              const rejectedApplications = [];

              applications.forEach((app) => {
                if (
                  app.id !== application.id &&
                  (app.status || "pending") === "pending"
                ) {
                  rejectedApplications.push(app);

                  batch.update(doc(db, "applications", app.id), {
                    status: "rejected",
                    updatedAt: serverTimestamp(),
                  });
                }
              });

              await batch.commit();

              await notifyApplicant({
                application,
                type: "application_accepted",
                title: "Application Accepted 🎉",
                body: `You have been assigned to: ${task.title || "a task"}`,
                extraData: {
                  roomId,
                },
              });

              await Promise.all(
                rejectedApplications.map((app) =>
                  notifyApplicant({
                    application: app,
                    type: "application_rejected",
                    title: "Application Update",
                    body: `Your application was not selected for: ${
                      task.title || "a task"
                    }`,
                  })
                )
              );

              Alert.alert(
                "Applicant Accepted",
                "Worker assigned successfully. You can now start chatting.",
                [
                  {
                    text: "Open Chat",
                    onPress: () =>
                      navigation.navigate("Chat", {
                        roomId,
                        otherUserName:
                          getShortEmailName(application.applicantEmail),
                        otherUserId: application.applicantId,
                      }),
                  },
                  {
                    text: "OK",
                  },
                ]
              );
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const rejectApplicant = async (application) => {
    if (!application?.id) return;

    Alert.alert(
      "Reject Applicant",
      `Reject ${application.applicantEmail}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              setProcessingId(application.id);

              await updateDoc(doc(db, "applications", application.id), {
                status: "rejected",
                updatedAt: serverTimestamp(),
              });

              await notifyApplicant({
                application,
                type: "application_rejected",
                title: "Application Rejected",
                body: `Your application was not selected for: ${
                  task.title || "a task"
                }`,
              });

              alert("Applicant rejected");
            } catch (error) {
              alert(error.message);
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const openApplicantProfile = (application) => {
    if (!application?.applicantId) {
      alert("Applicant profile not found");
      return;
    }

    navigation.navigate("PublicProfile", {
      userId: application.applicantId,
    });
  };

  const getStatusStyle = (status) => {
    if (status === "accepted") {
      return {
        backgroundColor: "#DCFCE7",
        color: "#166534",
        text: "Accepted",
        icon: "checkmark-circle",
      };
    }

    if (status === "rejected") {
      return {
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        text: "Rejected",
        icon: "close-circle",
      };
    }

    return {
      backgroundColor: "#FEF3C7",
      color: "#92400E",
      text: "Pending",
      icon: "time",
    };
  };

  const renderApplicant = ({ item }) => {
    const status = item.status || "pending";
    const statusStyle = getStatusStyle(status);
    const isProcessing = processingId === item.id;
    const taskAlreadyAssigned =
      task?.status === "assigned" ||
      task?.status === "in progress" ||
      task?.status === "completed";

    return (
      <View style={styles.card}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openApplicantProfile(item)}
          style={styles.cardHeader}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.applicantEmail || "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.emailText} numberOfLines={1}>
              {getShortEmailName(item.applicantEmail)}
            </Text>

            <Text style={styles.subText} numberOfLines={1}>
              {item.applicantEmail || "Unknown Applicant"}
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#CBD5E1"
          />
        </TouchableOpacity>

        <View style={styles.proposalBox}>
          <Text style={styles.proposalLabel}>Proposal</Text>

          <Text style={styles.proposalText}>
            {item.proposal?.trim() || "No proposal submitted"}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusStyle.backgroundColor,
              },
            ]}
          >
            <Ionicons
              name={statusStyle.icon}
              size={15}
              color={statusStyle.color}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
            >
              {statusStyle.text}
            </Text>
          </View>
        </View>

        {status === "pending" && !taskAlreadyAssigned && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => acceptApplicant(item)}
              disabled={isProcessing}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isProcessing ? "#86EFAC" : "#16A34A",
                  marginRight: 10,
                },
              ]}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing ? "Please wait..." : "Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => rejectApplicant(item)}
              disabled={isProcessing}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isProcessing ? "#FCA5A5" : "#DC2626",
                },
              ]}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {taskAlreadyAssigned && status === "pending" && (
          <Text style={styles.lockedText}>
            This task is already assigned.
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={styles.centerContainer}
        edges={["top", "bottom"]}
      >
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading applicants...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation?.goBack?.()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#111827"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Applicants</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {task?.title || "Task"}
          </Text>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Total Applications</Text>
        <Text style={styles.summaryCount}>{applications.length}</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplicant}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 145,
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="people-outline"
              size={42}
              color="#2563EB"
            />

            <Text style={styles.emptyTitle}>No applicants yet</Text>

            <Text style={styles.emptyText}>
              Applications for this task will appear here.
            </Text>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
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
    marginTop: 3,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#2563EB",
  },

  summaryTitle: {
    color: "#DBEAFE",
    fontWeight: "700",
    fontSize: 15,
  },

  summaryCount: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#2563EB",
    fontSize: 20,
    fontWeight: "900",
  },

  emailText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  subText: {
    marginTop: 3,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600",
  },

  proposalBox: {
    marginTop: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  proposalLabel: {
    color: "#374151",
    fontWeight: "900",
    marginBottom: 6,
  },

  proposalText: {
    color: "#475569",
    lineHeight: 22,
    fontSize: 14,
    fontWeight: "600",
  },

  statusRow: {
    marginTop: 12,
    flexDirection: "row",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },

  statusText: {
    fontWeight: "900",
    fontSize: 13,
    marginLeft: 5,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 16,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  lockedText: {
    marginTop: 14,
    color: "#64748B",
    fontWeight: "700",
  },

  emptyBox: {
    marginTop: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginTop: 12,
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },
};