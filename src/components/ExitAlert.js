import React, { useContext } from "react";
import { useTimer } from "./TimerContext";
import AppContext from "./AppContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

const ExitAlert = ({
  header,
  message,
  show,
  onClose,
  buttons,
  handleLogout,
}) => {
  const auth = useAuth();
  const { setIsDisabled, userName } = useContext(AppContext);
  const { timeLeft, setTimeLeft } = useTimer();
  const { restartTimer, isPaused, setIsPaused } = useTimer();
  const finish = useNavigate();

  if (!show) return null;

  const exit = async () => {
    setIsPaused(!isPaused);
    setIsDisabled(true); // blokowanie formularza
    restartTimer();
    if (timeLeft !== 0) {
      finish(`/finish`);
    } else {
      await deleteUserSession(userName); // Usuń sesję użytkownika
      handleLogout(); // Wywołaj wylogowanie
    }
  };

  // Funkcja usuwająca sesję
  const deleteUserSession = async (userName) => {
    if (userName) {
      const sessionRef = doc(db, "userSessions", userName); // Dokument sesji użytkownika
      try {
        await deleteDoc(sessionRef);
        console.log(`Usunięto sesję dla użytkownika ${userName}`);
      } catch (error) {
        console.error("Błąd podczas usuwania sesji:", error);
      }
    }
  };

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert">
        <div className="row">
          <div className="col-11 alert-header">{header}</div>
          <div className="col-1 close" onClick={onClose}>
            x
          </div>
        </div>
        <div className="box-message col-12">
          <div className="custom-alert-message">{message}</div>
        </div>
        <div className="alertButtons">
          {buttons === "NoYes" && (
            <>
              <button className="custom-alert-button" onClick={onClose}>
                Nie, pozostań
              </button>
              <button
                className="custom-alert-button custom-alert-close"
                onClick={exit}>
                Tak, zakończ
              </button>
            </>
          )}
          {buttons === "Ok" && (
            <button className="custom-alert-button" onClick={onClose}>
              Ok
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExitAlert;
