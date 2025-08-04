// import { useNavigation } from '@react-navigation/native';
// import React, { useEffect, useRef } from 'react';
// import {
//   View,
//   Text,
//   Animated,
//   StyleSheet,
// } from 'react-native';
// import FirstPageSvg from '../assets/images/otp-security-svg.svg';

// const FirstPage = () => {
//   const navigation = useNavigation();
//   const scaleAnim = useRef(new Animated.Value(0.2)).current;

//   // useEffect(() => {
//   //   // Zoom In/Out Animation
//   //   Animated.loop(
//   //     Animated.sequence([
//   //       Animated.timing(scaleAnim, {
//   //         toValue:  0.2,
//   //         duration: 1000,
//   //         useNativeDriver: true,
//   //       }),
//   //       Animated.timing(scaleAnim, {
//   //         toValue: 1.2,
//   //         duration: 1000,
//   //         useNativeDriver: true,
//   //       }),
//   //     ])
//   //   ).start();

//   //   // Redirect after 10 seconds
//   //   const timer = setTimeout(() => {
//   //     navigation.navigate('Login');
//   //   }, 10000);

//   //   return () => clearTimeout(timer);
//   // }, []);
//   useEffect(() => {
//     // Zoom from small to large once
//     Animated.timing(scaleAnim, {
//       toValue: 1.5,
//       duration: 2000,
//       useNativeDriver: true,
//     }).start();

//     // Navigate to login after animation + wait
//     const timer = setTimeout(() => {
//       navigation.navigate('Login');
//     }, 4000); // 2s animation + 2s wait

//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
//         <FirstPageSvg width={300} height={300} />
//       </Animated.View>
//       <View style={styles.content}>
//         <Text style={styles.title}>Ledger App</Text>
//       </View>
//     </View>
//   );
// };

// export default FirstPage;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#ffff',
//   },
//   content: {
//     alignItems: 'center',
//     paddingVertical: 20,
//   },
//   title: {
//     color: '#C1272C',
//     fontFamily: 'Raleway-Regular',
//     fontSize: 33,
//     fontWeight: '700',
//     lineHeight: 41,
//   },
// });
import React, {useEffect, useRef} from 'react';
import {View, Text, Animated, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import FirstPageSvg from '../assets/images/otp-security-svg.svg';

const FirstPage = () => {
  const navigation = useNavigation();

  const scaleAnim = useRef(new Animated.Value(0.2)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate SVG scale
    Animated.timing(scaleAnim, {
      toValue: 1.5,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    // Animate text: fade in and move up
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1500,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1500,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      navigation.navigate('Login');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{transform: [{scale: scaleAnim}]}}>
        <FirstPageSvg width={250} height={250} />
      </Animated.View>

      <View style={styles.content}>
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: opacityAnim,
              transform: [{translateY: translateYAnim}],
            },
          ]}>
          Wadhwani Foundation
        </Animated.Text>
      </View>
    </View>
  );
};

export default FirstPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  content: {
    // paddingVertical: 20,
    justifyContent:'center',
    width:'100%',
    alignItems: 'center',
    marginTop:50

  },
  title: {
    color: '#C1272C',
    fontFamily: 'Raleway-Regular',
    fontSize: 33,
    fontWeight: '700',
    lineHeight: 41,
    // width:'50%'
    textAlign:'center'
  },
});
