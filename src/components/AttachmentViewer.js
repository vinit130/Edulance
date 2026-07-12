import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";


import Ionicons from "@expo/vector-icons/Ionicons";
import ImageViewing from "react-native-image-viewing";
import { VideoView, useVideoPlayer } from "expo-video";
import { Linking } from "react-native";

/* ---------------- VIDEO / AUDIO ---------------- */

function VideoPlayer({ url, audio = false, title }) {
  const player = useVideoPlayer(url ?? "");

  return (
    <View style={styles.viewerContainer}>
      {audio && (
        <>
          <Ionicons
            name="musical-notes"
            size={90}
            color="#3B82F6"
          />

          <Text style={styles.audioTitle}>
            {title}
          </Text>
        </>
      )}

      <VideoView
        player={player}
        nativeControls
        allowsFullscreen
        allowsPictureInPicture
        style={
          audio
            ? styles.audioPlayer
            : styles.videoPlayer
        }
      />
    </View>
  );
}

/* ---------------- PDF ---------------- */



const openPdf = async (url) => {
  try {
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Error", "Cannot open PDF.");
    }
  } catch (e) {
    Alert.alert("Error", "Failed to open PDF.");
    console.log(e);
  }
};


/* ---------------- MAIN ---------------- */

export default function AttachmentViewer({
  visible,
  file,
  onClose,
}) {
  if (!file) return null;

  if (file.category === "image") {
    return (
      <ImageViewing
        visible={visible}
        images={[{ uri: file.url }]}
        imageIndex={0}
        onRequestClose={onClose}
      />
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
        >
          <Ionicons
            name="close"
            size={34}
            color="#fff"
          />
        </TouchableOpacity>

        {file.category === "pdf" && (
          <View
  style={{
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  }}
>
  <Ionicons
    name="document-text"
    size={100}
    color="#2563EB"
  />

  <Text
    style={{
      color: "white",
      fontSize: 18,
      marginTop: 20,
      textAlign: "center",
    }}
  >
    {file.originalName}
  </Text>

  <TouchableOpacity
    onPress={() => openPdf(file.url)}
    style={{
      marginTop: 30,
      backgroundColor: "#2563EB",
      paddingHorizontal: 25,
      paddingVertical: 15,
      borderRadius: 12,
    }}
  >
    <Text
      style={{
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
      }}
    >
      Open PDF
    </Text>
  </TouchableOpacity>
</View>
        )}

        {file.category === "video" && (
          <VideoPlayer url={file.url} />
        )}

        {file.category === "audio" && (
          <VideoPlayer
            url={file.url}
            audio
            title={file.originalName}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  close: {
    position: "absolute",
    top: 15,
    right: 20,
    zIndex: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 10,
    borderRadius: 50,
  },

  webview: {
    flex: 1,
    backgroundColor: "#fff",
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },

  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: "#EF4444",
    fontWeight: "600",
  },

  viewerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  videoPlayer: {
    width: "100%",
    height: "100%",
  },

  audioPlayer: {
    width: "100%",
    height: 80,
  },

  audioTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 25,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});