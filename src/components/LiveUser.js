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
import { Table, Button } from "react-bootstrap";
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
          quizID: user.quizID, // Zakładamy, że quizID jest częścią danych
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
  const endSessionForUser = async (userID) => {
    const sessionRef = doc(db, "userSessions", userID);
    try {
      await updateDoc(sessionRef, {
        isActive: false,
        lastActive: serverTimestamp(),
      });
      console.log(`Przerwano egzamin dla użytkownika: ${userID}`);
    } catch (error) {
      console.error("Błąd przy przerwaniu egzaminu:", error);
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

  // Grupa użytkowników według `quizID`
  const groupUsersByQuizID = () => {
    const groupedUsers = {};
    loggedUsers.forEach((user) => {
      if (!groupedUsers[user.quizID]) {
        groupedUsers[user.quizID] = [];
      }
      groupedUsers[user.quizID].push(user);
    });
    return groupedUsers;
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

      window.addEventListener("beforeunload", () =>
        endSessionForUser(user.uid)
      );

      return () => {
        clearInterval(heartbeatInterval);
        endSessionForUser(user.uid); // zakończ sesję przy unmount komponentu
        window.removeEventListener("beforeunload", () =>
          endSessionForUser(user.uid)
        );
      };
    }
  }, [user]);

  const groupedUsers = groupUsersByQuizID();

  return (
    <div className="admin-panel mt-4">
      <h2>Użytkownicy pracujący nad arkuszami</h2>
      {Object.keys(groupedUsers).map((quizID) => (
        <div key={quizID} className="mt-4">
          <h3>Kod egzaminu: {quizID}</h3>
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Imię i Nazwisko</th>
                <th>Kod egzaminu</th>
                <th>Status</th>
                <th>Akcja</th> {/* Kolumna dla przycisku */}
              </tr>
            </thead>
            <tbody>
              {groupedUsers[quizID].map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.quizID}</td>
                  <td>Aktywny</td>
                  <td>
                    <Button
                      variant="danger"
                      onClick={() => endSessionForUser(user.id)}>
                      Przerwij egzamin
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ))}
    </div>
  );
};

export default LiveUser;
