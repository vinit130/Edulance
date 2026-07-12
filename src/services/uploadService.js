import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { uploadFile } from "./cloudinary";

/*
====================================================
IMAGE
====================================================
*/

export async function pickImage() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Photo permission denied");
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `image_${Date.now()}.jpg`,
    type: asset.mimeType || "image/jpeg",
    size: asset.fileSize || 0,
    category: "image",
  };
}

/*
====================================================
VIDEO
====================================================
*/

export async function pickVideo() {
  const permission =
    await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Video permission denied");
  }

  const result =
    await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["videos"],
      quality: 0.8,
    });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.fileName || `video_${Date.now()}.mp4`,
    type: asset.mimeType || "video/mp4",
    size: asset.fileSize || 0,
    category: "video",
  };
}

/*
====================================================
DOCUMENT
====================================================
*/

export async function pickDocument() {

  const result =
    await DocumentPicker.getDocumentAsync({
      multiple: false,
      copyToCacheDirectory: true,
    });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.name,
    type:
      asset.mimeType ||
      "application/octet-stream",
    size: asset.size || 0,
    category: "document",
  };
}

/*
====================================================
AUDIO
====================================================
*/

export async function pickAudio() {

  const result =
    await DocumentPicker.getDocumentAsync({
      multiple: false,
      type: "audio/*",
      copyToCacheDirectory: true,
    });

  if (result.canceled) return null;

  const asset = result.assets[0];

  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType,
    size: asset.size || 0,
    category: "audio",
  };
}

/*
====================================================
UPLOAD
====================================================
*/

export async function uploadAttachment(file) {

  if (!file)
    throw new Error("No file selected");

  const uploaded =
    await uploadFile(file);

  return {

    url: uploaded.secure_url,

    publicId: uploaded.public_id,

    resourceType:
      uploaded.resource_type,

    format:
      uploaded.format,

    bytes:
      uploaded.bytes,

    originalName:
      file.name,

    category:
      file.category,

    uploadedAt:
      new Date().toISOString(),

  };
}