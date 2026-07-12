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
} from "react-native";

import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function MyPostedTasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const filters = [
    "All",
    "Open",
    "Assigned",
    "Completed",
    "Rated",
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setErrorText("Please login again to view your posted tasks.");
      return;
    }

    const q = query(
      collection(db, "tasks"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setTasks(data);
        setErrorText("");
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log("My posted tasks load error:", error.message);
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

    if (selectedStatus === "Rated") {
      return tasks.filter((task) => task.rated === true);
    }

    if (selectedStatus === "Open") {
      return tasks.filter(
        (task) =>
          !task.status ||
          task.status === "open" ||
          task.status === "pending"
      );
    }

    return tasks.filter(
      (task) =>
        (task.status || "open").toLowerCase() ===
        selectedStatus.toLowerCase()
    );
  }, [tasks, selectedStatus]);

  const stats = useMemo(() => {
    const open = tasks.filter(
      (task) =>
        !task.status ||
        task.status === "open" ||
        task.status === "pending"
    ).length;

    const assigned = tasks.filter(
      (task) => task.status === "assigned"
    ).length;

    const completed = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const unrated = tasks.filter(
      (task) => task.status === "completed" && !task.rated
    ).length;

    return {
      total: tasks.length,
      open,
      assigned,
      completed,
      unrated,
    };
  }, [tasks]);

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
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

  const getStatusMeta = (task) => {
    if (task.status === "completed") {
      return {
        label: task.rated ? "Completed & Rated" : "Completed",
        icon: task.rated ? "star" : "checkmark-circle",
        backgroundColor: task.rated ? "#FEF3C7" : "#DCFCE7",
        color: task.rated ? "#92400E" : "#166534",
      };
    }

    if (task.status === "assigned") {
      return {
        label: "Assigned",
        icon: "person-circle",
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
      };
    }

    return {
      label: "Open",
      icon: "radio-button-on",
      backgroundColor: "#F3F4F6",
      color: "#374151",
    };
  };

  const openApplicants = (task) => {
    navigation.navigate("Applicants", {
      task,
    });
  };

  const openReview = (task) => {
    if (!task.assignedTo) {
      alert("Assigned worker information is missing");
      return;
    }

    navigation.navigate("Review", {
      workerId: task.assignedTo,
      taskId: task.id,
    });
  };

  const openTaskDetail = (task) => {
    navigation.navigate("TaskDetail", {
      task,
    });
  };

  const renderTask = ({ item }) => {
    const statusMeta = getStatusMeta(item);
    const canRate = item.status === "completed" && !item.rated;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.taskIconBox}>
            <Ionicons
              name="clipboard-outline"
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
              Posted on {formatDate(item.createdAt)}
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
              Budget
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

        {item.assignedEmail ? (
          <View style={styles.assignedBox}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#475569"
            />

            <Text
              style={styles.assignedText}
              numberOfLines={1}
            >
              Assigned to: {item.assignedEmail}
            </Text>
          </View>
        ) : null}

        {canRate ? (
          <View style={styles.reviewReminder}>
            <Ionicons
              name="star-outline"
              size={20}
              color="#92400E"
            />

            <Text style={styles.reviewReminderText}>
              This task is completed. Please rate the worker.
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
            onPress={() => openApplicants(item)}
            style={[
              styles.actionButton,
              {
                backgroundColor: "#2563EB",
                borderColor: "#2563EB",
              },
            ]}
          >
            <Ionicons
              name="people-outline"
              size={18}
              color="#FFFFFF"
            />

            <Text
              style={[
                styles.actionText,
                {
                  color: "#FFFFFF",
                },
              ]}
            >
              Applicants
            </Text>
          </TouchableOpacity>
        </View>

        {canRate && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openReview(item)}
            style={styles.rateButton}
          >
            <Ionicons
              name="star"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.rateButtonText}>
              Rate Worker
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
          Loading your posted tasks...
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
            My Posted Tasks
          </Text>

          <Text style={styles.subtitle}>
            Manage tasks you created and review workers
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
            {stats.open}
          </Text>

          <Text style={styles.statLabel}>
            Open
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
            {stats.unrated}
          </Text>

          <Text style={styles.statLabel}>
            To Rate
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
            Could not load posted tasks
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
                  name="clipboard-outline"
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No posted tasks found
              </Text>

              <Text style={styles.emptyText}>
                Post a task and it will appear here for management.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigation.navigate("Post")}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>
                  Post New Task
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

  assignedBox: {
    marginTop: 13,
    backgroundColor: "#F9FAFB",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
  },

  assignedText: {
    marginLeft: 8,
    color: "#475569",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  reviewReminder: {
    marginTop: 13,
    backgroundColor: "#FEF3C7",
    borderRadius: 15,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  reviewReminderText: {
    marginLeft: 8,
    color: "#92400E",
    fontSize: 13,
    fontWeight: "800",
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

  rateButton: {
    marginTop: 12,
    backgroundColor: "#F59E0B",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  rateButtonText: {
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