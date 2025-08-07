import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import React, {useState} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';
import config from '../config/config';
import * as keychain from 'react-native-keychain';
import RNSecureStorage from 'rn-secure-storage';

const Login = () => {
  const navigation = useNavigation();
  const apiIp = config.apiUrl;
  console.log('Api IP ===', apiIp);
  const [showPassword, setShowPassword] = useState(false);
  const [number, setNumber] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const handleOnSignupClick = async () => {
    if (!number) {
      Alert.alert('All Fields are required');
      return;
    }

    if (!number) {
      Alert.alert('Number Cannot be Null or Blank');
      return;
    }

    try {
      const res = await fetch(`${apiIp}user/generateUserOtp`, {
        method: `POST`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: number,
        }),
      });
      // if (!res.ok) {
      //   const text = await res.text();
      //   console.error('Server returned an error:', text);
      //   Alert.alert('Failed to sign in. Please check your server.');
      //   return;
      // }
      const result = await res.json();
      console.log('Result for Login Api ', result);
      if (result.status !== 200) {
        Alert.alert('API FOR LOGIN IS NOT WORKING',result.messsage)
        console.log('API FOR LOGIN IS NOT WORKING');
        return;
      }
      if (Platform.OS === 'ios') {
        console.log('API FOR LOGIN IS WORKING IN IOS PLATFORM');
        // console.log('Token FOR LOGIN PAGE IN IOS', result.token);
        // await keychain.setGenericPassword('token', result.token);
        await keychain.setGenericPassword('number', number);
      } else {
        console.log('API FOR LOGIN IS WORKING IN ANDROID');
        // console.log('Token FOR LOGIN PAGE IN ANDROID', result.token);
        // await RNSecureStorage.setItem('token', result.token);
        await RNSecureStorage.setItem('number', number);
      }
      navigation.navigate('Otp', {
        number,
        // token: result.token,
      });
      // setTimeout(() => {
      //   navigation.navigate('MainPage', {
      //     number,
      //     token: result.token,
      //   });
      // }, 5000);

      // navigation.navigate('MainPage', {
      //   number,
      //   token: result.token,
      // });
    } catch (error) {
      console.error('Failed to login. Please try again: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginHeading}>Login Here</Text>
      <View style={styles.subHeadingContainer}>
        <Text style={styles.subHeading}>Welcome back you've been missed!</Text>
      </View>

      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, number.length > 0 && styles.inputFocused]}
          value={number}
          onChangeText={setNumber}
          placeholder="Number"
          placeholderTextColor="#000"
          keyboardType="numeric"
        />
      </View>
      <TouchableOpacity
        style={styles.buttonContainerForCreateButton}
        onPress={handleOnSignupClick}>
        <Text style={styles.buttonTextCreateButton}>Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Login;

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
    fontSize: 25,
    fontWeight: '800',
    width: '80%',
    marginBottom: 30,
  },
});
