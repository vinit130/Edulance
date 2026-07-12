
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import {
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";


const faqData = [
  {
    question: "What is Edulance?",
    answer:
      "Edulance is a student community where users can post tasks, apply for tasks, chat, and earn money by completing academic or freelance work.",
  },
  {
    question: "How do I post a task?",
    answer:
      "Go to the Post Task page, fill all required details, attach files if needed, and press Submit.",
  },
  {
    question: "How do I apply for a task?",
    answer:
      "Open any task and press the Apply button. Wait for the task owner to accept your request.",
  },
  {
    question: "Can I upload files?",
    answer:
      "Yes. Images, Videos, Audio files and PDF documents are supported.",
  },
  {
    question: "How can I contact support?",
    answer:
      "Open the Support page from the sidebar and use the provided Instagram, LinkedIn or Email links.",
  },
  {
    question: "Can I edit my posted task?",
    answer:
      "Yes. Open your task and use the Edit option before it is assigned.",
  },
  {
    question: "Can I delete my task?",
    answer:
      "Yes. You can delete any task posted by you from the task options.",
  },
  

  {
  question: "Terms & Conditions",
  answer: "",
  legal: true,
},

{
  question: "Privacy Policy",
  answer: "...",
  legal: true,
},
];

export default function FaqScreen() {
  const [expanded, setExpanded] = useState(null);
  
const [showTerms, setShowTerms] = useState(false);
const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>
        Frequently Asked Questions
      </Text>

   {faqData.map((item, index) => (
  <View key={index} style={styles.card}>

    {(item.question === "Terms & Conditions" ||
      item.question === "Privacy Policy") ? (

      <TouchableOpacity
        style={
          item.question === "Terms & Conditions"
            ? styles.termsButton
            : styles.privacyButton
        }
        onPress={() => {
          if (item.question === "Terms & Conditions") {
            setShowTerms(true);
          } else {
            setShowPrivacy(true);
          }
        }}
      >
        <Ionicons
          name="document-text-outline"
          size={22}
          color="#fff"
        />

        <Text style={styles.documentButtonText}>
          {item.question}
        </Text>
      </TouchableOpacity>

    ) : (

      <>
        <TouchableOpacity
          style={styles.header}
          onPress={() =>
            setExpanded(
              expanded === index ? null : index
            )
          }
        >
          <Text style={styles.question}>
            {item.question}
          </Text>

          <Ionicons
            name={
              expanded === index
                ? "chevron-up"
                : "chevron-down"
            }
            size={22}
            color="#2563EB"
          />
        </TouchableOpacity>

        

        {expanded === index && (
          <Text style={styles.answer}>
            {item.answer}
          </Text>
        )}
      </>
    )}

  </View>
))}
<Modal
  visible={showTerms}
  animationType="slide"
>
  <ScrollView
    style={{
      flex: 1,
      padding: 20,
      backgroundColor: "#fff",
    }}
  >
    <TouchableOpacity
      onPress={() => setShowTerms(false)}
    >
      <Ionicons
        name="close"
        size={30}
      />
    </TouchableOpacity>

<Text style={styles.heading}>
  Terms & Conditions
</Text>

<Text style={styles.effectiveDate}>
  Effective Date: July 2026
</Text>

<Text style={styles.paragraph}>
  Welcome to Edulance. By creating an account or using this application, you agree to these Terms & Conditions. If you do not agree with any part of these terms, please discontinue use of the application.
</Text>

<Text style={styles.sectionTitle}>
  1. Eligibility
</Text>

<Text style={styles.paragraph}>
  You must be at least 13 years old or meet the minimum legal age required under the laws of your country to use Edulance.
</Text>

<Text style={styles.sectionTitle}>
  2. User Accounts
</Text>

<Text style={styles.paragraph}>
  Users are responsible for maintaining the confidentiality of their account credentials.
</Text>

<Text style={styles.paragraph}>
  You agree to provide accurate, complete and updated information during registration and while using the platform.
</Text>

<Text style={styles.sectionTitle}>
  3. User Responsibilities
</Text>

<Text style={styles.bullet}>• Do not post illegal, abusive or harmful content.</Text>
<Text style={styles.bullet}>• Do not upload copyrighted material without permission.</Text>
<Text style={styles.bullet}>• Do not impersonate another individual.</Text>
<Text style={styles.bullet}>• Do not attempt to hack, exploit or interfere with the application.</Text>
<Text style={styles.bullet}>• Do not use the platform for scams or fraudulent activities.</Text>

<Text style={styles.paragraph}>
  Violation of these rules may result in temporary suspension or permanent termination of your account.
</Text>

<Text style={styles.sectionTitle}>
  4. Task Posting
</Text>

<Text style={styles.paragraph}>
  Users are solely responsible for the accuracy, legality and completeness of the tasks they post.
</Text>

<Text style={styles.paragraph}>
  Edulance does not guarantee that a task will receive applications or be successfully completed.
</Text>

<Text style={styles.sectionTitle}>
  5. Task Applications
</Text>

<Text style={styles.paragraph}>
  Applying for a task does not guarantee assignment.
</Text>

<Text style={styles.paragraph}>
  Task owners have complete discretion in selecting applicants.
</Text>

<Text style={styles.sectionTitle}>
  6. Payments
</Text>

<Text style={styles.paragraph}>
  Edulance acts only as a platform connecting users.
</Text>

<Text style={styles.paragraph}>
  Users are responsible for negotiating, sending and receiving payments.
</Text>

<Text style={styles.paragraph}>
  Edulance is not responsible for payment disputes between users.
</Text>

<Text style={styles.sectionTitle}>
  7. Intellectual Property
</Text>

<Text style={styles.paragraph}>
  All application branding, logos, interface design and software belong to Edulance unless otherwise stated.
</Text>

<Text style={styles.paragraph}>
  Users retain ownership of files, documents and other content they upload.
</Text>

<Text style={styles.sectionTitle}>
  8. Content Moderation
</Text>

<Text style={styles.paragraph}>
  Edulance reserves the right to review, remove or restrict any content that violates these Terms, community guidelines or applicable laws.
</Text>

<Text style={styles.sectionTitle}>
  9. Account Suspension
</Text>

<Text style={styles.paragraph}>
  Accounts may be suspended or permanently terminated for:
</Text>

<Text style={styles.bullet}>• Fraudulent activities</Text>
<Text style={styles.bullet}>• Spam</Text>
<Text style={styles.bullet}>• Harassment</Text>
<Text style={styles.bullet}>• Fake identity or information</Text>
<Text style={styles.bullet}>• Abuse of the platform</Text>
<Text style={styles.bullet}>• Violation of these Terms</Text>

<Text style={styles.sectionTitle}>
  10. Disclaimer
</Text>

<Text style={styles.paragraph}>
  Edulance provides its services on an "as is" and "as available" basis without warranties of any kind.
</Text>

<Text style={styles.paragraph}>
  We do not guarantee uninterrupted availability, error-free operation or successful completion of tasks.
</Text>

<Text style={styles.sectionTitle}>
  11. Limitation of Liability
</Text>

<Text style={styles.paragraph}>
  To the maximum extent permitted by law, Edulance shall not be liable for any direct, indirect, incidental, special or consequential damages arising from the use or inability to use the application.
</Text>

<Text style={styles.sectionTitle}>
  12. Third-Party Services
</Text>

<Text style={styles.paragraph}>
  Edulance may use trusted third-party services including Firebase, Cloudinary, Google Authentication and Expo services. Their respective Terms and Privacy Policies also apply.
</Text>

<Text style={styles.sectionTitle}>
  13. Changes to Terms
</Text>

<Text style={styles.paragraph}>
  We reserve the right to modify these Terms at any time.
</Text>

<Text style={styles.paragraph}>
  Continued use of Edulance after updates indicates your acceptance of the revised Terms.
</Text>

<Text style={styles.sectionTitle}>
  14. Governing Law
</Text>

<Text style={styles.paragraph}>
  These Terms shall be governed by the laws applicable in your jurisdiction. Any disputes shall be handled in accordance with applicable legal procedures.
</Text>

<Text style={styles.sectionTitle}>
  15. Contact
</Text>

<Text style={styles.paragraph}>
  For questions regarding these Terms & Conditions, please contact the developer through the Support section available within the application.
</Text>

<Text style={[styles.paragraph,{
  marginTop:30,
  textAlign:"center",
  fontWeight:"700",
  color:"#2563EB"
}]}>
  Thank you for using Edulance.
</Text>



  </ScrollView>
</Modal>
<Modal
visible={showPrivacy}
animationType="slide"
>

<ScrollView
style={{
flex:1,
padding:20,
backgroundColor:"#fff"
}}
>

<TouchableOpacity
onPress={()=>setShowPrivacy(false)}
>

<Ionicons
name="close"
size={30}
/>

</TouchableOpacity>
<Text style={styles.heading}>
  Edulance Privacy Policy
</Text>

<Text style={styles.effectiveDate}>
  Effective Date: July 2026
</Text>

<Text style={styles.paragraph}>
  Your privacy is important to us. This Privacy Policy explains how Edulance
  collects, uses, stores and protects your personal information when you use
  our application.
</Text>

<Text style={styles.sectionTitle}>
  1. Information We Collect
</Text>

<Text style={styles.paragraph}>
  We may collect the following information when you use Edulance:
</Text>

<Text style={styles.bullet}>• Full Name</Text>
<Text style={styles.bullet}>• Email Address</Text>
<Text style={styles.bullet}>• Profile Photo</Text>
<Text style={styles.bullet}>• Device Information</Text>
<Text style={styles.bullet}>• Location (only with permission)</Text>
<Text style={styles.bullet}>• Uploaded Files</Text>
<Text style={styles.bullet}>• Chat Messages</Text>
<Text style={styles.bullet}>• Notifications</Text>
<Text style={styles.bullet}>• Task Information</Text>

<Text style={styles.sectionTitle}>
  2. How We Use Your Information
</Text>

<Text style={styles.paragraph}>
  Your information is used to:
</Text>

<Text style={styles.bullet}>• Create and manage your account</Text>
<Text style={styles.bullet}>• Enable task posting and applications</Text>
<Text style={styles.bullet}>• Improve application performance</Text>
<Text style={styles.bullet}>• Provide customer support</Text>
<Text style={styles.bullet}>• Detect fraud and prevent abuse</Text>
<Text style={styles.bullet}>• Send important notifications</Text>

<Text style={styles.sectionTitle}>
  3. Location Permission
</Text>

<Text style={styles.paragraph}>
  If you grant location permission, Edulance uses your location to display
  nearby tasks and improve recommendations.
</Text>

<Text style={styles.paragraph}>
  You may disable location access anytime from your device settings.
</Text>

<Text style={styles.sectionTitle}>
  4. Uploaded Files
</Text>

<Text style={styles.paragraph}>
  Files uploaded through Edulance are securely stored using trusted cloud
  storage providers.
</Text>

<Text style={styles.paragraph}>
  Only users participating in the related task may access shared files.
</Text>

<Text style={styles.sectionTitle}>
  5. Chat Messages
</Text>

<Text style={styles.paragraph}>
  Messages exchanged between users are stored securely to provide communication
  features within the application.
</Text>

<Text style={styles.paragraph}>
  We do not sell or publicly disclose private conversations.
</Text>

<Text style={styles.sectionTitle}>
  6. Push Notifications
</Text>

<Text style={styles.paragraph}>
  Edulance sends notifications only for:
</Text>

<Text style={styles.bullet}>• Task Applications</Text>
<Text style={styles.bullet}>• New Messages</Text>
<Text style={styles.bullet}>• Task Updates</Text>
<Text style={styles.bullet}>• Important Announcements</Text>

<Text style={styles.sectionTitle}>
  7. Data Security
</Text>

<Text style={styles.paragraph}>
  We use reasonable technical and organizational security measures to protect
  your personal information.
</Text>

<Text style={styles.paragraph}>
  However, no internet service can guarantee 100% security.
</Text>

<Text style={styles.sectionTitle}>
  8. Third-Party Services
</Text>

<Text style={styles.paragraph}>
  Edulance uses trusted third-party services including:
</Text>

<Text style={styles.bullet}>• Firebase</Text>
<Text style={styles.bullet}>• Cloudinary</Text>
<Text style={styles.bullet}>• Google Authentication</Text>
<Text style={styles.bullet}>• Expo Push Notifications</Text>

<Text style={styles.paragraph}>
  These services have their own Privacy Policies which also apply while using
  their services.
</Text>

<Text style={styles.sectionTitle}>
  9. Data Retention
</Text>

<Text style={styles.paragraph}>
  Your information is retained while your account remains active or as required
  by applicable laws.
</Text>

<Text style={styles.sectionTitle}>
  10. Account Deletion
</Text>

<Text style={styles.paragraph}>
  You may request deletion of your account through the Support section.
</Text>

<Text style={styles.paragraph}>
  Once deleted, your account data may be permanently removed and cannot always
  be recovered.
</Text>

<Text style={styles.sectionTitle}>
  11. Children's Privacy
</Text>

<Text style={styles.paragraph}>
  Edulance is not intended for children under the age of 13. We do not knowingly
  collect personal information from children.
</Text>

<Text style={styles.sectionTitle}>
  12. Policy Updates
</Text>

<Text style={styles.paragraph}>
  We may update this Privacy Policy from time to time.
</Text>

<Text style={styles.paragraph}>
  The latest version will always be available within the application.
</Text>

<Text style={styles.sectionTitle}>
  13. Your Rights
</Text>

<Text style={styles.paragraph}>
  Depending on your local laws, you may have the right to access, update,
  correct or request deletion of your personal information.
</Text>

<Text style={styles.sectionTitle}>
  14. Contact Us
</Text>

<Text style={styles.paragraph}>
  If you have any questions regarding this Privacy Policy or your personal
  information, please contact the developer through the Support section inside
  the application.
</Text>

<Text
  style={[
    styles.paragraph,
    {
      marginTop: 30,
      textAlign: "center",
      fontWeight: "700",
      color: "#2563EB",
    },
  ]}
>
  Thank you for trusting Edulance.
</Text>


</ScrollView>

</Modal>
    </ScrollView>
  );<Modal
  visible={showTerms}
  animationType="slide"
>

<ScrollView
style={{
flex:1,
padding:20,
backgroundColor:"#fff"
}}
>

<TouchableOpacity
onPress={()=>setShowTerms(false)}
>

<Ionicons
name="close"
size={30}
/>

</TouchableOpacity>

<Text
style={{
fontSize:28,
fontWeight:"bold",
marginBottom:20
}}
>
Terms & Conditions
</Text>

<Text
style={{
fontSize:16,
lineHeight:28,
color:"#444"
}}
>

PASTE YOUR COMPLETE TERMS HERE

</Text>

</ScrollView>

</Modal>

}



const styles = StyleSheet.create({


heading: {
  fontSize: 30,
  fontWeight: "bold",
  color: "#111827",
  marginBottom: 10,
},

effectiveDate: {
  fontSize: 14,
  color: "#6B7280",
  marginBottom: 25,
},

sectionTitle: {
  fontSize: 22,
  fontWeight: "700",
  color: "#1E3A8A",
  marginTop: 22,
  marginBottom: 10,
},

paragraph: {
  fontSize: 16,
  color: "#374151",
  lineHeight: 28,
  marginBottom: 15,
},

bullet: {
  fontSize: 16,
  color: "#374151",
  lineHeight: 28,
  marginLeft: 12,
},

bold: {
  fontWeight: "700",
},



  container: {
    flex: 1,
    backgroundColor: "#F7F9FC",
    padding: 18,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 25,
    color: "#111827",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginBottom: 15,
    padding: 15,
    elevation: 3,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  question: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    paddingRight: 10,
  },

  answer: {
    marginTop: 15,
    color: "#6B7280",
    fontSize: 15,
    lineHeight: 22,
  },

legalCard: {
  backgroundColor: "#ECFDF5",
  borderWidth: 1,
  borderColor: "#10B981",
},
termsButton:{
backgroundColor:"#2563EB",
padding:18,
borderRadius:14,
flexDirection:"row",
justifyContent:"center",
alignItems:"center",
},

privacyButton:{
backgroundColor:"#059669",
padding:18,
borderRadius:14,
flexDirection:"row",
justifyContent:"center",
alignItems:"center",
},

documentButtonText:{
color:"#fff",
fontSize:17,
fontWeight:"700",
marginLeft:10,
},
});

