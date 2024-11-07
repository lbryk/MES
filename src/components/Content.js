import React, { useEffect, useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import Widget from "./Widget";
import Quest from "./Qeust";
import AppContext from "./AppContext";
import { useTimer } from "./TimerContext";
import { useAuth } from "../AuthContext";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore"; // Poprawny import Firebase
import { db } from "../firebase";
import { Modal, Button } from "react-bootstrap";

library.add(faRightFromBracket);

const Content = () => {
  const [showModal, setShowModal] = useState(false);
  const {
    rightAnswers,
    sumOfRightAnswers,
    idBase,
    selectedAnswers,
    isDisabled,
    setIsDisabled,
    qi,
    setQi,
  } = useContext(AppContext);
  const { id, setId } = useContext(AppContext);
  // setId(useState(window.location.href.split('/').pop()));
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { userName, keyExam, role, login } = useContext(AppContext);
  const { restartTimer, isPaused, setIsPaused } = useTimer(); // Timer controls

  const deleteUserSession = async (userName) => {
    if (userName) {
      const sessionRef = doc(db, "userSessions", userName); // Reference to the session document
      try {
        await deleteDoc(sessionRef);
      } catch (error) {}
    }
  };

  const updateAttemptToSolve = async (login) => {
    if (login) {
      const userRef = doc(db, "users", "user" + login); // Using login as document ID
      try {
        await updateDoc(userRef, { attemptToSolve: 1 });
      } catch (error) {}
    }
  };

  const handleLogoutAndRedirect = async () => {
    try {
      // Step 1: Fetch the login field from userSessions collection
      const sessionRef = doc(db, "userSessions", userName);
      const sessionDoc = await getDoc(sessionRef);

      if (sessionDoc.exists()) {
        const { login } = sessionDoc.data();

        if (login) {
          // Step 2: Use the retrieved login to update attemptToSolve
          await updateAttemptToSolve(login);
          await deleteUserSession(userName); // Delete the user session
        }
      }
    } catch (error) {
      console.error(
        "Błąd podczas obsługi wylogowania i przekierowania:",
        error
      );
    }

    setIsPaused(!isPaused);
    setIsDisabled(true);
    restartTimer();
    logout();
    navigate("/exitExam");
  };

  console.log(selectedAnswers);
  useEffect(() => {
    if (userName) {
      const sessionRef = doc(db, "userSessions", userName);
      const unsubscribe = onSnapshot(sessionRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          if (data.isActive === false) {
            alert("Egzamin został przerwany przez administratora.");
            handleLogoutAndRedirect();
          }
        }
      });

      return () => unsubscribe(); // Cleanup the listener on unmount
    }
  }, [userName, logout, navigate]);

  const { timeLeft, timerInitialized, setTimerInitialized } = useTimer();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (!timerInitialized) {
      setTimerInitialized(true);
    }
  }, []);

  const log = useNavigate();
  if (id === undefined || id == "" || id == " ") {
    log("/login");
  }
  const finish = useNavigate();

  useEffect(() => {
    if (timeLeft === 0) {
      finish("/finish");
    }
  }, [timeLeft]);

  let tab = [];

  useEffect(() => {
    if (isDisabled === true) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  }, [showError]);

  for (let i = 1; i <= 40; i++) {
    const answer = selectedAnswers[i - 1];
    const divClassName = answer === "null" ? "notquest" : "checkquest";
    const divText =
      answer === "null"
        ? "Nie udzielono odpowiedzi"
        : "Udzielono odpowiedzi (możesz zmienić odpowiedź)";
    const infoQ =
      isDisabled === true
        ? "Nie można zmieniać odpowiedzi po zakończonym egzaminie"
        : "";
    tab.push({
      key: i,
      value: (
        <div className="row task">
          <div className="col-lg-5 col-md-12 col-sm-12 col-xs-11">
            {/* <Link to={`/quest/${i}`}> */}
            <Link to={`/quest/${i}/${id}`}>
              <button
                type="button"
                className="btn-classic"
                onClick={() => setQi(i)}
                disabled={isDisabled}>
                Zadanie {i}
              </button>
            </Link>
          </div>

          <div className={`col ${divClassName}`}>{divText}</div>
          <div>{infoQ}</div>
        </div>
      ),
    });
  }

  const updateInLegalCount = async () => {
    if (login) {
      const userRef = doc(db, "users", `user${login}`);
      try {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentCount = userDoc.data().inLegal || 0; // Pobierz obecny licznik, jeśli istnieje
          await updateDoc(userRef, {
            inLegal: currentCount + 1, // Zwiększ licznik o 1
          });
          console.log("Licznik inLegal zaktualizowany");
        }
      } catch (error) {
        console.error("Błąd podczas aktualizacji pola inLegal:", error);
      }
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === "hidden") {
      setShowModal(true);
    }
  };

  useEffect(() => {
    // Dodanie listenera do zdarzenia zamknięcia okna
    const handleBlur = () => {
      setShowModal(true);
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleModalClose = () => {
    // Zamknięcie okna modalnego
    setShowModal(false);

    // Następnie aktualizacja licznika
    updateInLegalCount();
  };


  return (
    <div>
      <div className="row header wrapper">
        <div className="col-12 list-header">Egzamin lista zadań</div>
        {showError && (
          <div className="col- 12 alert alert-danger" role="alert">
            Egzamin został zakończony! <br /> Odśwież stronę aby rozpocząć
            ponownie egzamin lub klinkij "zakończ egzamin" aby zobaczyć wynik i
            raport ostatniego egzaminu
          </div>
        )}
      </div>
      <div className="row">
        <div className="col-8 list-task">
          {tab.map((v) => {
            return <div key={v.key}>{v.value}</div>;
          })}
        </div>
        <div className="col-lg-3 col-md-11 col-sm-8 col-xs-5 widget">
          <Widget />
        </div>
      </div>
      <div className="space"></div>
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Uwaga! {userName} </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b><p class="text-danger">Wykryłem nielegalną próbę opuszczenia arkusza egzaminacyjnego!</p></b>Każda taka próba
          jest rejestrowana i może zakończyć się przerwaniem egzaminu przez
          asystenta.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleModalClose}>
            Rozumiem
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Content;
