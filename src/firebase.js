// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore } from 'firebase/firestore';
import firebase from '@firebase/app';
import 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: 'AIzaSyBnlltkYDUAVq-B4P9caO9O7-IYRrXluXw',
	authDomain: 'codenight-test.firebaseapp.com',
	projectId: 'codenight-test',
	storageBucket: 'codenight-test.appspot.com',
	messagingSenderId: '300953514821',
	appId: '1:300953514821:web:8bfa90ae22fdb84404c42c',
	measurementId: 'G-L10L8BYWBL',
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export default db;
//export default firebaseConfig;
