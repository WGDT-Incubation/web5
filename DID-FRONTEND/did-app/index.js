/**
 * @format
 */
import * as React from 'react';
// redirect any useInsertionEffect calls to useEffect instead
React.useInsertionEffect = React.useEffect;
import {AppRegistry, LogBox} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);


AppRegistry.registerComponent(appName, () => App);
