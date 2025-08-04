import {View, Text, StyleSheet, Image} from 'react-native';
import React from 'react';
import MenuBar from '../assets/images/menu_bar.svg';


export default function Navbar() {
  return (
    <View style={style.container}>
      <MenuBar  style={style.menuImage} />


    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuImage: {
    width: '100%',
    // height: 150,
    borderRadius: 10,
  },
});

// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Animated,
//   TouchableOpacity,
//   Dimensions,
// } from 'react-native';
// import MenuBar from '../assets/images/menu_bar.svg'; // SVG component
// import Feather from 'react-native-vector-icons/Feather';

// const { width } = Dimensions.get('window');

// export default function Navbar() {
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const translateX = new Animated.Value(-width); // Initially hidden off screen

//   const toggleSidebar = () => {
//     if (!isSidebarOpen) {
//       setSidebarOpen(true);
//       console.log("@222222222222222222")
//       Animated.timing(translateX, {
//         toValue: 0,
//         duration: 300,
//         useNativeDriver: true,
//       }).start();
//     } else {
//       Animated.timing(translateX, {
//         toValue: -width,
//         duration: 300,
//         useNativeDriver: true,
//       }).start(() => setSidebarOpen(false));
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <TouchableOpacity onPress={toggleSidebar}>
//         <MenuBar style={styles.menuImage} />
//       </TouchableOpacity>

//       {/* Sidebar */}
//       {isSidebarOpen && (
//         <Animated.View style={[styles.sidebar, { transform: [{ translateX }] }]}>
//           <TouchableOpacity style={styles.closeIcon} onPress={toggleSidebar}>
//             <Feather name="x" size={30} color="#000" />
//           </TouchableOpacity>
//           <Text style={styles.sidebarText}>Sidebar Content Here</Text>
//         </Animated.View>
//       )}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     zIndex: 1,
//     padding: 10,
//     backgroundColor: '#F1F4FF;',
//   },
//   menuImage: {
//     width: '100%',
//     height: 20,
//   },
//   sidebar: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     width: width * 0.75,
//     height: '100%',
//     backgroundColor: '#f9f9f9',
//     zIndex: 10,
//     padding: 20,
//     shadowColor: '#000',
//     shadowOpacity: 0.25,
//     shadowRadius: 5,
//     elevation: 5,
//   },
//   closeIcon: {
//     alignSelf: 'flex-end',
//     marginBottom: 20,
//   },
//   sidebarText: {
//     fontSize: 18,
//     color: '#333',
//   },
// });

