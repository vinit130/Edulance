import React, {
  useEffect,
  useState,
} from "react";

import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  writeBatch,
  collection,
  query,
  where,
  getDocs,
  addDoc,
} from "firebase/firestore";

import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

export default function ReviewScreen({ route, navigation }) {
  const {
    workerId,
    taskId,
  } = route.params || {};

  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [workerData, setWorkerData] = useState(null);
  const [taskData, setTaskData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadReviewData();
  }, []);

  const loadReviewData = async () => {
    try {
      if (!auth.currentUser) {
        Alert.alert("Login Required", "Please login again.");
        navigation.goBack();
        return;
      }

      if (!workerId || !taskId) {
        Alert.alert("Missing Data", "Review information is incomplete.");
        navigation.goBack();
        return;
      }

      const workerSnap = await getDoc(
        doc(db, "users", workerId)
      );

      const taskSnap = await getDoc(
        doc(db, "tasks", taskId)
      );

      if (workerSnap.exists()) {
        setWorkerData(workerSnap.data());
      }

      if (taskSnap.exists()) {
        setTaskData({
          id: taskSnap.id,
          ...taskSnap.data(),
        });
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getShortEmailName = (email) => {
    if (!email) return "Worker";

    return email.split("@")[0];
  };

  const getRatingLabel = () => {
    if (rating === 5) return "Excellent";
    if (rating === 4) return "Very Good";
    if (rating === 3) return "Good";
    if (rating === 2) return "Needs Improvement";
    return "Poor";
  };

  const validateReview = async () => {
    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please login again.");
      return false;
    }

    if (!workerId || !taskId) {
      Alert.alert("Missing Data", "Review information is incomplete.");
      return false;
    }

    if (workerId === auth.currentUser.uid) {
      Alert.alert("Invalid Review", "You cannot rate yourself.");
      return false;
    }

    if (taskData?.userId && taskData.userId !== auth.currentUser.uid) {
      Alert.alert(
        "Not Allowed",
        "Only the task owner can rate the worker."
      );
      return false;
    }

    if (taskData?.assignedTo && taskData.assignedTo !== workerId) {
      Alert.alert(
        "Invalid Worker",
        "This worker is not assigned to this task."
      );
      return false;
    }

    if (taskData?.status !== "completed") {
      Alert.alert(
        "Task Not Completed",
        "You can rate the worker only after the task is completed."
      );
      return false;
    }

    if (taskData?.rated) {
      Alert.alert(
        "Already Rated",
        "You have already submitted a rating for this task."
      );
      return false;
    }

    const existingReviewQuery = query(
      collection(db, "reviews"),
      where("taskId", "==", taskId),
      where("reviewerId", "==", auth.currentUser.uid),
      where("workerId", "==", workerId)
    );

    const existingReviewSnap = await getDocs(existingReviewQuery);

    if (!existingReviewSnap.empty) {
      Alert.alert(
        "Already Reviewed",
        "You have already reviewed this worker for this task."
      );
      return false;
    }

    return true;
  };

  const submitReview = async () => {
    if (submitting) return;

    try {
      setSubmitting(true);

      const valid = await validateReview();

      if (!valid) {
        setSubmitting(false);
        return;
      }

      const batch = writeBatch(db);

      const workerRef = doc(db, "users", workerId);
      const taskRef = doc(db, "tasks", taskId);
      const reviewRef = doc(collection(db, "reviews"));

      batch.update(workerRef, {
        rating: increment(rating),
        totalRatings: increment(1),
        completedTasks: increment(1),
        updatedAt: serverTimestamp(),
      });

      batch.update(taskRef, {
        rated: true,
        rating,
        reviewedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      batch.set(reviewRef, {
        taskId,
        taskTitle: taskData?.title || "",
        workerId,
        workerEmail: workerData?.email || "",
        workerName:
          workerData?.name ||
          getShortEmailName(workerData?.email),

        reviewerId: auth.currentUser.uid,
        reviewerEmail: auth.currentUser.email,

        rating,
        reviewText: reviewText.trim(),
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      Alert.alert(
        "Review Submitted",
        "Thanks for rating the worker.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const workerName =
    workerData?.name ||
    getShortEmailName(workerData?.email);

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
          Loading review details...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#F8FAFC"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => navigation.goBack()}
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
                Rate Worker
              </Text>

              <Text style={styles.subtitle}>
                Share your experience after task completion
              </Text>
            </View>
          </View>

          <View style={styles.workerCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(workerName || "W")
                  .charAt(0)
                  .toUpperCase()}
              </Text>
            </View>

            <Text style={styles.workerName}>
              {workerName || "Worker"}
            </Text>

            <Text style={styles.workerEmail}>
              {workerData?.email || ""}
            </Text>

            <View style={styles.completedBadge}>
              <Ionicons
                name="checkmark-circle"
                size={17}
                color="#166534"
              />

              <Text style={styles.completedBadgeText}>
                Task Completed
              </Text>
            </View>
          </View>

          <View style={styles.taskCard}>
            <Text style={styles.cardTitle}>
              Task
            </Text>

            <Text
              style={styles.taskTitle}
              numberOfLines={2}
            >
              {taskData?.title || "Completed Task"}
            </Text>

            <Text
              style={styles.taskDescription}
              numberOfLines={3}
            >
              {taskData?.description || "No task description available"}
            </Text>
          </View>

          <View style={styles.ratingCard}>
            <Text style={styles.cardTitle}>
              Select Rating
            </Text>

            <Text style={styles.ratingLabel}>
              {getRatingLabel()}
            </Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((num) => {
                const active = num <= rating;

                return (
                  <TouchableOpacity
                    key={num}
                    activeOpacity={0.75}
                    onPress={() => setRating(num)}
                    disabled={submitting}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={active ? "star" : "star-outline"}
                      size={42}
                      color={active ? "#F59E0B" : "#CBD5E1"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.ratingHint}>
              Tap stars to rate the worker&apos;s performance
            </Text>
          </View>

          <View style={styles.reviewCard}>
            <Text style={styles.cardTitle}>
              Written Feedback
            </Text>

            <TextInput
              placeholder="Write optional feedback about quality, communication, and delivery..."
              placeholderTextColor="#94A3B8"
              value={reviewText}
              onChangeText={setReviewText}
              editable={!submitting}
              multiline
              maxLength={400}
              style={styles.reviewInput}
            />

            <View style={styles.counterRow}>
              <Text style={styles.helperText}>
                Optional but helpful
              </Text>

              <Text style={styles.counterText}>
                {reviewText.length}/400
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={submitReview}
            disabled={submitting}
            style={[
              styles.submitButton,
              {
                backgroundColor: submitting
                  ? "#93C5FD"
                  : "#2563EB",
              },
            ]}
          >
            {submitting ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.submitText}>
                  Submit Review
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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

  scrollContent: {
    padding: 20,
    paddingTop: 24,
    paddingBottom: 150,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
    fontSize: 30,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 4,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 21,
  },

  workerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 18,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 30,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  avatarText: {
    color: "#2563EB",
    fontSize: 34,
    fontWeight: "900",
  },

  workerName: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  workerEmail: {
    marginTop: 5,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
  },

  completedBadge: {
    marginTop: 13,
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
  },

  completedBadgeText: {
    marginLeft: 6,
    color: "#166534",
    fontSize: 13,
    fontWeight: "900",
  },

  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },

  taskTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#2563EB",
    lineHeight: 23,
  },

  taskDescription: {
    marginTop: 8,
    color: "#475569",
    lineHeight: 22,
    fontSize: 14,
    fontWeight: "500",
  },

  ratingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
    alignItems: "center",
  },

  ratingLabel: {
    color: "#F59E0B",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 12,
  },

  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  starButton: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },

  ratingHint: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  reviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },

  reviewInput: {
    minHeight: 120,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: "#111827",
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: "top",
    fontWeight: "600",
  },

  counterRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  helperText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "700",
  },

  counterText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
  },

  submitButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  submitText: {
    marginLeft: 8,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
};