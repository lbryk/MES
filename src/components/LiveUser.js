import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { Table, Button } from "react-bootstrap";
import { useAuth } from "../AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faDoorClosed, faDoorOpen } from "@fortawesome/free-solid-svg-icons";
import AlertTitle from "@mui/material/AlertTitle";
import Alert from "@mui/material/Alert";
library.add(faDoorClosed, faDoorOpen);

const LiveUser = () => {
  const [loggedUsers, setLoggedUsers] = useState([]);
  const [qualifications, setQualifications] = useState({});
  const { user } = useAuth();
  const HEARTBEAT_INTERVAL = 5000; // 5 sekund

  const [users, setUsers] = useState([]);

  // Aktualizacja statusu użytkownika co 5 sekund (heartbeat)
  const sendHeartbeat = async () => {
    if (user) {
      const userRef = doc(db, "userSessions", user.uid); // Użyj UID jako unikalny identyfikator
      try {
        await updateDoc(userRef, {
          isActive: true,
          lastActive: serverTimestamp(),
        });
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
          firstName: user.firstName,
          lastName: user.lastName,
          login: user.login,
          quizID: user.quizID,
          class: user.class, // Dodajemy pole klasy
          isActive: true,
          lastActive: serverTimestamp(),
        });
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
    } catch (error) {}
  };

  // Nasłuchiwanie aktywnych użytkowników (dla wszystkich sesji)
  const listenToActiveSessions = () => {
    const sessionsCollection = collection(db, "userSessions");
    const q = query(
      sessionsCollection,
      where("isActive", "==", true) // Nasłuchuj wszystkich aktywnych sesji, bez filtrowania po quizID
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        console.log("Brak aktywnych sesji.");
      } else {
        snapshot.docs.forEach((doc) => console.log(doc.data()));
      }

      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLoggedUsers(usersData);
      fetchQualificationsForUsers(usersData);
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
    const unsubscribeUsers = listenToUsers();
    return () => {
      if (unsubscribe) unsubscribe();
      if (unsubscribeUsers) unsubscribeUsers();
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

  // Function to format qualification (e.g., "inf03" -> "INF-03")
  const formatQualification = (qualification) => {
    return qualification.replace(
      /([a-zA-Z]+)(\d+)/,
      (match, letters, digits) => {
        return `${letters.toUpperCase()}-${digits}`;
      }
    );
  };

  // Function to fetch qualification for a given quizID
  const fetchQualification = async (quizID) => {
    if (!quizID) return "";
    const quizDoc = doc(db, "quizCode", quizID);
    const quizSnap = await getDoc(quizDoc);
    if (quizSnap.exists()) {
      const qualification = quizSnap.data().Qualification;
      return formatQualification(qualification);
    }
    return "";
  };

  const fetchQualificationsForUsers = async (users) => {
    const qualificationsMap = {};
    for (const user of users) {
      const qualification = await fetchQualification(user.quizID);
      qualificationsMap[user.quizID] = qualification;
    }
    setQualifications(qualificationsMap);
  };

  const getUniqueClasses = (users) => {
    const classes = users.map((user) => user.class);
    return [...new Set(classes)]; // Usuwamy duplikaty
  };

  const listenToUsers = () => {
    const usersCollection = collection(db, "users");

    const unsubscribe = onSnapshot(usersCollection, (snapshot) => {
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
    });

    return unsubscribe;
  };

  return (
    <div className="admin-panel mt-4">
      <h4>Aktualnie trwające egzaminy</h4>
      {loggedUsers.length === 0 ? (
        // <div className="alert alert-info" role="alert">
        //   Brak aktywnych zdających
        // </div>
        <Alert severity="info">
          <AlertTitle>Monitoring zdających</AlertTitle>
          Brak aktywnych zdających
        </Alert>
      ) : (
        Object.keys(groupedUsers).map((quizID) => (
          <div key={quizID} className="mt-4">
            <h3>Kod egzaminu: {quizID}</h3>
            <h5>
              Klasy zdające: {getUniqueClasses(groupedUsers[quizID]).join(", ")}
            </h5>
            <Table className="table table-striped" striped bordered hover>
              <thead>
                <tr>
                  <th>Imię i Nazwisko</th>
                  <th>Login zdającego</th>
                  <th>Klasa</th>
                  <th>Kod egzaminu</th>
                  <th>Kwalifikacja</th>
                  <th>Status</th>
                  <th>Nielegalne opuszczenie arkusza</th>
                  <th>Akcja</th>
                </tr>
              </thead>
              <tbody>
                {groupedUsers[quizID].map((user) => {
                  // Znajdź odpowiadającego użytkownika w kolekcji `users`
                  const matchingUser = users.find(
                    (u) => u.id === `user${user.login}`
                  );
                  const inLegalCount = matchingUser
                    ? matchingUser.inLegal || 0
                    : 0;

                  return (
                    <tr key={user.id}>
                      <td>{user.userID}</td>
                      <td>{user.login}</td>
                      <td>{user.class}</td>
                      <td>{user.quizID}</td>
                      <td>{qualifications[user.quizID]}</td>
                      <td>Aktywny</td>
                      <td>{inLegalCount}</td>
                      <td>
                        <Button
                          variant="danger"
                          onClick={() => endSessionForUser(user.id)}>
                          <FontAwesomeIcon icon="fa-solid fa-door-open" />{" "}
                          Przerwij egzamin
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        ))
      )}
      <div style={{ height: 50 }}></div>
    </div>
  );
};

export default LiveUser;