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
  ActivityIndicator,
  TouchableOpacity,
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

export default function MyApplicationsScreen({ navigation }) {
  const [applications, setApplications] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorText, setErrorText] = useState("");

  const filters = [
    "All",
    "Pending",
    "Accepted",
    "Rejected",
  ];

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setErrorText("Please login again to view your applications.");
      return;
    }

    const q = query(
      collection(db, "applications"),
      where("applicantId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setApplications(data);
        setErrorText("");
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.log("My applications load error:", error.message);
        setErrorText(error.message);
        setLoading(false);
        setRefreshing(false);
      }
    );

    return unsubscribe;
  }, []);

  const filteredApplications = useMemo(() => {
    if (selectedStatus === "All") {
      return applications;
    }

    return applications.filter(
      (app) =>
        (app.status || "pending").toLowerCase() ===
        selectedStatus.toLowerCase()
    );
  }, [applications, selectedStatus]);

  const stats = useMemo(() => {
    const pending = applications.filter(
      (app) => (app.status || "pending") === "pending"
    ).length;

    const accepted = applications.filter(
      (app) => app.status === "accepted"
    ).length;

    const rejected = applications.filter(
      (app) => app.status === "rejected"
    ).length;

    return {
      total: applications.length,
      pending,
      accepted,
      rejected,
    };
  }, [applications]);

  const handleRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 700);
  };

  const getStatusMeta = (status) => {
    if (status === "accepted") {
      return {
        label: "Accepted",
        icon: "checkmark-circle",
        backgroundColor: "#DCFCE7",
        color: "#166534",
        message: "Great! The task owner selected you for this task.",
      };
    }

    if (status === "rejected") {
      return {
        label: "Rejected",
        icon: "close-circle",
        backgroundColor: "#FEE2E2",
        color: "#991B1B",
        message: "This application was not selected.",
      };
    }

    return {
      label: "Pending",
      icon: "time",
      backgroundColor: "#FEF3C7",
      color: "#92400E",
      message: "Waiting for the task owner to review your proposal.",
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

  const renderApplication = ({ item }) => {
    const status = item.status || "pending";
    const statusMeta = getStatusMeta(status);

    return (
      <View style={styles.card}>
        <View style={styles.cardTopRow}>
          <View style={styles.taskIconBox}>
            <Ionicons
              name="document-text-outline"
              size={23}
              color="#2563EB"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.taskTitle}
              numberOfLines={2}
            >
              {item.taskTitle || "Untitled Task"}
            </Text>

            <Text style={styles.dateText}>
              Applied on {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.proposalBox}>
          <Text style={styles.proposalLabel}>
            Your Proposal
          </Text>

          <Text
            style={styles.proposalText}
            numberOfLines={4}
          >
            {item.proposal?.trim() || "No proposal submitted"}
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
          <View style={styles.statusTop}>
            <Ionicons
              name={statusMeta.icon}
              size={19}
              color={statusMeta.color}
            />

            <Text
              style={[
                styles.statusLabel,
                {
                  color: statusMeta.color,
                },
              ]}
            >
              {statusMeta.label}
            </Text>
          </View>

          <Text
            style={[
              styles.statusMessage,
              {
                color: statusMeta.color,
              },
            ]}
          >
            {statusMeta.message}
          </Text>
        </View>

        {status === "accepted" && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("TaskDetail", {
                task: {
                  id: item.taskId,
                  title: item.taskTitle,
                  userId: item.taskOwnerId,
                  status: "assigned",
                },
              })
            }
            style={styles.viewTaskButton}
          >
            <Text style={styles.viewTaskButtonText}>
              View Assigned Task
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color="#FFFFFF"
            />
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
          Loading your applications...
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
            My Applications
          </Text>

          <Text style={styles.subtitle}>
            Track all tasks you have applied for
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
            {stats.pending}
          </Text>

          <Text style={styles.statLabel}>
            Pending
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.accepted}
          </Text>

          <Text style={styles.statLabel}>
            Accepted
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.rejected}
          </Text>

          <Text style={styles.statLabel}>
            Rejected
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
            Could not load applications
          </Text>

          <Text style={styles.errorText}>
            {errorText}
          </Text>
        </View>
      ) : null}

      <FlatList
        data={filteredApplications}
        keyExtractor={(item) => item.id}
        renderItem={renderApplication}
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
                  name="file-tray-outline"
                  size={38}
                  color="#2563EB"
                />
              </View>

              <Text style={styles.emptyTitle}>
                No applications found
              </Text>

              <Text style={styles.emptyText}>
                Apply to tasks from the Home screen and your applications will appear here.
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

  cardTopRow: {
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

  proposalBox: {
    marginTop: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 13,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  proposalLabel: {
    color: "#334155",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 6,
  },

  proposalText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
  },

  statusBox: {
    marginTop: 14,
    borderRadius: 16,
    padding: 13,
  },

  statusTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusLabel: {
    marginLeft: 7,
    fontSize: 14,
    fontWeight: "900",
  },

  statusMessage: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },

  viewTaskButton: {
    marginTop: 14,
    backgroundColor: "#16A34A",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  viewTaskButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    marginRight: 8,
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