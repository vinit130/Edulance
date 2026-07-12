import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function ApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("taskOwnerId", "==", auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedApplications = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setApplications(fetchedApplications);
        setLoading(false);
      },
      (error) => {
        console.log("Applications load error:", error.message);
        alert(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const getStatusStyle = (status) => {
    if (status === "accepted") {
      return {
        label: "Accepted",
        backgroundColor: "#DCFCE7",
        color: "#166534",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
      };
    }

    return {
      label: "Pending",
      backgroundColor: "#FEF3C7",
      color: "#92400E",
    };
  };

  const handleAccept = async (application) => {
    if (!application?.id || !application?.taskId) {
      alert("Invalid application data");
      return;
    }

    Alert.alert(
      "Accept Applicant",
      `Do you want to assign this task to ${application.applicantEmail}?`,
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

              const batch = writeBatch(db);

              const taskRef = doc(db, "tasks", application.taskId);
              const applicationRef = doc(db, "applications", application.id);

              batch.update(taskRef, {
                assignedTo: application.applicantId,
                assignedEmail: application.applicantEmail,
                status: "assigned",
                assignedAt: serverTimestamp(),
              });

              batch.update(applicationRef, {
                status: "accepted",
                updatedAt: serverTimestamp(),
              });

              const sameTaskApplications = applications.filter(
                (app) =>
                  app.taskId === application.taskId &&
                  app.id !== application.id &&
                  (app.status || "pending") === "pending"
              );

              sameTaskApplications.forEach((app) => {
                const otherApplicationRef = doc(db, "applications", app.id);

                batch.update(otherApplicationRef, {
                  status: "rejected",
                  updatedAt: serverTimestamp(),
                });
              });

              await batch.commit();

              alert("Worker assigned successfully");
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

  const handleReject = async (application) => {
    if (!application?.id) {
      alert("Invalid application data");
      return;
    }

    Alert.alert(
      "Reject Application",
      `Do you want to reject ${application.applicantEmail}?`,
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

              const batch = writeBatch(db);

              const applicationRef = doc(db, "applications", application.id);

              batch.update(applicationRef, {
                status: "rejected",
                updatedAt: serverTimestamp(),
              });

              await batch.commit();

              alert("Application rejected");
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

  const renderApplication = ({ item }) => {
    const status = item.status || "pending";
    const statusStyle = getStatusStyle(status);
    const isProcessing = processingId === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.applicantEmail || "U").charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle} numberOfLines={2}>
              {item.taskTitle || "Untitled Task"}
            </Text>

            <Text style={styles.applicantEmail} numberOfLines={1}>
              {item.applicantEmail || "Unknown applicant"}
            </Text>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Proposal</Text>

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
            <Text
              style={[
                styles.statusText,
                {
                  color: statusStyle.color,
                },
              ]}
            >
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {status === "pending" && (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={() => handleAccept(item)}
              disabled={isProcessing}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isProcessing ? "#93C5FD" : "#2563EB",
                  marginRight: 10,
                },
              ]}
            >
              <Text style={styles.actionButtonText}>
                {isProcessing ? "Please wait..." : "Accept"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleReject(item)}
              disabled={isProcessing}
              style={[
                styles.actionButton,
                {
                  backgroundColor: isProcessing ? "#FCA5A5" : "#EF4444",
                },
              ]}
            >
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "accepted" && (
          <Text style={styles.successNote}>
            This worker has been assigned to the task.
          </Text>
        )}

        {status === "rejected" && (
          <Text style={styles.rejectedNote}>
            This application was rejected.
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading applications...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.subtitle}>
          Review applicants for your posted tasks
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Applications</Text>
        <Text style={styles.summaryValue}>{applications.length}</Text>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 120,
        }}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No applications yet</Text>
            <Text style={styles.emptyText}>
              When students apply to your tasks, their applications will appear here.
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
    fontWeight: "600",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
  },

  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },

  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#2563EB",
    borderRadius: 22,
    padding: 20,
  },

  summaryLabel: {
    color: "#DBEAFE",
    fontSize: 15,
    fontWeight: "700",
  },

  summaryValue: {
    color: "#FFFFFF",
    fontSize: 36,
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
    shadowRadius: 12,
    elevation: 3,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#2563EB",
  },

  taskTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },

  applicantEmail: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  infoBox: {
    marginTop: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  infoLabel: {
    color: "#374151",
    fontWeight: "900",
    marginBottom: 6,
    fontSize: 13,
  },

  proposalText: {
    color: "#475569",
    lineHeight: 22,
    fontSize: 14,
  },

  statusRow: {
    marginTop: 13,
    flexDirection: "row",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "900",
  },

  buttonRow: {
    flexDirection: "row",
    marginTop: 16,
  },

  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 15,
    alignItems: "center",
  },

  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },

  successNote: {
    marginTop: 14,
    color: "#166534",
    fontWeight: "700",
  },

  rejectedNote: {
    marginTop: 14,
    color: "#991B1B",
    fontWeight: "700",
  },

  emptyBox: {
    marginTop: 80,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 26,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 21,
    fontWeight: "900",
    color: "#111827",
  },

  emptyText: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
};