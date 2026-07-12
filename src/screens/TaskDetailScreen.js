import AttachmentViewer from "../components/AttachmentViewer";

import {
  Image,
} from "react-native";

import React, {
  useEffect,
  useState,
} from "react";
import { calculateDistance } from "../utils/distance";
import {
  getCurrentLocation,
} from "../services/location";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from "react-native";

import {
  LinearGradient,
} from "expo-linear-gradient";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  getDoc,
} from "firebase/firestore";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function TaskDetailScreen({
  route,
  navigation,
}) {
  const initialTask = route?.params?.task;

  const [task, setTask] = useState(initialTask || null);
  const [ownerName, setOwnerName] = useState("Client");
  const [assignedName, setAssignedName] = useState("");

  const [loading, setLoading] = useState(!initialTask);
  const [processing, setProcessing] = useState(false);
  const [errorText, setErrorText] = useState("");
const [distance, setDistance] = useState(null);

const [viewerVisible, setViewerVisible] = useState(false);

const [selectedAttachment, setSelectedAttachment] = useState(null);

  useEffect(() => {
let isActive = true;

    
    if (!initialTask?.id) {
      setLoading(false);
      setErrorText("Task information is missing.");
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, "tasks", initialTask.id),
      async (docSnap) => {
        if (docSnap.exists()) {
          const freshTask = {
            id: docSnap.id,
            ...docSnap.data(),
          };
          console.log("Fresh Task:", JSON.stringify(freshTask, null, 2));
if (!isActive) return;
          setTask(freshTask);
          setErrorText("");
          setLoading(false);

          
      
        loadUserNames(freshTask);
      } else {
        setErrorText("This task no longer exists.");
        setLoading(false);
      }
    }
  );

  return () => {
    isActive = false;
    unsubscribe();
  };
}, [initialTask?.id]);


useEffect(() => {
  const loadDistance = async () => {
    try {
      if (
        !task?.location?.latitude ||
        !task?.location?.longitude
      ) {
        return;
      }

      const myLocation = await getCurrentLocation();

      const km = calculateDistance(
        myLocation.latitude,
        myLocation.longitude,
        task.location.latitude,
        task.location.longitude
      );

      setDistance(km.toFixed(1));
    } catch (error) {
      console.log("Distance Error:", error);
    }
  };

  loadDistance();
}, [
  task?.location?.latitude,
  task?.location?.longitude,
]);

  const loadUserNames = async (taskData) => {
    try {
      if (taskData?.userId) {
        const ownerSnap = await getDoc(
          doc(db, "users", taskData.userId)
        );

        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();

          setOwnerName(
            ownerData?.name ||
              getShortEmailName(ownerData?.email) ||
              "Client"
          );
        } else {
          setOwnerName(
            getShortEmailName(taskData.userEmail) ||
              "Client"
          );
        }
      }

      if (taskData?.assignedTo) {
        const workerSnap = await getDoc(
          doc(db, "users", taskData.assignedTo)
        );

        if (workerSnap.exists()) {
          const workerData = workerSnap.data();

          setAssignedName(
            workerData?.name ||
              getShortEmailName(workerData?.email) ||
              taskData.assignedEmail ||
              "Worker"
          );
        } else {
          setAssignedName(
            getShortEmailName(taskData.assignedEmail) ||
              "Worker"
          );
        }
      }
    } catch (error) {
      console.log("User name load error:", error.message);
    }
  };

  const getShortEmailName = (email) => {
    if (!email) return "";

    return email.split("@")[0];
  };

  const getStatusMeta = () => {
    const status = task?.status || "open";

    if (status === "completed") {
      return {
        label: "Completed",
        icon: "checkmark-circle",
        backgroundColor: "#DCFCE7",
        color: "#166534",
        description:
          task?.rated
            ? "This task has been completed and reviewed."
            : "This task is completed and waiting for review.",
      };
    }

    if (status === "in progress") {
      return {
        label: "In Progress",
        icon: "construct",
        backgroundColor: "#FEF3C7",
        color: "#92400E",
        description:
          "The assigned worker has started working on this task.",
      };
    }

    if (status === "assigned") {
      return {
        label: "Assigned",
        icon: "person-circle",
        backgroundColor: "#DBEAFE",
        color: "#1D4ED8",
        description:
          "This task has been assigned to a worker.",
      };
    }

    return {
      label: "Open",
      icon: "radio-button-on",
      backgroundColor: "#F3F4F6",
      color: "#374151",
      description:
        "This task is open for applications.",
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

  const ensureChatRoom = async () => {
    if (!auth.currentUser || !task?.id) {
      alert("Chat cannot be opened right now.");
      return false;
    }

    try {
      const roomRef = doc(db, "chatRooms", task.id);

    const usersSet = new Set([
  auth.currentUser.uid,
  task.userId,
  task.assignedTo,
].filter(Boolean));

const users = Object.fromEntries(
  [...usersSet].map((id) => [id, true])
);

      await setDoc(
        roomRef,
        {
          taskId: task.id,
          taskTitle: task.title || "",
          users,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      alert(error.message);
      return false;
    }
  };

  const goToApply = () => {
    if (!task) return;

    if (!auth.currentUser) {
      alert("Please login again to apply.");
      return;
    }

    if (task.userId === auth.currentUser.uid) {
      alert("You cannot apply to your own task.");
      return;
    }

    if (
      task.status === "assigned" ||
      task.status === "in progress" ||
      task.status === "completed"
    ) {
      alert("This task is no longer open for applications.");
      return;
    }

    navigation.navigate("Apply", {
      task,
    });
  };

  const goToChat = async () => {
    const created = await ensureChatRoom();

    if (!created) return;

    const otherUserName =
      task?.userId === auth.currentUser?.uid
        ? assignedName || "Worker"
        : ownerName || "Client";

    navigation.navigate("Chat", {
      roomId: task.id,
      otherUserName,
    });
  };

  const markCompleted = async () => {
    if (!task?.id) return;

    if (!auth.currentUser) {
      alert("Please login again.");
      return;
    }

    if (task.assignedTo !== auth.currentUser.uid) {
      alert("Only the assigned worker can mark this task completed.");
      return;
    }

    if (task.status === "completed") {
      alert("This task is already completed.");
      return;
    }

    Alert.alert(
      "Mark Completed",
      "Are you sure you have completed this task?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Complete",
          onPress: async () => {
            try {
              setProcessing(true);

              await updateDoc(
                doc(db, "tasks", task.id),
                {
                  status: "completed",
                  completedAt: serverTimestamp(),
                  updatedAt: serverTimestamp(),
                }
              );

              Alert.alert(
                "Completed",
                "Task marked as completed successfully."
              );
            } catch (error) {
              Alert.alert("Error", error.message);
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };
const openPublicProfile = (userId) => {
  if (!userId) {
    alert("User profile not found");
    return;
  }

  navigation.navigate("PublicProfile", {
    userId,
  });
};
  const openApplicants = () => {
    if (!task) return;

    navigation.navigate("Applicants", {
      task,
    });
  };

  const openReview = () => {
    if (!task?.assignedTo) {
      alert("Assigned worker information is missing.");
      return;
    }

    navigation.navigate("Review", {
      workerId: task.assignedTo,
      taskId: task.id,
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <ActivityIndicator
          size="large"
          color="#2563EB"
        />

        <Text style={styles.loadingText}>
          Loading task details...
        </Text>
      </SafeAreaView>
    );
  }

  if (!task || errorText) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#F8FAFC"
        />

        <View style={styles.errorIcon}>
          <Ionicons
            name="alert-circle-outline"
            size={42}
            color="#EF4444"
          />
        </View>

        <Text style={styles.errorTitle}>
          Task Not Available
        </Text>

        <Text style={styles.errorMessage}>
          {errorText || "Task details could not be loaded."}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          style={styles.backHomeButton}
        >
          <Text style={styles.backHomeButtonText}>
            Go Back
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const statusMeta = getStatusMeta();

  const isOwner =
    task.userId === auth.currentUser?.uid;

  const isAssignedWorker =
    task.assignedTo === auth.currentUser?.uid;

  const isOpen =
    !task.status ||
    task.status === "open" ||
    task.status === "pending";

  const canApply =
    isOpen &&
    !isOwner;

  const canMarkCompleted =
    isAssignedWorker &&
    (task.status === "assigned" ||
      task.status === "in progress");

  const canReview =
    isOwner &&
    task.status === "completed" &&
    !task.rated &&
    task.assignedTo;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#2563EB"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
      >
        <LinearGradient
          colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTop}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    "rgba(255,255,255,0.18)",
                },
              ]}
            >
              <Ionicons
                name={statusMeta.icon}
                size={16}
                color="#FFFFFF"
              />

              <Text style={styles.statusBadgeText}>
                {statusMeta.label}
              </Text>
            </View>
          </View>

          <Text style={styles.heroLabel}>
            TASK DETAILS
          </Text>

          <Text style={styles.heroTitle}>
            {task.title || "Untitled Task"}
          </Text>

          <Text style={styles.heroBudget}>
            ₹ {task.budget || 0}
          </Text>

          <View style={styles.heroMetaRow}>
            <View style={styles.heroMetaItem}>
              <Ionicons
                name="folder-outline"
                size={16}
                color="#DBEAFE"
              />

              <Text style={styles.heroMetaText}>
                {task.category || "General"}
              </Text>
            </View>
<TouchableOpacity
  activeOpacity={0.8}
  onPress={() => {
    if (
      task.location?.latitude &&
      task.location?.longitude
    ) {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${task.location.latitude},${task.location.longitude}`
      );
    } else {
      Alert.alert(
        "Location",
        "Location is not available for this task."
      );
    }
  }}
  style={{
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 0.1,
  }}
>
  <Ionicons
  name="navigate-circle"
    size={69}
    color="#f8e702"
  />
  {distance && (
  <Text
    style={{
      marginTop: 6,
      color: "white",
      fontWeight: "700",
      fontSize: 16,
    }}
  >
    📍 Distance: {distance} km away
  </Text>
)}

  <View style={{ marginLeft: 8, flex: 1 }}>
    <Text
  style={{
    color: "red",
    fontSize: 14,
  }}
>
  {JSON.stringify(task.location, null, 2)}
</Text>

    {task.location?.address ? (
      <Text
        style={{
          color: "#fbfaf9",
          marginTop: 2,
        }}
      >
        {task.location.address}
      </Text>

    ) : null}
    



  </View>
</TouchableOpacity>
            <View style={styles.heroMetaItem}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color="#DBEAFE"
              />

              <Text style={styles.heroMetaText}>
                {formatDate(task.createdAt)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View
            style={[
              styles.statusInfoBox,
              {
                backgroundColor: statusMeta.backgroundColor,
              },
            ]}
          >
            <Ionicons
              name={statusMeta.icon}
              size={22}
              color={statusMeta.color}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.statusInfoTitle,
                  {
                    color: statusMeta.color,
                  },
                ]}
              >
                {statusMeta.label}
              </Text>

              <Text
                style={[
                  styles.statusInfoText,
                  {
                    color: statusMeta.color,
                  },
                ]}
              >
                {statusMeta.description}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Description
            </Text>

            <Text style={styles.description}>
              {task.description || "No description provided."}
            </Text>
          </View>
{/* Attachments */}

{task.attachments &&
task.attachments.length > 0 && (

<View
style={{
marginTop:20,
}}
>

<Text
style={{
fontSize:18,
fontWeight:"700",
marginBottom:12,
}}
>
Attachments
</Text>

{task.attachments.map((item,index)=>{

if(item.category==="image"){

return(

<TouchableOpacity
key={index}
onPress={() => {

setSelectedAttachment(item);

setViewerVisible(true);

}}
>

<Image
source={{uri:item.url}}
style={{
width:"100%",
height:220,
borderRadius:16,
marginBottom:15,
}}
resizeMode="cover"
/>

</TouchableOpacity>

);

}

return(

<TouchableOpacity
key={index}
onPress={() => {

setSelectedAttachment(item);

setViewerVisible(true);

}}
style={{
padding:15,
backgroundColor:"#F3F4F6",
borderRadius:14,
marginBottom:12,
flexDirection:"row",
alignItems:"center",
}}
>

<Ionicons
name={
item.category==="document"
? "document-text"
: item.category==="video"
? "videocam"
: item.category==="audio"
? "musical-notes"
: "image"
}
size={28}
color="#2563EB"
/>

<View
style={{
marginLeft:12,
flex:1,
}}
>

<Text
numberOfLines={1}
style={{
fontWeight:"700",
fontSize:16,
}}
>
{item.originalName}
</Text>

<Text
style={{
marginTop:4,
color:"#64748B",
}}
>
Tap to view
</Text>

</View>

<Ionicons
name="chevron-forward"
size={22}
color="#64748B"
/>

</TouchableOpacity>

);

})}

</View>

)}
<View style={styles.card}>
  <View style={styles.cardHeaderRow}>
    <Text style={styles.cardTitle}>
      Client
    </Text>

    <Text style={styles.viewProfileText}>
      View Profile
    </Text>
  </View>

  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => task.userId && openPublicProfile(task.userId)}
disabled={!task.userId}
style={{ opacity: task.userId ? 1 : 0.5 }}
    style={styles.userRow}
  >
    <View style={styles.userAvatar}>
      <Text style={styles.userAvatarText}>
        {(ownerName || task.userEmail || "C")
          .charAt(0)
          .toUpperCase()}
      </Text>
    </View>

    <View style={{ flex: 1 }}>
      <Text style={styles.userName}>
        {ownerName || "Client"}
      </Text>

      <Text
        style={styles.userEmail}
        numberOfLines={1}
      >
        {task.userEmail || "No email"}
      </Text>
    </View>

    <Ionicons
      name="chevron-forward"
      size={20}
      color="#CBD5E1"
    />
  </TouchableOpacity>
</View>

         {task.assignedTo ? (
  <View style={styles.card}>
    <View style={styles.cardHeaderRow}>
      <Text style={styles.cardTitle}>
        Assigned Worker
      </Text>

      <Text style={styles.viewProfileText}>
        View Profile
      </Text>
    </View>

    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => openPublicProfile(task.assignedTo)}
      style={styles.userRow}
    >
      <View style={styles.workerAvatar}>
        <Text style={styles.workerAvatarText}>
          {(assignedName || task.assignedEmail || "W")
            .charAt(0)
            .toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.userName}>
          {assignedName || "Worker"}
        </Text>

        <Text
          style={styles.userEmail}
          numberOfLines={1}
        >
          {task.assignedEmail || "No email"}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={20}
        color="#CBD5E1"
      />
    </TouchableOpacity>
  </View>
) : null}

          {canApply ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={goToApply}
              style={styles.buttonSpacing}
            >
              <LinearGradient
                colors={["#3B82F6", "#2563EB", "#1D4ED8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                  Apply For Task
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {isOwner && isOpen ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openApplicants}
              style={styles.buttonSpacing}
            >
              <LinearGradient
                colors={["#7C3AED", "#6D28D9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Ionicons
                  name="people"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                  View Applicants
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {!isOpen ? (
            <View style={styles.assignedNotice}>
              <Ionicons
                name="information-circle"
                size={22}
                color="#166534"
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.assignedNoticeTitle}>
                  Task Already Assigned
                </Text>

                <Text style={styles.assignedNoticeText}>
                  Assigned to:{" "}
                  {assignedName ||
                    task.assignedEmail ||
                    "Worker"}
                </Text>
              </View>
            </View>
          ) : null}

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={goToChat}
            style={styles.buttonSpacing}
          >
            <LinearGradient
              colors={["#10B981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryButton}
            >
              <Ionicons
                name="chatbubble-ellipses"
                size={20}
                color="#FFFFFF"
              />

              <Text style={styles.primaryButtonText}>
                Message {isOwner ? "Worker" : "Client"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {canMarkCompleted ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={markCompleted}
              disabled={processing}
              style={styles.buttonSpacing}
            >
              <LinearGradient
                colors={
                  processing
                    ? ["#FCD34D", "#FBBF24"]
                    : ["#F59E0B", "#D97706"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                {processing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-done"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text style={styles.primaryButtonText}>
                      Mark Task Completed
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

          {canReview ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={openReview}
              style={styles.buttonSpacing}
            >
              <LinearGradient
                colors={["#F59E0B", "#D97706"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Ionicons
                  name="star"
                  size={21}
                  color="#FFFFFF"
                />

                <Text style={styles.primaryButtonText}>
                  Rate Worker
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : null}
                </View>
      </ScrollView>

      <AttachmentViewer
        visible={viewerVisible}
        file={selectedAttachment}
        onClose={() => {
          setViewerVisible(false);
          setSelectedAttachment(null);
        }}
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
    padding: 24,
  },

  loadingText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 15,
    fontWeight: "600",
  },

  errorIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },

  errorTitle: {
    fontSize: 23,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "600",
  },

  backHomeButton: {
    marginTop: 20,
    backgroundColor: "#2563EB",
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 15,
  },

  backHomeButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
  },

  hero: {
    paddingTop: 28,
    paddingBottom: 38,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },

  statusBadgeText: {
    color: "#FFFFFF",
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "900",
  },

  heroLabel: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    marginBottom: 9,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 40,
  },

  heroBudget: {
    color: "#BBF7D0",
    fontSize: 32,
    fontWeight: "900",
    marginTop: 14,
  },

  heroMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
  },

  heroMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
  },

  heroMetaText: {
    color: "#DBEAFE",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 22,
  },

  statusInfoBox: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 20,
    marginBottom: 16,
  },

  statusInfoTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 10,
  },

  statusInfoText: {
    marginTop: 4,
    marginLeft: 10,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  cardTitle: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
  },

  description: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 25,
    fontWeight: "500",
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  userAvatarText: {
    color: "#2563EB",
    fontSize: 22,
    fontWeight: "900",
  },

  workerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 19,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  workerAvatarText: {
    color: "#166534",
    fontSize: 22,
    fontWeight: "900",
  },

  userName: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  userEmail: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },

  assignedNotice: {
    backgroundColor: "#DCFCE7",
    padding: 15,
    borderRadius: 18,
    marginBottom: 15,
    flexDirection: "row",
  },

  assignedNoticeTitle: {
    color: "#166534",
    fontSize: 15,
    fontWeight: "900",
    marginLeft: 8,
  },

  assignedNoticeText: {
    color: "#166534",
    marginTop: 4,
    marginLeft: 8,
    fontWeight: "700",
  },

  buttonSpacing: {
    marginBottom: 13,
  },

  primaryButton: {
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
  },

cardHeaderRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 12,
},

viewProfileText: {
  color: "#2563EB",
  fontSize: 12,
  fontWeight: "900",
},

};