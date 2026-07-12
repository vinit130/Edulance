import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

import {
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

const PROJECT_ID =
  Constants?.expoConfig?.extra?.eas?.projectId ||
  Constants?.easConfig?.projectId ||
  "d3899a44-7599-4a2a-b2ff-3ab95558e5af";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const configureAndroidChannel = async () => {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#2563EB",
    sound: "default",
  });
};

export const registerForPushNotifications = async (userId) => {
  try {
    if (!userId || typeof userId !== "string") {
      console.log("Notification error: valid userId is required");
      return null;
    }

    if (!Device.isDevice) {
      console.log("Notifications work only on a physical device");
      return null;
    }

    await configureAndroidChannel();

    const permissionResult =
      await Notifications.getPermissionsAsync();

    let finalStatus = permissionResult.status;

    if (finalStatus !== "granted") {
      const requestResult =
        await Notifications.requestPermissionsAsync();

      finalStatus = requestResult.status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return null;
    }

    if (!PROJECT_ID) {
      console.log("Notification error: Expo projectId missing");
      return null;
    }

    const tokenResponse =
      await Notifications.getExpoPushTokenAsync({
        projectId: PROJECT_ID,
      });

    const expoPushToken = tokenResponse?.data;

    if (!expoPushToken) {
      console.log("Notification error: token not received");
      return null;
    }

    await setDoc(
      doc(db, "users", userId),
      {
        expoPushToken,
        notificationEnabled: true,
        notificationPlatform: Platform.OS,
        notificationUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    console.log("Expo Push Token saved:", expoPushToken);

    return expoPushToken;
  } catch (error) {
    console.log("Notification error:", error.message);
    return null;
  }
};

export const sendPushNotification = async ({
  expoPushToken,
  title,
  body,
  data = {},
}) => {
  try {
    if (!expoPushToken) {
      console.log("Push notification skipped: missing token");
      return false;
    }

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
          title: title || "Edulance",
          body: body || "You have a new update",
          data,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.log("Push notification failed:", result);
      return false;
    }

    return true;
  } catch (error) {
    console.log("Push notification error:", error.message);
    return false;
  }
};