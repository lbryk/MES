import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	
	const [user, setUser] = useState(
		() => JSON.parse(localStorage.getItem('user')) || null
	);

	useEffect(() => {
		// This effect persists the user to localStorage whenever the user state changes.
		localStorage.setItem('user', JSON.stringify(user));
	}, [user]);

	const login = (userData) => {
		setUser(userData);
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
	};

	const value = { user, login, logout };

	const [userName, setUserName] = useState(null);
  const [role, setRole] = useState(null);
  const [keyExam, setKeyExam] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserName(user.displayName || user.email);

        // Pobranie danych użytkownika z Firestore
        const userRef = doc(db, "users", user.uid); // Zakładamy, że UID użytkownika jest kluczem w kolekcji users
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();
          setRole(userData.role); // Pobranie roli z Firestore
          setKeyExam(userData.keyExam); // Pobranie quizID z Firestore, jeśli dotyczy
        } else {
          console.error("Nie znaleziono użytkownika w Firestore");
          setRole(null);
          setKeyExam(null);
        }
      } else {
        setUserName(null);
        setRole(null);
        setKeyExam(null);
      }
    });

    return () => unsubscribe();
  }, []);
  

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
