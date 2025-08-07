import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import React, {useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute} from '@react-navigation/native';
import config from '../config/config';
import RNSecureStorage from 'rn-secure-storage';

export default function Otp() {
  const route = useRoute();
  const {number} = route.params;
  const navigation = useNavigation();
  const apiIp = config.apiUrl;
  const [otp, setOtp] = useState('');

  const handleOnOtpClick = async () => {
    if (!otp) {
      Alert.alert('Number Cannot be Null or Blank');
      return;
    }

    try {
      const res = await fetch(`${apiIp}user/userLogin`, {
        method: `POST`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: number,
          otp: otp,
        }),
      });
      if (!res.ok) {
        const text = await res.json();
        console.error('Server returned an error:', text);
        Alert.alert(text.message);
        return;
      }
      const result = await res.json();
      console.log('Result for Otp Api ', result);
      if (result.status === 200) {
        console.log('Token FOR OTP PAGE IN ANDROID', result.blockchainToken);
        console.log('Token FOR OTP PAGE IN ANDROID', result.authToken);
        await RNSecureStorage.setItem(
          'blockChainToken',
          result.blockchainToken,
        );
        await RNSecureStorage.setItem('authToken', result.authToken);
        navigation.navigate('CreateAnimation');
        setTimeout(() => {
          navigation.navigate('MainPage', {
            number,
            blockChainToken: result.blockchainToken,
            authToken: result.authToken,
          });
        }, 5000);
        return;
      } else {
        Alert.alert(result.message);
        console.error('OTP Attempt Failed ', error);
      }
    } catch (error) {
      console.error('Failed to login. Please try again: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginHeading}>Verify Your Account</Text>
      <View style={styles.subHeadingContainer}>
        <Text style={styles.subHeading}>
          Enter this code in our Praman Mitra to activate your account.
        </Text>
      </View>

      {/* Number input */}
      <View style={styles.inputWrapper}>
        <TextInput
          // style={styles.input}
          style={[styles.input, number.length > 0 && styles.inputFocused]}
          value={otp}
          onChangeText={setOtp}
          placeholder="Enter Your OTP Here ..."
          placeholderTextColor="#000"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity
        style={styles.buttonContainerForCreateButton}
        onPress={handleOnOtpClick}>
        <Text style={styles.buttonTextCreateButton}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 20,
  },
  inputWrapper: {
    width: '100%',
    marginTop: 20,
  },
  input: {
    color: '#000',
    fontSize: 14,
    lineHeight: 24,
    borderColor: '#C1272C',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#FFFCF7',
    // paddingRight: 45, // space for eye icon
  },
  inputFocused: {
    borderColor: '#C1272C',
    borderWidth: 2,
  },

  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 16,
  },
  transferButtonText: {
    color: '#4880FF',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 24,
    width: '100%',
    marginTop: 10,
    textAlign: 'right',
  },
  buttonContainerForCreateButton: {
    backgroundColor: '#C1272C',
    borderRadius: 10,
    padding: 16,
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  buttonTextCreateButton: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#FFF',
    width: '100%',
  },
  closeButtonText: {
    color: '#010AFF',
    fontWeight: 'bold',
  },
  loginHeading: {
    color: '#C1272C',
    textAlign: 'center',
    fontSize: 30,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 20,
  },
  subHeadingContainer: {
    alignItems: 'center',
  },
  subHeading: {
    color: '#000',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Poppins',
    marginBottom: 30,
  },
});
