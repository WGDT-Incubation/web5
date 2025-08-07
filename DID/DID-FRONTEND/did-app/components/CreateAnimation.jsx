import React from 'react';
import {View, Text, StyleSheet, ImageBackground} from 'react-native';
import LottieView from 'lottie-react-native';

const CreateAnimation = () => {
  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/images/Loading File.json')}
        autoPlay
        loop
        style={styles.animation}
      />
      <Text style={styles.text}>
        {/* Creating your wallet...{'\n'}Do not press back, It will take a few
          seconds. */}
        View and download all your verified documents securely and instantly.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',

    // backgroundColor: '#17171A',
  },
  backgroundImage: {
    flex: 1,
    // width: '100%',
    // height: '100%',
  },
  animation: {
    width: 200,
    height: 200,
  },
  text: {
    marginTop: 20,
    color: '#C1272C',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '800',
    width: '80%',
  },
});

export default CreateAnimation;
