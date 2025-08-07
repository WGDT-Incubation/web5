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
import {useNavigation} from '@react-navigation/native';

export default function CreateAccount() {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [number, setNumber] = useState('');
  const [showCPassword, setShowCPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  const toggleCPasswordVisibility = () => {
    setShowCPassword(!showCPassword);
  };

  const handleOnSignupClick = () => {
    if (!number && !newPassword && !confirmPassword) {
      Alert.alert('All Fields are required');
      return;
    }

    if (!number) {
      Alert.alert('Number Cannot be Null or Blank');
      return;
    }
    if (!newPassword) {
      Alert.alert('Password Cannot be Null or Blank');
      return;
    }
    if (!confirmPassword) {
      Alert.alert('Confirm Password Cannot be Null or Blank');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mis Match');
      return;
    }
    navigation.navigate('Login');
  };
  const handleCreateNewAccountClick = () => {
   
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loginHeading}>Create Account</Text>
      <View style={styles.subHeadingContainer}>
        <Text style={styles.subHeading}>
          Create an account so you can explore all the existing jobs.
        </Text>
      </View>

      {/* Number input */}
      <View style={styles.inputWrapper}>
        <TextInput
          // style={styles.input}
          style={[
            styles.input,
            number.length > 0 && styles.inputFocused,
          ]}
          value={number}
          onChangeText={setNumber}
          placeholder="Number"
          placeholderTextColor="#000"
          keyboardType="numeric"
        />
      </View>

      {/* Password input */}
      <View style={styles.inputWrapper}>
        <TextInput
          // style={styles.input}
          style={[
            styles.input,
            newPassword.length > 0 && styles.inputFocused,
          ]}
          secureTextEntry={!showPassword}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Password"
          placeholderTextColor="#000"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={togglePasswordVisibility}>
          <Feather
            name={showPassword ? 'eye' : 'eye-off'}
            size={24}
            color="#888DAA"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.inputWrapper}>
        <TextInput
          // style={styles.input}
          style={[
            styles.input,
            confirmPassword.length > 0 && styles.inputFocused,
          ]}
          secureTextEntry={!showCPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          placeholderTextColor="#000"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={toggleCPasswordVisibility}>
          <Feather
            name={showCPassword ? 'eye' : 'eye-off'}
            size={24}
            color="#888DAA"
          />
        </TouchableOpacity>
      </View>

      {/* Forgot password */}
      {/* <TouchableOpacity style={styles.subHeadingContainer}>
        <Text style={styles.transferButtonText}>Forgot your password?</Text>
      </TouchableOpacity> */}

      {/* Sign in button */}
      <TouchableOpacity
        style={styles.buttonContainerForCreateButton}
        onPress={handleOnSignupClick}>
        <Text style={styles.buttonTextCreateButton}>Sign up</Text>
      </TouchableOpacity>

      {/* Create account */}
      <TouchableOpacity style={styles.closeButton} onPress={handleCreateNewAccountClick}>
        <Text style={styles.closeButtonText}>Already have an account ?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: 'center',
    paddingVertical: 50,
    backgroundColor: '#fff',
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
    borderColor: '#9F9F9F',
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#F1F4FF',
    // paddingRight: 45, // space for eye icon
  },
  inputFocused: {
    borderColor: '#4880FF',
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
    backgroundColor: '#010AFF',
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
    color: '#4880FF',
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
