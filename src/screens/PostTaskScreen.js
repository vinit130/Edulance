import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import * as Linking from "expo-linking";

import {
  pickImage,
  pickVideo,
  pickDocument,
  pickAudio,
  uploadAttachment,
} from "../services/uploadService";



import {
  Image,
} from "react-native";



import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";

import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";

import {
  LinearGradient,
} from "expo-linear-gradient";
import {
  getCurrentLocation,
  getAddressFromCoordinates,
} from "../services/location";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  db,
  auth,
} from "../services/firebaseConfig";

import FileUploadCard from "../components/FileUploadCard";

import {
uploadToCloudinary,
} from "../services/cloudinary";

import * as ImagePicker from "expo-image-picker";

import * as DocumentPicker from "expo-document-picker";

import FilePickerModal from "../components/FilePickerModal";
import { analyzeTask } from "../services/gemma";
export default function PostTaskScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);
const [attachments, setAttachments] = useState([]);
const [aiLoading, setAiLoading] = useState(false);
const [aiResult, setAiResult] = useState("");
const [uploadingFiles, setUploadingFiles] = useState(false);

const [uploadProgress, setUploadProgress] =
useState("");

const [selectedType, setSelectedType] =
useState(null);

const [pickerVisible,setPickerVisible]=
useState(false);

// ==============================
// FILE UPLOAD STATES
// ==============================

const [selectedFiles, setSelectedFiles] = useState([]);

useEffect(() => {
  console.log("SELECTED FILES:", selectedFiles);
}, [selectedFiles]);

/*
=========================================
PICK IMAGE
=========================================
*/

const addImage = async () => {

  try {

    const file =
      await pickImage();

    if (!file)
      return;

    setUploadingFiles(true);

    setUploadProgress(
      "Uploading Image..."
    );

    const uploaded =
      await uploadAttachment(file);

    setAttachments(previous => [

      ...previous,

      uploaded,

    ]);

  }

  catch (error) {

    Alert.alert(

      "Upload Failed",

      error.message

    );

  }

  finally {

    setUploadingFiles(false);

    setUploadProgress("");

  }

};


const handleAIAnalysis = async () => {
  if (!description.trim()) {
    alert("Enter task description first");
    return;
  }

  setAiLoading(true);

  const result = await analyzeTask(description);

  setAiResult(result);

  setAiLoading(false);
};
/*
=========================================
VIDEO
=========================================
*/

const addVideo = async () => {

  try {

    const file =
      await pickVideo();

    if (!file)
      return;

    setUploadingFiles(true);

    setUploadProgress(
      "Uploading Video..."
    );

    const uploaded =
      await uploadAttachment(file);

    setAttachments(previous => [

      ...previous,

      uploaded,

    ]);

  }

  catch (error) {

    Alert.alert(

      "Upload Failed",

      error.message

    );

  }

  finally {

    setUploadingFiles(false);

    setUploadProgress("");

  }

};
  


/*useEffect
=========================================
DOCUMENT
=========================================
*/

const addDocument = async () => {

  try {

    const file =
      await pickDocument();

    if (!file)
      return;

    setUploadingFiles(true);

    setUploadProgress(
      "Uploading Document..."
    );

    const uploaded =
      await uploadAttachment(file);

    setAttachments(previous => [

      ...previous,

      uploaded,

    ]);

  }

  catch (error) {

    Alert.alert(

      "Upload Failed",

      error.message

    );

  }

  finally {

    setUploadingFiles(false);

    setUploadProgress("");

  }

};

/*
=========================================
AUDIO
=========================================
*/

const addAudio = async () => {

  try {

    const file =
      await pickAudio();

    if (!file)
      return;

    setUploadingFiles(true);

    setUploadProgress(
      "Uploading Audio..."
    );

    const uploaded =
      await uploadAttachment(file);

    setAttachments(previous => [

      ...previous,

      uploaded,

    ]);

  }

  catch (error) {

    Alert.alert(

      "Upload Failed",

      error.message

    );

  }

  finally {

    setUploadingFiles(false);

    setUploadProgress("");

  }

};

/*
=========================================
REMOVE
=========================================
*/

const removeAttachment = index => {

  setAttachments(

    attachments.filter(

      (_, i) => i !== index

    )

  );

};


  const categories = [
    {
      label: "Coding",
      icon: "code-slash-outline",
    },
    {
      label: "Design",
      icon: "color-palette-outline",
    },
    {
      label: "Writing",
      icon: "create-outline",
    },
    {
      label: "Presentation",
      icon: "easel-outline",
    },
    {
      label: "Other",
      icon: "grid-outline",
    },
  ];

  const progress = useMemo(() => {
    let count = 0;

    if (title.trim()) count += 1;
    if (description.trim()) count += 1;
    if (budget.trim()) count += 1;
    if (category) count += 1;

    return count;
  }, [title, description, budget, category]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setBudget("");
    setCategory("");
  };

  const validateForm = () => {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanBudget = budget.trim();

    if (!auth.currentUser) {
      Alert.alert("Login Required", "Please login again to post a task.");
      return false;
    }

    if (!cleanTitle) {
      Alert.alert("Title Required", "Please enter a clear task title.");
      return false;
    }

    if (cleanTitle.length < 5) {
      Alert.alert(
        "Title Too Short",
        "Task title should be at least 5 characters."
      );
      return false;
    }

    if (!cleanDescription) {
      Alert.alert(
        "Description Required",
        "Please describe what work needs to be done."
      );
      return false;
    }

    if (cleanDescription.length < 25) {
      Alert.alert(
        "Description Too Short",
        "Please write at least 25 characters in the description."
      );
      return false;
    }

    if (!cleanBudget) {
      Alert.alert("Budget Required", "Please enter your task budget.");
      return false;
    }

    const numericBudget = Number(cleanBudget);







  
    if (Number.isNaN(numericBudget) || numericBudget <= 0) {
      Alert.alert("Invalid Budget", "Please enter a valid budget amount.");
      return false;
    }

    if (numericBudget < 10) {
      Alert.alert(
        "Budget Too Low",
        "Please enter a budget of at least ₹10."
      );
      return false;
    }

    if (!category) {
      Alert.alert("Category Required", "Please select a task category.");
      return false;
    }

    return true;
  };

  const handlePostTask = async () => {
    if (submitting) return;

    if (!validateForm()) return;

    try {
      setSubmitting(true);

setUploadingFiles(true);
setUploadProgress(0);

      const cleanTitle = title.trim();
      const cleanDescription = description.trim();
      const numericBudget = Number(budget.trim());
      let location = null;
let address = {
  city: "",
  address: "",
};

try {
  location = await getCurrentLocation();

  address = await getAddressFromCoordinates(
    location.latitude,
    location.longitude
  );
} catch (e) {
  console.log("Location not available");
}



const snap = await getDoc(
  doc(db, "users", auth.currentUser.uid)
);

const userDoc = snap.exists() ? snap.data() : {};

const keywords = [
  cleanTitle,
  cleanDescription,
  category,
]
  .join(" ")
  .toLowerCase()
  .split(/\s+/)
  .filter(Boolean);

// =======================================
// Upload all selected files to Cloudinary
// =======================================


let uploadedAttachments = [];

if (selectedFiles.length > 0) {

  for (let i = 0; i < selectedFiles.length; i++) {

    const localFile = selectedFiles[i];

    setUploadProgress(
      Math.round(((i + 1) / selectedFiles.length) * 100)
    );
const uploaded = await uploadToCloudinary(localFile);

console.log("Cloudinary Response:", uploaded);

uploadedAttachments.push({
  url: uploaded.url,

  publicId: uploaded.publicId,

  resourceType: uploaded.resourceType,

  format: uploaded.format || "",

  originalName:
    localFile.fileName ||
    localFile.name ||
    "File",

  mimeType:
    localFile.mimeType || "",

  category:
    localFile.category || "file",

  size:
    localFile.fileSize ||
    localFile.size ||
    0,

  uploadedAt: Date.now(),
});

  }

}


await addDoc(collection(db, "tasks"), {
  // ---------- Task ----------
  title: cleanTitle,
  description: cleanDescription,
  budget: numericBudget,
  category,
  attachments: uploadedAttachments,

  // ---------- Owner ----------
  userId: auth.currentUser.uid,
  userEmail: auth.currentUser.email,

  userName:
    userDoc.name ||
    auth.currentUser.displayName ||
    auth.currentUser.email?.split("@")[0],

  profilePhoto:
    userDoc.profilePhoto || "",

  isVerified:
    userDoc.isVerified || false,

  // ---------- Location ----------
  location: {
  latitude: location?.latitude || null,
  longitude: location?.longitude || null,
  city: address.city || "",
  address: address.address || "",
},

  // ---------- Status ----------
  status: "open",
  assignedTo: "",
  assignedEmail: "",

  completed: false,
  cancelled: false,
  rated: false,

  // ---------- Statistics ----------
  applicantCount: 0,
  bookmarkCount: 0,
  views: 0,

  // ---------- Search ----------
  keywords,

  // ---------- Time ----------
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),

  expiresAt: new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ),
});
     
      Alert.alert(
        "Task Posted",
        "Your task has been posted successfully.",
        [
          {
            text: "Post Another",
            onPress: resetForm,
          },
          {
            text: "Go Home",
            onPress: () => {
              resetForm();
              navigation?.navigate?.("Home");
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {

  setUploadingFiles(false);

  setUploadProgress(0);

  setSubmitting(false);

}
  };
const pickImage = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    console.log("IMAGE PICKER RESULT:", result);

    if (result.canceled) return;

    const file = {
      ...result.assets[0],
      category: "image",
    };

    console.log("SELECTED IMAGE:", file);

    setSelectedFiles((prev) => [...prev, file]);

    setPickerVisible(false);
  } catch (e) {
    console.log("IMAGE PICK ERROR:", e);
  }
};

const pickVideo = async()=>{

const result=
await ImagePicker.launchImageLibraryAsync({

mediaTypes: ["videos"],

});

if(result.canceled) return;

const file=result.assets[0];

file.category="video";

setSelectedFiles(prev=>[

...prev,

file,

]);

setPickerVisible(false);

};

const pickDocument=async()=>{

const result=

await DocumentPicker.getDocumentAsync({

multiple:false,

});

if(result.canceled) return;

const file=result.assets[0];

file.category="pdf";

setSelectedFiles(prev=>[

...prev,

file,

]);

setPickerVisible(false);

};

const pickAudio=async()=>{

const result=

await DocumentPicker.getDocumentAsync({

multiple:false,

});

if(result.canceled) return;

const file=result.assets[0];

file.category="audio";

setSelectedFiles(prev=>[

...prev,

file,

]);

setPickerVisible(false);

};

  const cleanBudgetPreview = Number(budget || 0);

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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Create Task
              </Text>

              <Text style={styles.subtitle}>
                Post work and get help from skilled students
              </Text>
            </View>

            <View style={styles.progressCircle}>
              <Text style={styles.progressText}>
                {progress}/4
              </Text>
            </View>
          </View>

          <LinearGradient
            colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroIcon}>
              <Ionicons
                name="sparkles"
                size={24}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.heroTitle}>
              Make your task clear and specific
            </Text>

            <Text style={styles.heroSubtitle}>
              A better title, budget and description helps you get quality applications faster.
            </Text>
          </LinearGradient>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Task Details
            </Text>

            <Text style={styles.label}>
              Task Title
            </Text>

            <TextInput
              placeholder="Example: Build a login screen in React Native"
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
              editable={!submitting}
              maxLength={80}
              style={styles.input}
            />

            <View style={styles.counterRow}>
              <Text style={styles.helperText}>
                Keep it short and clear
              </Text>

              <Text style={styles.counterText}>
                {title.length}/80
              </Text>
            </View>

            <Text style={styles.label}>
              Description
            </Text>

            <TextInput
              placeholder="Explain requirements, deadline, expected output, and any important details..."
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              editable={!submitting}
              multiline
              maxLength={900}
              style={[
                styles.input,
                styles.descriptionInput,
              ]}
            />

<TouchableOpacity
  onPress={handleAIAnalysis}
  style={{
    backgroundColor: "#2563EB",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  }}
>
  <Text
    style={{
      color: "#fff",
      textAlign: "center",
      fontWeight: "bold",
    }}
  >
    ✨ Analyze with AI
  </Text>
</TouchableOpacity>

{aiLoading && (
  <ActivityIndicator
    size="small"
    color="#2563EB"
    style={{ marginTop: 10 }}
  />
)}

{aiResult !== "" && (
  <View
    style={{
      backgroundColor: "#EEF4FF",
      padding: 12,
      borderRadius: 10,
      marginTop: 10,
    }}
  >
    <Text>{aiResult}</Text>
  </View>
)}

            <View style={styles.counterRow}>
              <Text
                style={[
                  styles.helperText,
                  {
                    color:
                      description.trim().length >= 25
                        ? "#16A34A"
                        : "#EF4444",
                  },
                ]}
              >
                {description.trim().length >= 25
                  ? "Description looks good"
                  : `${Math.max(0, 25 - description.trim().length)} more characters required`}
              </Text>

              <Text style={styles.counterText}>
                {description.length}/900
              </Text>
            </View>

            <Text style={styles.label}>
              Budget
            </Text>

            <View style={styles.budgetInputWrapper}>
              <Text style={styles.rupeeSymbol}>
                ₹
              </Text>

              <TextInput
                placeholder="Enter amount"
                placeholderTextColor="#94A3B8"
                value={budget}
                onChangeText={(value) => {
                  const onlyNumbers = value.replace(/[^0-9]/g, "");
                  setBudget(onlyNumbers);
                }}
                editable={!submitting}
                keyboardType="number-pad"
                style={styles.budgetInput}
              />
            </View>

            {budget ? (
              <View style={styles.previewBox}>
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color="#166534"
                />

                <Text style={styles.previewText}>
                  Budget preview: ₹ {cleanBudgetPreview || 0}
                </Text>
              </View>
            ) : null}
          </View>
{/* ===========================================
      ATTACHMENTS
=========================================== */}

<View
style={{
marginTop:30,
}}
>

<Text
style={{
fontSize:18,
fontWeight:"700",
color:"#111827",
marginBottom:15,
}}
>
Attachments
</Text>

<Text
style={{
color:"#6B7280",
marginBottom:20,
}}
>
Upload images, videos, pdfs or any supporting files.
</Text>

<View
style={{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"space-between",
}}
>

<TouchableOpacity
onPress={()=>setPickerVisible(true)}
style={{
width:"48%",
backgroundColor:"#EEF2FF",
paddingVertical:18,
borderRadius:18,
alignItems:"center",
marginBottom:14,
}}
>

<Ionicons
name="image"
size={30}
color="#4F46E5"
/>

<Text
style={{
marginTop:8,
fontWeight:"700",
}}
>
Image
</Text>

</TouchableOpacity>
 

 
<TouchableOpacity
onPress={addVideo}
style={{
width:"48%",
backgroundColor:"#ECFDF5",
paddingVertical:18,
borderRadius:18,
alignItems:"center",
marginBottom:14,
}}
>

<Ionicons
name="videocam"
size={30}
color="#10B981"
/>

<Text
style={{
marginTop:8,
fontWeight:"700",
}}
>
Video
</Text>

</TouchableOpacity>

<TouchableOpacity
onPress={addDocument}
style={{
width:"48%",
backgroundColor:"#FEF3C7",
paddingVertical:18,
borderRadius:18,
alignItems:"center",
}}
>

<Ionicons
name="document-text"
size={30}
color="#F59E0B"
/>

<Text
style={{
marginTop:8,
fontWeight:"700",
}}
>
Document
</Text>

</TouchableOpacity>

<TouchableOpacity
onPress={addAudio}
style={{
width:"48%",
backgroundColor:"#FCE7F3",
paddingVertical:18,
borderRadius:18,
alignItems:"center",
}}
>

<Ionicons
name="musical-notes"
size={30}
color="#EC4899"
/>

<Text
style={{
marginTop:8,
fontWeight:"700",
}}
>
Audio
</Text>

</TouchableOpacity>

</View>

{/* Selected Files */}



{selectedFiles.length > 0 && (
  <View
    style={{
      marginTop: 20,
    }}
  >
    <Text
      style={{
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
      }}
    >
      Selected Files ({selectedFiles.length})
    </Text>

    {selectedFiles.map((file, index) => (
      <FileUploadCard
        key={index}
        file={{
          ...file,
          url: file.uri,
          originalName:
            file.fileName ||
            file.name ||
            "File",
        }}
        onRemove={() => {
          setSelectedFiles((prev) =>
            prev.filter((_, i) => i !== index)
          );
        }}
      />
    ))}
  </View>
)}



</View>


          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              Category
            </Text>

            <Text style={styles.categorySubtitle}>
              Choose the closest type of work
            </Text>

            <View style={styles.categoryGrid}>
              {categories.map((item) => {
                const active =
                  category === item.label;

                return (
                  <TouchableOpacity
                    key={item.label}
                    activeOpacity={0.86}
                    disabled={submitting}
                    onPress={() => setCategory(item.label)}
                    style={[
                      styles.categoryCard,
                      {
                        backgroundColor:
                          active ? "#2563EB" : "#FFFFFF",

                        borderColor:
                          active ? "#2563EB" : "#E5E7EB",
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={23}
                      color={active ? "#FFFFFF" : "#2563EB"}
                    />

                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color:
                            active ? "#FFFFFF" : "#334155",
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>
              Posting Tips
            </Text>

            <Text style={styles.tipText}>
              • Mention deadline clearly.
            </Text>

            <Text style={styles.tipText}>
              • Explain what files or output you need.
            </Text>

            <Text style={styles.tipText}>
              • Keep budget fair to attract good applicants.
            </Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handlePostTask}
            disabled={submitting}
            style={{ marginTop: 18 }}
          >
            <LinearGradient
              colors={
                submitting
                  ? ["#93C5FD", "#60A5FA"]
                  : ["#3B82F6", "#2563EB", "#1D4ED8"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitButton}
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
                    Post Task
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

<FilePickerModal

visible={pickerVisible}

onClose={()=>

setPickerVisible(false)

}

pickImage={pickImage}

pickVideo={pickVideo}

pickDocument={pickDocument}

pickAudio={pickAudio}

/>


    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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

  title: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  subtitle: {
    color: "#64748B",
    marginTop: 6,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },

  progressCircle: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },

  progressText: {
    color: "#2563EB",
    fontWeight: "900",
    fontSize: 15,
  },

  heroCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#2563EB",
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 7,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.17)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 30,
  },

  heroSubtitle: {
    color: "#DBEAFE",
    marginTop: 8,
    lineHeight: 21,
    fontSize: 14,
    fontWeight: "600",
  },

  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  sectionTitle: {
    color: "#111827",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 12,
  },

  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#F9FAFB",
    color: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    fontSize: 15,
    fontWeight: "600",
  },

  descriptionInput: {
    height: 150,
    textAlignVertical: "top",
    lineHeight: 22,
  },

  counterRow: {
    marginTop: 7,
    marginBottom: 6,
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

  budgetInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 16,
    paddingHorizontal: 14,
  },

  rupeeSymbol: {
    color: "#166534",
    fontSize: 20,
    fontWeight: "900",
    marginRight: 8,
  },

  budgetInput: {
    flex: 1,
    color: "#111827",
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "700",
  },

  previewBox: {
    marginTop: 12,
    backgroundColor: "#F0FDF4",
    borderRadius: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    flexDirection: "row",
    alignItems: "center",
  },

  previewText: {
    marginLeft: 8,
    color: "#166534",
    fontSize: 13,
    fontWeight: "800",
  },

  categorySubtitle: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "600",
    marginTop: -6,
    marginBottom: 14,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  categoryCard: {
    width: "48%",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: "center",
  },

  categoryText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "900",
  },

  tipsCard: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 22,
    padding: 16,
  },

  tipsTitle: {
    color: "#1E3A8A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  tipText: {
    color: "#1E40AF",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 22,
  },

  submitButton: {
    paddingVertical: 17,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#2563EB",
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 7,
  },

  submitText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    marginLeft: 8,
  },
};