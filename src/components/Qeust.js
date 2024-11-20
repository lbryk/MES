import React, { useState, useEffect, useContext } from "react";
import { useTimer, convertToTimeFormat } from "./TimerContext";
import { useParams, useNavigate } from "react-router-dom";
import Header from "./Header";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCheck, faRightFromBracket } from "@fortawesome/free-solid-svg-icons";
import Footer from "./Footer";
import ExitExam from "./ExitExam";
import AppContext from "./AppContext";
import QuizLoader from "./QuizLoader";
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

library.add(faCheck);

const Quest = () => {
  const [showModal, setShowModal] = useState(false);
  const {
    keyExam,
    idBase,
    rightAnswers,
    updateRightAnswers,
    selectedAnswers,
    setSelectedAnswers,
    rightKeyAnswers,
    setRightKeyAnswers,
    qi,
    login,
    userName,
  } = useContext(AppContext);
  const { id, setId } = useContext(AppContext);
  const { timeLeft, timerInitialized, setTimerInitialized } = useTimer();
  const { minutes, remainingSeconds } = convertToTimeFormat(timeLeft);
  const [showError, setShowError] = useState(false);
  const [Question, setQuestion] = useState("");
  const [Aradio, setA] = useState("");
  const [Bradio, setB] = useState("");
  const [Cradio, setC] = useState("");
  const [Dradio, setD] = useState("");
  const [Answer, setAnswer] = useState("");
  const [AllAnswer, setAllAnswer] = useState("");
  const { kid: iAsString } = useParams();
  const kid = parseInt(iAsString);
  const i = qi;
  const [selectedAnswer, setSelectedAnswer] = useState([]); // to musi być!!!!
  const [tempSelectedAnswer, setTempSelectedAnswer] = useState([]);
  const history = useNavigate();
  const finish = useNavigate();

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
      sessionStorage.setItem("pathBeforeRefresh", window.location.pathname);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      finish("/finish");
    }
  }, [timeLeft]);

  useEffect(() => {
    if (!timerInitialized) {
      setTimerInitialized(true);
    }
  }, []);

  useEffect(() => {
    setTempSelectedAnswer([...selectedAnswers]);
  }, [i, selectedAnswers]);

  const { quizData, isLoading } = useContext(AppContext);

  const displayQuestion = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setQuestion(quizItem.question);
      }
    });
  };

  const displayA = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setA(quizItem.a); // assuming 'a' is the property in your quiz item for 'A' option
      }
    });
  };

  const displayB = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setB(quizItem.b); // assuming 'a' is the property in your quiz item for 'A' option
      }
    });
  };

  const displayC = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setC(quizItem.c); // assuming 'a' is the property in your quiz item for 'A' option
      }
    });
  };

  const displayD = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setD(quizItem.d); // assuming 'a' is the property in your quiz item for 'A' option
      }
    });
  };

  const displayAnswer = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setAnswer(quizItem.answer); // assuming 'answer' is the property in your quiz item for the answer
      }
    });
  };

  const displayAllAnswer = () => {
    quizData.forEach((quizItem) => {
      if (quizItem.id === `${i}`) {
        setAllAnswer(quizItem.allAnswer); // assuming 'allAnswer' is the property in your quiz item for all answers
      }
    });
  };

  useEffect(() => {
    if (!isLoading) {
      displayA();
      displayB();
      displayC();
      displayD();
      displayAnswer();
      displayQuestion();
      displayAllAnswer();
    }
  }, [quizData, i, isLoading]);
  const countAnswersInSelectedAnswers = () => {
    return selectedAnswers.reduce((count, answer) => {
      return answer !== "null" ? count + 1 : count;
    }, 0);
  };

  const countUserAnswers = countAnswersInSelectedAnswers();

  const handleChange = (event) => {
    const value = event.target.value;
    const index = i - 1;
    setTempSelectedAnswer(value);

    setTempSelectedAnswer((prevSelectedAnswers) => {
      const updatedSelected = [...prevSelectedAnswers];
      updatedSelected[index] = value;
      return updatedSelected;
    });
  };

  const saveAnswer = () => {
    const index = i - 1;

    if (
      tempSelectedAnswer[index] &&
      tempSelectedAnswer[index] !== "null" &&
      tempSelectedAnswer[index] !== ""
    ) {
      setShowError(false);

      setSelectedAnswers((prevSelectedAnswers) => {
        const updatedSelected = [...prevSelectedAnswers];
        updatedSelected[index] = tempSelectedAnswer[index];
        return updatedSelected;
      });

      if (tempSelectedAnswer[index] === Answer) {
        updateRightAnswers(index, 1);
      } else {
        updateRightAnswers(index, 0);
      }

      history(`/${id}`);
    } else {
      setShowError(true);
    }
  };

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
      <div className="container">
        <Header />
        <div className="row header wrapper ">
          <div className=" col-12 header-quest">
            <div className="quest-content quest-wrapper row">
              <div className="col-7 quest-info">
                <strong>
                  <small>Liczba udzielonych odpowiedzi </small>
                  <input
                    className="form-control form-control-sm short-field"
                    type="text"
                    value={countUserAnswers}
                    disabled
                  />
                </strong>
              </div>
              <div className="col-5 time-quest">
                Do końca egzaminu pozostało: &nbsp;
                <span className="time-quest--text">
                  {minutes < 10 ? `0${minutes}` : minutes}:
                  {remainingSeconds < 10
                    ? `0${remainingSeconds}`
                    : remainingSeconds}
                </span>
              </div>
            </div>
            <div className="col-12 quest-wrapper list-header">
              Zadanie nr: {i}
            </div>
            <div className="row questions-quest">
              <div className="col-1 questions-column"></div>
              <div className="col-11 questions">
                <div dangerouslySetInnerHTML={{ __html: Question }}></div>
                <hr />
                <div className="col-12 answers">
                  <form name="answers" className="answersForm">
                    <input
                      type="radio"
                      className="answer"
                      name="answer"
                      value="a"
                      id="selectAnswerA"
                      onChange={handleChange}
                      checked={tempSelectedAnswer[i - 1] === "a"}
                    />
                    &nbsp;
                    <label htmlFor="selectAnswerA" class="form-check-label">
                      <strong> A. </strong>
                      <span dangerouslySetInnerHTML={{ __html: Aradio }}></span>
                    </label>
                    <br />
                    <input
                      type="radio"
                      className="answer"
                      name="answer"
                      value="b"
                      id="selectAnswerB"
                      onChange={handleChange}
                      checked={tempSelectedAnswer[i - 1] === "b"}
                    />
                    &nbsp;
                    <label htmlFor="selectAnswerB" class="form-check-label">
                      <strong> B. </strong>
                      <span dangerouslySetInnerHTML={{ __html: Bradio }}></span>
                    </label>
                    <br />
                    <input
                      type="radio"
                      className="answer"
                      name="answer"
                      value="c"
                      id="selectAnswerC"
                      onChange={handleChange}
                      checked={tempSelectedAnswer[i - 1] === "c"}
                    />
                    &nbsp;
                    <label htmlFor="selectAnswerC" class="form-check-label">
                      <strong> C. </strong>
                      <span dangerouslySetInnerHTML={{ __html: Cradio }}></span>
                    </label>
                    <br />
                    <input
                      type="radio"
                      className="answer"
                      name="answer"
                      value="d"
                      id="selectAnswerD"
                      onChange={handleChange}
                      checked={tempSelectedAnswer[i - 1] === "d"}
                    />
                    &nbsp;
                    <label htmlFor="selectAnswerD" class="form-check-label">
                      <strong> D. </strong>
                      <span dangerouslySetInnerHTML={{ __html: Dradio }}></span>
                    </label>
                    <br />
                  </form>
                </div>
              </div>
            </div>
            <div className="col-12 quest-buttons">
              <Link to={`/${id}`}>
                <button type="button" className="btn-cancel">
                  Anuluj
                </button>
              </Link>
              {/* <Link to={`/${idBase[0]}`}> */}
              <button
                type="button"
                onClick={saveAnswer}
                className="btn-classic accept-quest">
                Zatwierdź odpowiedź&nbsp;
                <FontAwesomeIcon icon="fa-solid fa-check" />
              </button>
              {/* </Link> */}
              {showError && (
                <div className="alert alert-danger" role="alert">
                  Proszę wybrać odpowiedź
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="space"></div>
      </div>
      <Footer />
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Uwaga! {userName} </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <b>
            <p class="text-danger">
              Wykryłem nielegalną próbę opuszczenia arkusza egzaminacyjnego!
            </p>
          </b>
          Każda taka próba jest rejestrowana i może zakończyć się przerwaniem
          egzaminu przez asystenta.
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

export default Quest;
