import React, { useEffect, useMemo, useState } from "react";
import {
  auth,
  db,
} from "../services/firebaseConfig";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";


import Ionicons from "@expo/vector-icons/Ionicons";
import { uploadToCloudinary } from "../services/cloudinary";

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profilePhoto, setProfilePhoto] = useState("");
  const [coverPhoto, setCoverPhoto] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [college, setCollege] = useState("");
  const [department, setDepartment] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [skills, setSkills] = useState("");
  const [languages, setLanguages] = useState("");
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [availability, setAvailability] = useState("Available");

  const currentUser = auth.currentUser;

  const profileCompletion = useMemo(() => {
    const fields = [
      name,
      bio,
      college,
      department,
      year,
      semester,
      skills,
      languages,
      github || linkedin || website || portfolio,
      profilePhoto,
      resumeUrl,
    ];

    const completed = fields.filter((item) =>
      String(item || "").trim()
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [
    name,
    bio,
    college,
    department,
    year,
    semester,
    skills,
    languages,
    github,
    linkedin,
    website,
    portfolio,
    profilePhoto,
    resumeUrl,
  ]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!currentUser) {
        Alert.alert("Login Required", "Please login again.");
        navigation.goBack();
        return;
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid));

      if (snap.exists()) {
        const data = snap.data();

        setProfilePhoto(data.profilePhoto || data.photoURL || "");
        setCoverPhoto(data.coverPhoto || "");
        setResumeUrl(data.resumeUrl || "");
        setResumeName(data.resumeName || "");

        setName(data.name || currentUser.displayName || "");
        setBio(data.bio || "");
        setCollege(data.college || "");
        setDepartment(data.department || "");
        setYear(data.year || "");
        setSemester(data.semester || "");
        setSkills(
          Array.isArray(data.skills)
            ? data.skills.join(", ")
            : data.skills || ""
        );
        setLanguages(
          Array.isArray(data.languages)
            ? data.languages.join(", ")
            : data.languages || ""
        );
        setGithub(data.github || "");
        setLinkedin(data.linkedin || "");
        setWebsite(data.website || "");
        setPortfolio(data.portfolio || "");
        setAvailability(data.availability || "Available");
      }
    } catch (error) {
      Alert.alert("Profile Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  

  

  const pickProfilePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled) return;

    try {
      setSaving(true);

      const uri = result.assets[0].uri;
      const url = await uploadToCloudinary(uri);

      setProfilePhoto(url);
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const pickCoverPhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.75,
    });

    if (result.canceled) return;

    try {
      setSaving(true);

      const uri = result.assets[0].uri;
      const url = await uploadToCloudinary(uri);

      setCoverPhoto(url);
    } catch (error) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const pickResume = async () => {
  Alert.alert(
    "Coming Soon",
    "Resume upload will be enabled in the next step."
  );
  return;
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    try {
      setSaving(true);

      const file = result.assets[0];

      const url = await uploadFileAsync(
        file.uri,
        "resumes",
        file.name || "resume.pdf"
      );

      setResumeUrl(url);
      setResumeName(file.name || "Resume");
    } catch (error) {
      Alert.alert("Resume Upload Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    if (!college.trim()) {
      Alert.alert("College Required", "Please enter your college.");
      return;
    }

    try {
      setSaving(true);

      const skillsArray = skills
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const languageArray = languages
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          uid: currentUser.uid,
          email: currentUser.email || "",
          phoneNumber: currentUser.phoneNumber || "",

          name: name.trim(),
          bio: bio.trim(),
          college: college.trim(),
          department: department.trim(),
          year: year.trim(),
          semester: semester.trim(),

          skills: skillsArray,
          languages: languageArray,

          github: github.trim(),
          linkedin: linkedin.trim(),
          website: website.trim(),
          portfolio: portfolio.trim(),

          profilePhoto,
          photoURL: profilePhoto,
          coverPhoto,

          resumeUrl,
          resumeName,

          availability,
          isVerified: false,
          verificationBadge: false,

          profileCompletion,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );

      Alert.alert("Saved", "Your profile has been updated.");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Save Failed", error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#111827" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Edit Profile</Text>

            <View style={{ width: 44 }} />
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pickCoverPhoto}
            style={styles.coverBox}
          >
            {coverPhoto ? (
              <Image source={{ uri: coverPhoto }} style={styles.coverImage} />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Ionicons name="image-outline" size={30} color="#64748B" />
                <Text style={styles.coverText}>Add Cover Photo</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={pickProfilePhoto}
            style={styles.avatarBox}
          >
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#2563EB" />
              </View>
            )}

            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.completionCard}>
            <Text style={styles.completionText}>
              Profile Completion: {profileCompletion}%
            </Text>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${profileCompletion}%` },
                ]}
              />
            </View>
          </View>

          <Section title="Basic Information">
            <Input label="Full Name" value={name} setValue={setName} />
            <Input
              label="Bio"
              value={bio}
              setValue={setBio}
              multiline
              maxLength={400}
              placeholder="Tell others about your skills, experience and goals..."
            />
          </Section>

          <Section title="Education">
            <Input label="College" value={college} setValue={setCollege} />
            <Input
              label="Department"
              value={department}
              setValue={setDepartment}
              placeholder="Information Technology"
            />
            <Input
              label="Year"
              value={year}
              setValue={setYear}
              placeholder="1st Year / 2nd Year"
            />
            <Input
              label="Semester"
              value={semester}
              setValue={setSemester}
              placeholder="Semester 2"
            />
          </Section>

          <Section title="Skills & Languages">
            <Input
              label="Skills"
              value={skills}
              setValue={setSkills}
              placeholder="React Native, Java, UI Design"
            />
            <Input
              label="Languages"
              value={languages}
              setValue={setLanguages}
              placeholder="English, Hindi, Bengali"
            />
          </Section>

          <Section title="Portfolio Links">
            <Input label="GitHub" value={github} setValue={setGithub} />
            <Input label="LinkedIn" value={linkedin} setValue={setLinkedin} />
            <Input label="Website" value={website} setValue={setWebsite} />
            <Input label="Portfolio" value={portfolio} setValue={setPortfolio} />
          </Section>

          <Section title="Availability">
            <View style={styles.statusRow}>
              {["Available", "Busy", "Not Available"].map((item) => (
                <TouchableOpacity
                  key={item}
                  onPress={() => setAvailability(item)}
                  style={[
                    styles.statusChip,
                    availability === item && styles.statusChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      availability === item && styles.statusTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          <Section title="Resume">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={pickResume}
              style={styles.resumeButton}
            >
              <Ionicons name="document-attach-outline" size={22} color="#2563EB" />

              <Text style={styles.resumeText}>
                {resumeName || "Upload Resume PDF/DOC"}
              </Text>
            </TouchableOpacity>
          </Section>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={saveProfile}
            disabled={saving}
            style={[
              styles.saveButton,
              { backgroundColor: saving ? "#93C5FD" : "#2563EB" },
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                <Text style={styles.saveText}>Save Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({
  label,
  value,
  setValue,
  placeholder,
  multiline,
  maxLength = 120,
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={placeholder || label}
        placeholderTextColor="#94A3B8"
        multiline={multiline}
        maxLength={maxLength}
        style={[
          styles.input,
          multiline && {
            height: 110,
            textAlignVertical: "top",
            lineHeight: 22,
          },
        ]}
      />
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },

  loadingText: {
    marginTop: 10,
    color: "#64748B",
    fontWeight: "700",
  },

  scroll: {
    padding: 20,
    paddingBottom: 150,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#111827",
  },

  coverBox: {
    height: 150,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: "#E0F2FE",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  coverText: {
    marginTop: 8,
    color: "#64748B",
    fontWeight: "800",
  },

  avatarBox: {
    width: 96,
    height: 96,
    borderRadius: 35,
    alignSelf: "center",
    marginTop: -48,
    backgroundColor: "#FFFFFF",
    padding: 4,
  },

  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 31,
  },

  avatarPlaceholder: {
    flex: 1,
    borderRadius: 31,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
  },

  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 4,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  completionCard: {
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  completionText: {
    color: "#334155",
    fontWeight: "900",
    marginBottom: 10,
  },

  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#2563EB",
  },

  section: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  label: {
    color: "#334155",
    fontWeight: "800",
    marginBottom: 7,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    color: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    fontSize: 15,
    fontWeight: "600",
  },

  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  statusChip: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  statusChipActive: {
    backgroundColor: "#DBEAFE",
    borderColor: "#93C5FD",
  },

  statusText: {
    color: "#64748B",
    fontWeight: "900",
    fontSize: 12,
  },

  statusTextActive: {
    color: "#2563EB",
  },

  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 14,
    borderRadius: 16,
  },

  resumeText: {
    marginLeft: 10,
    color: "#2563EB",
    fontWeight: "900",
  },

  saveButton: {
    marginTop: 22,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
  },
};