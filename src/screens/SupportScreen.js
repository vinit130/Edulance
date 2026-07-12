import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function SupportScreen() {

  const open = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>

      <Text style={styles.heading}>
        Support & Contact
      </Text>

      <Text style={styles.subHeading}>
        Need help? Contact us anytime.
      </Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          open("https://instagram.com/YOUR_INSTAGRAM")
        }
      >
        <Ionicons
          name="logo-instagram"
          size={28}
          color="#E1306C"
        />

        <View style={styles.textBox}>
          <Text style={styles.title}>
            Official Instagram
          </Text>

          <Text style={styles.subtitle}>
            Follow us for updates
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          open("https://linkedin.com/in/YOUR_LINKEDIN")
        }
      >
        <Ionicons
          name="logo-linkedin"
          size={28}
          color="#0A66C2"
        />

        <View style={styles.textBox}>
          <Text style={styles.title}>
            Developer LinkedIn
          </Text>

          <Text style={styles.subtitle}>
            Connect with developer
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          open("mailto:yourmail@gmail.com")
        }
      >
        <Ionicons
          name="mail-outline"
          size={28}
          color="#2563EB"
        />

        <View style={styles.textBox}>
          <Text style={styles.title}>
            Email Support
          </Text>

          <Text style={styles.subtitle}>
            yourmail@gmail.com
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>
          Edulance
        </Text>

        <Text style={styles.infoText}>
          Version 1.0.0
        </Text>

        <Text style={styles.infoText}>
          Built by Vinit Raj
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
container:{
flex:1,
backgroundColor:"#F7F9FC",
padding:20
},
heading:{
fontSize:28,
fontWeight:"800",
color:"#111"
},
subHeading:{
marginTop:5,
marginBottom:25,
fontSize:15,
color:"#666"
},
card:{
backgroundColor:"#fff",
padding:18,
borderRadius:18,
marginBottom:18,
flexDirection:"row",
alignItems:"center",
elevation:3
},
textBox:{
marginLeft:18
},
title:{
fontWeight:"700",
fontSize:17
},
subtitle:{
marginTop:4,
color:"#666"
},
infoBox:{
marginTop:30,
padding:20,
backgroundColor:"#fff",
borderRadius:18
},
infoTitle:{
fontSize:20,
fontWeight:"700"
},
infoText:{
marginTop:8,
color:"#666"
}
});