import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { Table } from "react-bootstrap";
import { useAuth } from "../AuthContext";

const LiveUser = () => {
  const [loggedUsers, setLoggedUsers] = useState([]);
  const { user } = useAuth();
  const HEARTBEAT_INTERVAL = 5000; // 5 sekund

  // Aktualizacja statusu użytkownika co 5 sekund (heartbeat)
  const sendHeartbeat = async () => {
    if (user) {
      const userRef = doc(db, "userSessions", user.uid); // Użyj UID jako unikalny identyfikator
      try {
        await updateDoc(userRef, {
          isActive: true,
          lastActive: serverTimestamp(),
        });
        console.log("Wysłano heartbeat dla użytkownika:", user.userName);
      } catch (error) {
        console.error("Błąd przy wysyłaniu heartbeat:", error);
      }
    }
  };

  // Inicjalizacja nowej sesji dla użytkownika
  const createSession = async () => {
    if (user) {
      const sessionRef = doc(db, "userSessions", user.uid);
      try {
        await setDoc(sessionRef, {
          userID: user.uid,
          firstName: user.firstName, // Zakładam, że masz takie pole w użytkowniku
          lastName: user.lastName, // Dodajemy dane użytkownika
          isActive: true,
          lastActive: serverTimestamp(),
        });
        console.log("Utworzono sesję dla użytkownika:", user.uid);
      } catch (error) {
        console.error("Błąd przy tworzeniu sesji:", error);
      }
    }
  };

  // Zakończenie sesji użytkownika
  const endSession = async () => {
    if (user) {
      const sessionRef = doc(db, "userSessions", user.uid);
      try {
        await updateDoc(sessionRef, {
          isActive: false,
          lastActive: serverTimestamp(),
        });
        console.log("Zakończono sesję użytkownika:", user.uid);
      } catch (error) {
        console.error("Błąd przy zakończeniu sesji:", error);
      }
    }
  };

  // Nasłuchiwanie aktywnych użytkowników (dla wszystkich sesji)
  const listenToActiveSessions = () => {
    const sessionsCollection = collection(db, "userSessions");
    const q = query(
      sessionsCollection,
      where("isActive", "==", true) // Nasłuchuj wszystkich aktywnych sesji, bez filtrowania po quizID
    );

    console.log("Nasłuchiwanie wszystkich aktywnych sesji...");

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log("Brak aktywnych sesji.");
      } else {
        console.log("Aktywne sesje znalezione:");
        snapshot.docs.forEach((doc) => console.log(doc.data()));
      }

      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLoggedUsers(usersData);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = listenToActiveSessions();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user) {
      createSession();
      const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

      window.addEventListener("beforeunload", endSession);

      return () => {
        clearInterval(heartbeatInterval);
        endSession(); // zakończ sesję przy unmount komponentu
        window.removeEventListener("beforeunload", endSession);
      };
    }
  }, [user]);

  return (
    <div className="admin-panel">
      <h2>Lista aktywnych użytkowników</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Imię i Nazwisko</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {loggedUsers.length > 0 ? (
            loggedUsers.map((user) => (
              <tr key={user.id}>
                <td>
                  {user.id} 
                </td>
                <td>Aktywny</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">Brak zalogowanych użytkowników.</td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  );
};

export default LiveUser;
