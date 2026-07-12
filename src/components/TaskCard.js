import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
} from "react-native";

import Ionicons from "@expo/vector-icons/Ionicons";

export default function TaskCard({ task, navigation }) {
  const status = task?.status || "open";

  const getStatusMeta = () => {
    if (status === "completed") {
      return {
        label: "Completed",
        color: "#166534",
        bg: "#DCFCE7",
        icon: "checkmark-circle",
      };
    }

    if (status === "in progress") {
      return {
        label: "In Progress",
        color: "#92400E",
        bg: "#FEF3C7",
        icon: "construct",
      };
    }

    if (status === "assigned") {
      return {
        label: "Assigned",
        color: "#1D4ED8",
        bg: "#DBEAFE",
        icon: "person-circle",
      };
    }

    return {
      label: "Open",
      color: "#15803D",
      bg: "#DCFCE7",
      icon: "radio-button-on",
    };
  };

  const getDisplayName = () => {
    if (task?.userName?.trim()) return task.userName.trim();
    if (task?.postedByName?.trim()) return task.postedByName.trim();
    if (task?.ownerName?.trim()) return task.ownerName.trim();
    if (task?.userEmail) return task.userEmail.split("@")[0];

    return "Client";
  };

  const openTaskDetail = () => {
    navigation.navigate("TaskDetail", {
      task,
    });
  };

  const openPublicProfile = () => {
    if (!task?.userId) {
      alert("User profile not found");
      return;
    }

    navigation.navigate("PublicProfile", {
      userId: task.userId,
    });
  };

  const statusMeta = getStatusMeta();
  const displayName = getDisplayName();

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={openTaskDetail}
      style={styles.wrapper}
    >
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.categoryBadge}>
            <Ionicons
              name="folder-outline"
              size={14}
              color="#2563EB"
            />

            <Text
              style={styles.categoryText}
              numberOfLines={1}
            >
              {task?.category || "General"}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusMeta.bg,
              },
            ]}
          >
            <Ionicons
              name={statusMeta.icon}
              size={14}
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
          style={styles.title}
          numberOfLines={2}
        >
          {task?.title || "Untitled Task"}
        </Text>

        <Text
          style={styles.description}
          numberOfLines={2}
        >
          {task?.description || "No description provided"}
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.budgetBox}>
            <View style={styles.infoHeaderRow}>
              <Ionicons
                name="wallet-outline"
                size={15}
                color="#166534"
              />

              <Text style={styles.budgetLabel}>
                Budget
              </Text>
            </View>

            <Text style={styles.budgetText}>
              ₹ {task?.budget || 0}
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={openPublicProfile}
            style={styles.clientBox}
          >
            <View style={styles.infoHeaderRow}>
              <Ionicons
                name="person-circle-outline"
                size={15}
                color="#64748B"
              />

              <Text style={styles.infoLabel}>
                Posted By
              </Text>

              <Ionicons
                name="chevron-forward"
                size={14}
                color="#94A3B8"
                style={{ marginLeft: "auto" }}
              />
            </View>

            <View style={styles.personRow}>
              <View style={styles.smallAvatar}>
                <Text style={styles.smallAvatarText}>
                  {(displayName || "C")
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <Text
                style={styles.clientText}
                numberOfLines={1}
              >
                {displayName}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#64748B"
            />

            <Text style={styles.footerText}>
              Tap card to view full details
            </Text>
          </View>

          <View style={styles.viewButton}>
            <Text style={styles.viewButtonText}>
              View
            </Text>

            <Ionicons
              name="arrow-forward"
              size={15}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = {
  wrapper: {
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 6,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  categoryBadge: {
    maxWidth: "55%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
  },

  categoryText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 5,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
  },

  statusText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: "900",
  },

  title: {
    color: "#0F172A",
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 28,
    marginBottom: 9,
  },

  description: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 15,
  },

  infoRow: {
    flexDirection: "row",
    marginBottom: 15,
  },

  budgetBox: {
    flex: 1,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 18,
    padding: 13,
    marginRight: 10,
    minHeight: 84,
  },

  clientBox: {
    flex: 1.15,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 13,
    minHeight: 84,
  },

  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 7,
  },

  infoLabel: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  budgetLabel: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 5,
  },

  budgetText: {
    color: "#166534",
    fontSize: 20,
    fontWeight: "900",
  },

  personRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  smallAvatar: {
    width: 26,
    height: 26,
    borderRadius: 10,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 7,
  },

  smallAvatarText: {
    color: "#2563EB",
    fontSize: 12,
    fontWeight: "900",
  },

  clientText: {
    flex: 1,
    color: "#334155",
    fontSize: 14,
    fontWeight: "900",
  },

  footer: {
    borderTopWidth: 1,
    borderColor: "#E2E8F0",
    paddingTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  footerText: {
    marginLeft: 6,
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  viewButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },

  viewButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    marginRight: 5,
  },
};