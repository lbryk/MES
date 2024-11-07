import React, { useState, useEffect, useContext } from "react";
import { useTimer, convertToTimeFormat } from "./TimerContext";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faDoorOpen,
  faSave,
} from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import AppContext from "./AppContext";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { async } from "@firebase/util";
import { useAuth } from "../AuthContext";

library.add(faDoorOpen, faSave);

const ExitExam = () => {
  const navigate = useNavigate();
  const auth = useAuth();

  const {
    keyExam,
    setKeyExam,
    selectedAnswers,
    rightAnswers,
    sumOfRightAnswers,
    sumOfWrongAnswers,
    rightKeyAnswers,
    idBase,
    isDisabled,
    setIsDisabled,
    setRightKeyAnswers,
    setSelectedAnswers,
    setRightAnswers,
    qi,
    userName,
    setUserName,
    login,
    setLogin,
  } = useContext(AppContext);
  const { timeLeft, setTimeLeft } = useTimer();
  const { setTimerInitialized } = useTimer();
  const { setTimerStarted } = useTimer();
  const { timeUser, setTimeUser } = useContext(AppContext);
  const { id, setId } = useContext(AppContext);
  useEffect(() => {
    const fetchQuiz = async () => {
      const quizCollection = collection(db, `${keyExam}`);
      const q = query(quizCollection);
      const querySnapshot = await getDocs(q);
      const quizData = [];

      querySnapshot.forEach((doc) => {
        quizData.push({
          id: doc.id,
          ...doc.data(),
          keyNumber: parseInt(doc.id),
        });
      });

      return quizData;
    };

    // Pobieranie wszystkich poprawnych odpowiedzi
    const displayAllAnswer = async () => {
      const quizData = await fetchQuiz();
      const rightKeyAnswers = [];

      quizData.sort((a, b) => a.keyNumber - b.keyNumber);

      quizData.forEach((quizItem) => {
        rightKeyAnswers.push(quizItem.answer);
      });

      setRightKeyAnswers(rightKeyAnswers);
    };

    displayAllAnswer();
  }, [keyExam, rightAnswers]);

  const { restartTimer, isPaused, setIsPaused } = useTimer();
  const countNullsInSelectedAnswers = () => {
    return selectedAnswers.reduce((count, answer) => {
      return answer === "null" ? count + 1 : count;
    }, 0);
  };
  // funkcja licząca ilość udzielonych odpowiedzi
  const countAnswersInSelectedAnswers = () => {
    return selectedAnswers.reduce((count, answer) => {
      return answer !== "null" ? count + 1 : count;
    }, 0);
  };

  const countNull = countNullsInSelectedAnswers();
  const countUserAnswers = countAnswersInSelectedAnswers();
  const percentResult = Math.round((sumOfRightAnswers / 40) * 100 * 100) / 100;
  const divClassName = sumOfRightAnswers >= 20 ? "checkquest" : "notquest";
  const divText = sumOfRightAnswers >= 20 ? "Egzamin zdany" : "Egzamin oblany";
  setTimeLeft(0);
  useEffect(() => {
    const docRef = doc(db, "users", `user${login}`);
    const updateUserData = async () => {
      const currentDate = new Date();
      const formattedDate = `${String(currentDate.getDate()).padStart(
        2,
        "0"
      )}.${String(currentDate.getMonth() + 1).padStart(
        2,
        "0"
      )}.${currentDate.getFullYear()}`;
      await setDoc(docRef, { quizResult: sumOfRightAnswers }, { merge: true });
      await setDoc(docRef, { percentResult: percentResult }, { merge: true });
      await setDoc(docRef, { attemptToSolve: 1 }, { merge: true });
      await setDoc(docRef, { examDate: formattedDate }, { merge: true });
      await setDoc(docRef, { inLegal: 0 }, { merge: true });
    };
    updateUserData();
  }, [db, login, sumOfRightAnswers, percentResult]);

  useEffect(() => {
    if (!auth.user || userName == "" || userName.length == 0) {
      navigate("/login", { replace: true });
    }
  }, [auth.user, navigate]);

  const reset = async () => {
    await deleteUserSession(userName);
    auth.logout();
  };

  let ansTab = [];
  for (let i = 0; i < 40; i++) {
    const lp = i + 1;
    ansTab.push({
      key: i,
      value: (
        <div>
          {lp}. {rightKeyAnswers[i]}
          <br />
        </div>
      ),
    });
  }

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

  const exportAnswersToFile = () => {
    const content = selectedAnswers
      .map(
        (answer, index) =>
          `Pytanie ${index + 1}\n${
            answer !== "null" ? answer : "Nie udzielono odpowiedzi"
          }`
      )
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${userName}_odpowiedzi.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const docRef = doc(db, "users", `user${login}`);
    const updateUserData = async () => {
      await setDoc(docRef, { myAnswers: selectedAnswers }, { merge: true });
    };
    updateUserData();
  }, [db, login, selectedAnswers]);

  return (
    <div>
      <div className="container">
        <Header />
        <div className="row header wrapper">
          <div className="col list-header">Egzamin został zakończony</div>
        </div>
        <div className="row questions-quest">
          <div className="col-1 questions-column"></div>
          <div className="col-11 questions">
            <div className="col-12 reportTitle">
              <span className="raportHeadertext">Raport</span>
            </div>
            Twój wynik: <b>{percentResult}%</b>
            <br />
            <span className={`col ${divClassName}`}>{divText}</span>
            <br />
            <hr />
            Liczba udzielonych odpowiedzi: {countUserAnswers}
            <br />
            Liczba nieudzielonych odpowiedzi: {countNull}
            <br />
            Liczba poprawnych odpowiedzi: {sumOfRightAnswers} <br />
            Liczba błędnych odpowiedzi: {sumOfWrongAnswers}
            <br />
            <br />
            <button onClick={exportAnswersToFile} className="btn btn-info">
              Eksportuj swoje odpowiedzi {}
              <FontAwesomeIcon icon="fa-solid fa-save" />
            </button>
            {/* <div className='col-12 reportTitle'>
							<span className='raportHeadertext'>Klucz odpowiedzi</span>
						</div>
						<div>
							{ansTab.map((v) => {
								return <div key={v.key}>{v.value}</div>;
							})}
						</div> */}
          </div>
        </div>
        <div className="col-12 quest-buttons">
          <Link to={`/`}>
            <button
              type="button"
              className="btn-classic accept-quest"
              onClick={reset}>
              Wyloguj się z systemu&nbsp;
              <FontAwesomeIcon icon="fa-solid fa-door-open" />
            </button>
          </Link>
        </div>
        <div className="space"></div>
      </div>
      <Footer />
    </div>
  );
};

export default ExitExam;
