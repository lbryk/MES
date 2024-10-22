import React, { useState, useEffect, useContext } from "react";
import "./LoginExam.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { useTimer } from "./components/TimerContext";
import AppContext from "./components/AppContext";
import { useNavigate } from "react-router-dom";
import { Form, Button } from "react-bootstrap";
import {db} from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import ExitAlert from "./components/ExitAlert";
import AdminPanel from "./components/AdminPanel";
import { useAuth } from "./AuthContext";

const LoginExam = () => {
  const { login, setLogin } = useContext(AppContext);
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const navigate = useNavigate();
  const { userName, setUserName } = useContext(AppContext);
  const { id, setId } = useContext(AppContext);
  const { currentUser, setCurrentUser } = useContext(AppContext);
  const { timeUser, setTimeUser } = useContext(AppContext);
  const { timeLeft, setTimeLeft } = useTimer();
  const { setTimerInitialized } = useTimer();
  const { setTimerStarted } = useTimer();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const { userRole, setUserRole } = useContext(AppContext);
  const { user, logout } = useAuth();

  const handleAlert = () => {
    setShowAlert(true);
  };

  const closeAlert = () => {
    setShowAlert(false);
  };

  useEffect(() => {
    const timeInSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60 : 0;
    setTimeLeft(timeInSeconds);
  }, [timeUser]);

   useEffect(() => {
     if (user && user.userName) {
       // Check that we have a valid user and userName
       const userSessionRef = doc(db, "userSessions", user.userName); // Ensure userName is used for sessions
       console.log("Listening for session changes for:", user.userName);

       const unsubscribe = onSnapshot(userSessionRef, (doc) => {
         if (doc.exists()) {
           const data = doc.data();
           console.log("Session data:", data);
           if (data.isActive === false) {
             alert("Egzamin został przerwany przez administratora.");
             logout(); // Log the user out
             navigate("/exitExam", { replace: true }); // Navigate to ExitExam component
           }
         } else {
           console.error("Session document does not exist.");
         }
       });

       return () => unsubscribe();
     } else {
       console.error("User not found or userName missing.");
     }
   }, [user, logout, navigate]);

  const handleButtonClick = async (event) => {
    event.preventDefault();
    const docRef = doc(db, "users", `user${login}`);
    const docSnap = await getDoc(docRef);
    const usernameWithPrefix = `user${login}`;

    if (docSnap.exists() && docSnap.data().password === password) {
      setCurrentUser(usernameWithPrefix);
      auth.login({
        userName: `${docSnap.data().firstname} ${docSnap.data().lastname}`,
        role: docSnap.data().role,
      });

      if (docSnap.data().role == "s" && docSnap.data().attemptToSolve == "0") {
        const userNameFromDoc = `${docSnap.data().firstname} ${
          docSnap.data().lastname
        }`;
        const quizIDFromDoc = `${docSnap.data().quizID}`;
        
        setUserName(`${docSnap.data().firstname} ${docSnap.data().lastname}`);
        setId(`${docSnap.data().quizID}`);
        setTimeUser(`/${docSnap.data().quizTime}`);
        setTimeLeft(`/${docSnap.data().quizTime}`);
        setTimerInitialized(true);
        setTimerStarted(true);
        await createUserSession(userNameFromDoc, quizIDFromDoc);
        navigate(`/${docSnap.data().quizID}`);
      } else if (docSnap.data().role == "sa" || docSnap.data().role == "a") {
        setUserName(`${docSnap.data().firstname} ${docSnap.data().lastname}`);
        setUserRole(docSnap.data().role);
        // setUserId(`user${login}`);
        navigate(`/admin`);
      } else {
        setShowAlert(true);
        <ExitAlert
          header="System próbnych egzaminów zawodowych"
          message="Wystąpił problem z zalogowaniem"
          show={showAlert}
          onClose={closeAlert}
          buttons="Ok"
        />;
      }
    } else {
      setShowAlert(true);
      <ExitAlert
        header="System próbnych egzaminów zawodowych"
        message="Błędny login lub hasło"
        show={showAlert}
        onClose={closeAlert}
        buttons="Ok"
      />;
    }
  };

  // Funkcja tworząca sesję użytkownika
  const createUserSession = async (userName, quizID) => {
    if (userName && quizID) {
      const sessionRef = doc(db, "userSessions", userName); // Używamy `userName` jako identyfikatora dokumentu
      try {
        await setDoc(sessionRef, {
          userID: userName, // Używamy `userName` zamiast `user.uid`
          quizID: quizID, // Identyfikator egzaminu
          isActive: true, // Ustawiamy użytkownika jako aktywnego
          lastActive: serverTimestamp(), // Czas rozpoczęcia sesji
        });
        console.log("Utworzono sesję użytkownika w 'userSessions':", userName);
      } catch (error) {
        console.error("Błąd przy tworzeniu sesji użytkownika:", error);
      }
    } else {
      console.error("Brak userName lub quizID. Nie można utworzyć sesji.");
    }
  };

// useEffect(() => {
//   if (user) {
//     console.log("Nasłuchiwanie sesji użytkownika:", user.uid);

//     const userSessionRef = doc(db, "userSessions", user.uid);
//     const unsubscribe = onSnapshot(userSessionRef, (doc) => {
//       if (doc.exists()) {
//         const data = doc.data();
//         if (data.isActive === false) {
//           alert("Egzamin został przerwany przez administratora.");
//           navigate("/login");
//         }
//       }
//     });

//     return () => unsubscribe();
//   } else {
//     console.log("Brak zalogowanego użytkownika.");
//   }
// }, [user, navigate]);




  return (
    <div className="bodyLog">
      <div className="container conLog">
        <Form onSubmit={handleButtonClick}>
          <Form.Group className="groupForm" controlId="formBasicEmail">
            <Form.Label>Login:</Form.Label>
            <Form.Control
              className="fieldsLogin"
              type="text"
              placeholder="Podaj login zdającego"
              onChange={(e) => setLogin(e.target.value)}
            />
            <Form.Text className="text-muted">
              We'll never share your login with anyone else.
            </Form.Text>
          </Form.Group>

          <Form.Group className="groupForm" controlId="formBasicPassword">
            <Form.Label>Hasło:</Form.Label>
            <Form.Control
              className="fieldsLogin"
              type="password"
              placeholder="Wprowadź hasło do egzaminu"
              onChange={(e) => setPassword(e.target.value)}
            />
            <Form.Text className="text-muted">
              We'll never share your password with anyone else.
            </Form.Text>
          </Form.Group>
          <div className="submitForm">
            <Button
              className="submitLogin col-7"
              variant="primary"
              type="submit">
              Rozpocznij
            </Button>
          </div>
        </Form>
      </div>

      <ExitAlert
        header="System próbnych egzaminów zawodowych"
        message="Nie zalogowano."
        show={showAlert}
        onClose={closeAlert}
        buttons="Ok"
      />
    </div>
  );
};

export default LoginExam;
