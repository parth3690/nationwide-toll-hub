/**
 * Nationwide Toll Hub Mobile App
 * 
 * Entry point for the React Native application.
 * This file registers the main App component with the React Native runtime.
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import {name as appName} from './app.json';

AppRegistry.registerComponent(appName, () => App);
