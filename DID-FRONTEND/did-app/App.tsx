import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Login from './components/Login';
import CreateAccount from './components/CreateAccount';
import MainPage from './components/MainPage';
import Navbar from './components/Navbar';
import Otp from './components/Otp';
import CreateAnimation from './components/CreateAnimation';
import RNSecureStorage from 'rn-secure-storage';
import FirstPage from './components/FirstPage';
import List from './components/List';

const Stack = createNativeStackNavigator();

const App: React.FC = (): React.ReactElement | null => {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const number = await RNSecureStorage.getItem('token');
        console.log('Fetched number from storage:', number);

        if (
          number &&
          number !== 'null' &&
          number !== 'undefined' &&
          number.trim() !== ''
        ) {
          setInitialRoute('MainPage');
        } else {
          setInitialRoute('FirstPage');
        }
      } catch (error) {
        console.error('SecureStorage error:', error);
        setInitialRoute('FirstPage');
      }
    };

    checkLoginStatus();
  }, []);

  if (!initialRoute) {
    // You can show a loading indicator here
    return null;
  }
  console.log('initialRoute ===', initialRoute);
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{headerShown: false, animation: 'none'}}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="CreateAccount" component={CreateAccount} />
        <Stack.Screen name="MainPage" component={MainPage} />
        <Stack.Screen name="Navbar" component={Navbar} />
        <Stack.Screen name="Otp" component={Otp} />
        <Stack.Screen name="CreateAnimation" component={CreateAnimation} />
        <Stack.Screen name="FirstPage" component={FirstPage} />
        <Stack.Screen name="List" component={List} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
