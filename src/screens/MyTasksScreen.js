import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  View,
  Text,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";

import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function MyTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");


  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [errorText, setErrorText] = useState("");

  const filters = [
    "All",
    "Assigned",
    "In Progress",
    "Completed",
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setErrorText("Please login again to view your assigned tasks.");
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("assignedTo", "==", auth.currentUser.uid),
      orderBy("assignedAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedTasks = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setTasks(fetchedTasks);
        setErrorText("");
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log("My tasks load error:", error.message);
        setErrorText(error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredTasks = useMemo(() => {
    if (selectedStatus === "All") {
      return tasks;
    }

    if (selectedStatus === "In Progress") {
      return tasks.filter(
        (task) => task.status === "in progress"
      );
    }

    return tasks.filter(
      (task) =>
        (task.status || "assigned").toLowerCase() ===
        selectedStatus.toLowerCase()
    );
  }, [tasks, selectedStatus]);

  const stats = useMemo(() => {
    const assigned = tasks.filter(
      (task) => task.status === "assigned"
    ).length;

    const inProgress = tasks.filter(
      (task) => task.status === "in progress"
    ).length;

    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    return {
      total: tasks.length,
      assigned,
      inProgress,
      completed,
    };
  }, [tasks]);

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const updateTaskStatus = async (task, newStatus) => {
    if (!task?.id) {
      alert("Task information is missing");
      return;
    }

    if (task.assignedTo !== auth.currentUser?.uid) {
      alert("Only the assigned worker can update this task");
      return;
    }

    if (task.status === "completed") {
      alert("This task is already completed");
      return;
    }

    const title =
      newStatus === "in progress"
        ? "Start Work"
        : "Mark Completed";

    const message =
      newStatus === "in progress"
        ? "Do you want to mark this task as in progress?"
        : "Are you sure you have completed this task?";

    Alert.alert(
      title,
      message,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text:
            newStatus === "in progress"
              ? "Start"
              : "Complete",
          onPress: async () => {
            try {
              setProcessingId(task.id);

              const updateData = {
                status: newStatus,
                updatedAt: serverTimestamp(),
              };

              if (newStatus === "in progress") {
                updateData.startedAt = serverTimestamp();
              }

              if (newStatus === "completed") {
                updateData.completedAt = serverTimestamp();
              }

              await updateDoc(
                doc(db, "tasks", task.id),
                updateData
              );

              alert(
                newStatus === "in progress"
                  ? "Task marked as in progress"
                  : "Task marked as completed"
              );
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

  const getStatusMeta = (status) => {
    if (status === "completed") {
      return {
        label: "Completed",
        icon: "checkmark-circle",
        backgroundColor: "#DCFCE7",
        color: "#166534",
        helper: "Waiting for client review or already reviewed.",
      };
    }

    if (status === "in progress") {
      return {
        label: "In Progress",
        icon: "construct",
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        helper: "You are currently working on this task.",
      };
    }

    return {
      label: "Assigned",
      icon: "person-circle",
      backgroundColor: "#DBEAFE",
      color: "#1D4ED8",
      helper: "Start the task when you are ready.",
    };
  };

  const formatDate = (timestamp) => {
    try {
      if (!timestamp?.toDate) return "Recently";

      const date = timestamp.toDate();

      return date.toLocaleDateString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const openTaskDetail = (task) => {
    navigation.navigate("TaskDetail", {
      task,
    });
  };

  const openChat = (task) => {
    if (!task?.id) {
      alert("Task chat room not found");
      return;
    }

    navigation.navigate("Chat", {
      roomId: task.id,
      otherUserName: task.userEmail || "Client",
    });
  };

  const renderTask = ({ item }) => {
    const status = item.status || "assigned";
    const statusMeta = getStatusMeta(status);
    const isProcessing = processingId === item.id;

    const canStart =
      status === "assigned" &&
      item.assignedTo === auth.currentUser?.uid;

    const canComplete =
      (status === "assigned" || status === "in progress") &&
      item.assignedTo === auth.currentUser?.uid;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.taskIconBox}>
            <Ionicons
              name="briefcase-outline"
              size={23}
              color="#2563EB"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.taskTitle}
              numberOfLines={2}
            >
              {item.title || "Untitled Task"}
            </Text>

            <Text style={styles.dateText}>
              Assigned on {formatDate(item.assignedAt || item.createdAt)}
            </Text>
          </View>
        </View>

        <Text
          style={styles.description}
          numberOfLines={3}
        >
          {item.description || "No description provided"}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.budgetBox}>
            <Text style={styles.budgetLabel}>
              Payment
            </Text>

            <Text style={styles.budgetValue}>
              ₹ {item.budget || 0}
            </Text>
          </View>

          <View
            style={[
              styles.statusBox,
              {
                backgroundColor: statusMeta.backgroundColor,
              },
            ]}
          >
            <Ionicons
              name={statusMeta.icon}
              size={17}
              color={statusMeta.color}
            />

            <Text
              style={[
                styles.statusText,
                {
                  color: statusMeta.color,
                },
              ]}
            >
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.statusHelper,
            {
              color: statusMeta.color,
            },
          ]}
        >
          {statusMeta.helper}
        </Text>

        {item.userEmail ? (
          <View style={styles.clientBox}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#475569"
            />

            <Text
              style={styles.clientText}
              numberOfLines={1}
            >
              Client: {item.userEmail}
            </Text>
          </View>
        ) : null}

        <View style={styles.actionRow}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openTaskDetail(item)}
            style={[
              styles.actionButton,
              {
                backgroundColor: "#EFF6FF",
                borderColor: "#BFDBFE",
              },
            ]}
          >
            <Ionicons
              name="eye-outline"
              size={18}
              color="#2563EB"
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: "#2563EB",
                },
              ]}
            >
              Details
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openChat(item)}
            style={[
              styles.actionButton,
              {
                backgroundColor: "#F0FDF4",
                borderColor: "#BBF7D0",
              },
            ]}
          >
            <Ionicons
              name="chatbubble-outline"
              size={18}
              color="#16A34A"
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: "#16A34A",
                },
              ]}
            >
              Chat
            </Text>
          </TouchableOpacity>
        </View>

        {canStart && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isProcessing}
            onPress={() => updateTaskStatus(item, "in progress")}
            style={[
              styles.primaryButton,
              {
                backgroundColor: isProcessing ? "#FCD34D" : "#F59E0B",
              },
            ]}
          >
            <Ionicons
              name="play"
              size={18}
              color="#FFFFFF"
            />

            <Text style={styles.primaryButtonText}>
              {isProcessing ? "Please wait..." : "Start Work"}
            </Text>
          </TouchableOpacity>
        )}

        {canComplete && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isProcessing}
            onPress={() => updateTaskStatus(item, "completed")}
            style={[
              styles.primaryButton,
              {
                backgroundColor: isProcessing ? "#86EFAC" : "#16A34A",
              },
            ]}
          >
            <Ionicons
              name="checkmark"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.primaryButtonText}>
              {isProcessing ? "Please wait..." : "Mark Completed"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading your assigned tasks...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
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
          <Text style={styles.title}>
            My Tasks
          </Text>

          <Text style={styles.subtitle}>
            Track assigned work and update progress
          </Text>
        </View>
      </View>

      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.total}
          </Text>

          <Text style={styles.statLabel}>
            Total
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.assigned}
          </Text>

          <Text style={styles.statLabel}>
            Assigned
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.inProgress}
          </Text>

          <Text style={styles.statLabel}>
            Progress
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.completed}
          </Text>

          <Text style={styles.statLabel}>
            Done
          </Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = selectedStatus === filter;

          return (
            <TouchableOpacity
              key={filter}
              activeOpacity={0.85}
              onPress={() => setSelectedStatus(filter)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: active ? "#2563EB" : "#FFFFFF",
                  borderColor: active ? "#2563EB" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color: active ? "#FFFFFF" : "#334155",
                  },
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {errorText ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>
            Could not load assigned tasks
          </Text>

          <Text style={styles.errorText}>
            {errorText}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        renderItem={renderTask}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2563EB"
            colors={["#2563EB"]}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 145,
        }}
        ListEmptyComponent={
          !errorText ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="briefcase-outline"
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No assigned tasks yet
              </Text>

              <Text style={styles.emptyText}>
                When a task owner accepts your application, the task will appear here.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Home")}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>
                  Browse Tasks
                </Text>
              </TouchableOpacity>
            </View>
          ) : null
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
    paddingHorizontal: 16,
    paddingTop: 22,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
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
    fontSize: 29,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  statsCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#2563EB",
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  statLabel: {
    marginTop: 4,
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "800",
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },

  filterText: {
    fontSize: 13,
    fontWeight: "900",
  },

  errorBox: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    padding: 15,
    borderRadius: 18,
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

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  taskIconBox: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  taskTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
    lineHeight: 23,
  },

  dateText: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  description: {
    marginTop: 13,
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },

  budgetBox: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 13,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },

  budgetLabel: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
  },

  budgetValue: {
    color: "#166534",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2,
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 16,
  },

  statusText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "900",
  },

  statusHelper: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 19,
  },

  clientBox: {
    marginTop: 13,
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  clientText: {
    marginLeft: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  actionRow: {
    flexDirection: "row",
    marginTop: 15,
  },

  actionButton: {
    flex: 1,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginRight: 8,
  },

  actionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "900",
  },

  primaryButton: {
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonText: {
    marginLeft: 7,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  emptyBox: {
    marginTop: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
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

  emptyButton: {
    marginTop: 18,
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 15,
  },

  emptyButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },
};