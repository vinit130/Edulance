import React from "react";

import {
Modal,
View,
Text,
TouchableOpacity,
StyleSheet,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function FilePickerModal({

visible,

onClose,

pickImage,

pickVideo,

pickDocument,

pickAudio,

}) {

return(

<Modal

visible={visible}

animationType="slide"

transparent

>

<View style={styles.overlay}>

<View style={styles.container}>

<Text style={styles.title}>

Choose Attachment

</Text>

<TouchableOpacity

style={styles.option}

onPress={pickImage}

>

<Ionicons

name="image"

size={28}

color="#2563EB"

/>

<Text style={styles.text}>

Gallery Images

</Text>

</TouchableOpacity>

<TouchableOpacity

style={styles.option}

onPress={pickVideo}

>

<Ionicons

name="videocam"

size={28}

color="#EF4444"

/>

<Text style={styles.text}>

Videos

</Text>

</TouchableOpacity>

<TouchableOpacity

style={styles.option}

onPress={pickDocument}

>

<Ionicons

name="document-text"

size={28}

color="#F59E0B"

/>

<Text style={styles.text}>

Documents / PDF

</Text>

</TouchableOpacity>

<TouchableOpacity

style={styles.option}

onPress={pickAudio}

>

<Ionicons

name="musical-notes"

size={28}

color="#8B5CF6"

/>

<Text style={styles.text}>

Audio

</Text>

</TouchableOpacity>

<TouchableOpacity

style={styles.close}

onPress={onClose}

>

<Text

style={{

color:"white",

fontWeight:"700",

}}

>

Cancel

</Text>

</TouchableOpacity>

</View>

</View>

</Modal>

);

}

const styles=StyleSheet.create({

overlay:{

flex:1,

backgroundColor:"rgba(0,0,0,0.4)",

justifyContent:"flex-end",

},

container:{

backgroundColor:"white",

borderTopLeftRadius:30,

borderTopRightRadius:30,

padding:25,

},

title:{

fontSize:22,

fontWeight:"700",

marginBottom:20,

},

option:{

flexDirection:"row",

alignItems:"center",

paddingVertical:18,

},

text:{

marginLeft:18,

fontSize:17,

fontWeight:"600",

},

close:{

marginTop:25,

backgroundColor:"#2563EB",

padding:18,

borderRadius:18,

alignItems:"center",

},

});