// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getRemoteConfig } from "firebase/remote-config";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth"; 
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
const auth = getAuth(app);
const remoteConfig = getRemoteConfig(app);

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.error("Tylko jedna karta może korzystać z trybu offline naraz.");
  } else if (err.code === "unimplemented") {
    console.error("Tryb offline nie jest obsługiwany w tej przeglądarce.");
  }
});

remoteConfig.settings = {
  minimumFetchIntervalMillis: 0, // 1 godzina
};

remoteConfig.defaultConfig = {
  latest_version: "1.0.0", // Wartość domyślna
};

export { db, auth, remoteConfig};
//export default firebaseConfig;
