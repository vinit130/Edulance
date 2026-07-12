import React, { useState } from "react";
import {
View,
Text,
StyleSheet,
TouchableOpacity,
TextInput,
Alert,
ScrollView,
} from "react-native";

import {
collection,
addDoc,
serverTimestamp,
} from "firebase/firestore";

import {db} from "../services/firebaseConfig";

export default function SubmitReviewScreen(){

const[rating,setRating]=useState(5);
const[easy,setEasy]=useState("");
const[design,setDesign]=useState("");
const[bugs,setBugs]=useState("");
const[suggestion,setSuggestion]=useState("");

const submit=async()=>{

try{

await addDoc(collection(db,"reviews"),{

rating,

easy,

design,

bugs,

suggestion,

createdAt:serverTimestamp(),

});

Alert.alert(
"Thank You",
"Your feedback has been submitted."
);

setSuggestion("");

}catch(e){

Alert.alert("Error",e.message);

}

};

return(

<ScrollView style={styles.container}>

<Text style={styles.heading}>
Submit Review
</Text>

<Text style={styles.label}>
⭐ Overall Rating
</Text>

<View style={styles.row}>

{
[1,2,3,4,5].map(item=>(

<TouchableOpacity
key={item}
onPress={()=>setRating(item)}
>

<Text style={{
fontSize:38,
marginHorizontal:4,
color:item<=rating?"#FFD700":"#DDD"
}}>
★
</Text>

</TouchableOpacity>

))
}

</View>

<Text style={styles.label}>
Was the app easy to use?
</Text>

<TextInput
style={styles.input}
placeholder="Yes / No"
/>

<Text style={styles.label}>
How is the UI Design?
</Text>

<TextInput
style={styles.input}
placeholder="Beautiful / Average / Poor"
/>

<Text style={styles.label}>
Did you find any bugs?
</Text>

<TextInput
style={styles.input}
placeholder="Describe bugs"
/>

<Text style={styles.label}>
Suggestions
</Text>

<TextInput
style={[styles.input,{
height:120
}]}
multiline
value={suggestion}
onChangeText={setSuggestion}
placeholder="Write your suggestion..."
/>

<TouchableOpacity
style={styles.button}
onPress={submit}
>

<Text style={styles.buttonText}>
Submit Review
</Text>

</TouchableOpacity>

</ScrollView>

);

}

const styles=StyleSheet.create({

container:{
flex:1,
backgroundColor:"#F7F9FC",
padding:20
},

heading:{
fontSize:28,
fontWeight:"800",
marginBottom:25
},

label:{
fontSize:16,
fontWeight:"700",
marginTop:18,
marginBottom:8
},

row:{
flexDirection:"row",
marginBottom:10
},

input:{
backgroundColor:"#fff",
borderRadius:15,
padding:15,
fontSize:15
},

button:{
marginTop:30,
backgroundColor:"#2563EB",
padding:18,
borderRadius:15,
alignItems:"center"
},

buttonText:{
color:"#fff",
fontWeight:"700",
fontSize:17
}

});