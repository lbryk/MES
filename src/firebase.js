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
	apiKey: 'AIzaSyDVzKuhJ87oZCYYfbQbGodfgTYprB44m_8',
	authDomain: 'mock-exam-system-708fd.firebaseapp.com',
	projectId: 'mock-exam-system-708fd',
	storageBucket: 'mock-exam-system-708fd.appspot.com',
	messagingSenderId: '1088926954607',
	appId: '1:1088926954607:web:8b75ff78ba79e54c0cc99a',
	measurementId: 'G-LD9RPXBYVZ',
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);


export default db;
//export default firebaseConfig;
