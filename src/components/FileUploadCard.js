import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

const getIcon = (type) => {
  switch (type) {
    case "image":
      return {
        icon: "image",
        color: "#3B82F6",
      };

    case "video":
      return {
        icon: "videocam",
        color: "#EF4444",
      };

    case "audio":
      return {
        icon: "musical-notes",
        color: "#8B5CF6",
      };

    case "pdf":
      return {
        icon: "document-text",
        color: "#F59E0B",
      };

    default:
      return {
        icon: "document",
        color: "#64748B",
      };
  }
};

export default function FileUploadCard({
  file,
  onRemove,
}) {
  const icon = getIcon(file.category);

  return (
    <View style={styles.card}>
      <View style={styles.leftSection}>
        {file.category === "image" && file.url ? (
          <Image
            source={{
              uri: file.url,
            }}
            style={styles.image}
          />
        ) : (
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor:
                  icon.color + "20",
              },
            ]}
          >
            <Ionicons
              name={icon.icon}
              size={28}
              color={icon.color}
            />
          </View>
        )}

        <View style={styles.info}>
          <Text
            numberOfLines={1}
            style={styles.name}
          >
            {file.originalName ||
              "Unnamed File"}
          </Text>

          <Text style={styles.type}>
            {file.category?.toUpperCase()}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onRemove}
        style={styles.removeButton}
      >
        <Ionicons
          name="trash"
          size={20}
          color="#EF4444"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    elevation: 3,
  },

  leftSection: {
    flexDirection: "row",

    alignItems: "center",

    flex: 1,
  },

  image: {
    width: 60,

    height: 60,

    borderRadius: 12,
  },

  iconContainer: {
    width: 60,

    height: 60,

    borderRadius: 12,

    justifyContent: "center",

    alignItems: "center",
  },

  info: {
    marginLeft: 14,

    flex: 1,
  },

  name: {
    fontSize: 16,

    fontWeight: "700",

    color: "#111827",
  },

  type: {
    marginTop: 5,

    color: "#6B7280",

    fontSize: 13,
  },

  removeButton: {
    padding: 10,
  },
});