import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle";
import { Button, Badge, Collapse } from "react-bootstrap";
import { db } from "../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import AppContext from "./AppContext";
import Pagination from "./Pagination";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
library.add(faEye);

const ExamList = ({ refreshKey }) => {
  const [exams, setExams] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [expandedExams, setExpandedExams] = useState({});
  const { userName } = useContext(AppContext);

  const fetchExams = async () => {
    try {
      const q = query(collection(db, "quizCode"));
      const querySnapshot = await getDocs(q);
      const examsData = querySnapshot.docs.map((doc) => {
        const exam = {
          id: doc.id,
          name: doc.id,
          qualification: doc.data().Qualification,
          profession: doc.data().Profession,
          year: doc.data().Year,
          session: doc.data().Session,
          autors: doc.data().Autors || [],
        };

        // Definiowanie collectionName w kontekście każdego egzaminu
        exam.collectionName = `${exam.qualification
          .toLowerCase()
          .replace(".", "")}${exam.year}${exam.session}`;

        return exam;
      });

      const filteredExams = examsData.filter((exam) =>
        exam.autors.includes(userName)
      );
      setExams(filteredExams);
    } catch (error) {
      console.error("Error fetching exams: ", error);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [refreshKey]);

  const handleSort = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);

    let sortedExams = [...exams];
    sortedExams.sort((a, b) => {
      if (a[field] < b[field]) return direction === "asc" ? -1 : 1;
      if (a[field] > b[field]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setExams(sortedExams);
  };

  const handleExamClick = (examId) => {
    setExpandedExams((prev) => ({
      ...prev,
      [examId]: !prev[examId],
    }));
  };

  // const handlePreviewClick = async (collectionName) => {
  //   // Otwórz nowe okno dla podglądu
  //   const previewWindow = window.open("", "_blank", "width=1000,height=800");

  //   // Pobierz pytania z Firebase
  //   const q = query(collection(db, collectionName));
  //   const querySnapshot = await getDocs(q);
  //   const questions = querySnapshot.docs.map((doc) => ({
  //     id: doc.id,
  //     ...doc.data(),
  //   }));

  //   // Tworzenie struktury HTML w nowym oknie
  //   previewWindow.document.write(`
  //     <html>
  //       <head>
  //         <title>Podgląd - ${collectionName}</title>
  //         <style>
  //           body { font-family: Arial, sans-serif; margin: 20px; }
  //           .header, .footer { background: #f5f5f5; padding: 10px; text-align: center; }
  //           .content { margin-top: 20px; }
  //           .task { margin-bottom: 15px; }
  //         </style>
  //       </head>
  //       <body>
  //         <div id="headerPreview"></div>
  //         <div id="widgetPreview"></div>
  //         <div class="content">
  //           ${questions
  //             .map(
  //               (q) =>
  //                 `<div class="task"><strong>Pytanie ${q.id}:</strong> ${q.questions}</div>`
  //             )
  //             .join("")}
  //         </div>
  //         <div id="widgetClose"></div>
  //       </body>
  //     </html>
  //   `);

  //   // Dodaj przycisk zamykania w widgetcie
  //   previewWindow.document.getElementById("widgetClose").innerHTML = `
  //     <button onclick="window.close()">Zamknij podgląd</button>
  //   `;
  // };
  const formatQualification = (qualification) => {
    // Konwertuje wszystkie litery na wielkie i dodaje "-" przed pierwszą cyfrą
    return qualification
      .toUpperCase() // Zamienia wszystkie litery na wielkie
      .replace(/(\D+)(\d+)/, "$1-$2"); // Dodaje "-" przed cyframi
  };

  const handlePreviewClick = async (collectionName, qualification) => {
    // Otwórz nowe okno dla podglądu
    const previewWindow = window.open("", "_blank", "width=1000,height=800");

    try {
      console.log("Rozpoczęcie zapytania o kolekcję pytań:", collectionName);

      // Pobierz pytania z kolekcji o nazwie exam.collectionName
      const questionsRef = collection(db, collectionName); // "collectionName" to nazwa kolekcji pytań
      const querySnapshot = await getDocs(questionsRef);

      // Pobieramy wszystkie pytania i ich pola (a, b, c, d, question, answer)
      const questions = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Określenie koloru w zależności od liczby pytań
      const questionCount = questions.length;
      const countColor = questionCount < 40 ? "red" : "green";

      // Tworzenie struktury HTML w nowym oknie, które odzwierciedla layout z obrazka
      previewWindow.document.write(`
      <html>
        <head>
          <title>Podgląd - ${collectionName}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-spacing: 20px; }
            td { vertical-align: top; }
            .content { 
              width: 65%; /* Szerokość kolumny pytań */
              word-wrap: break-word; /* Zawijanie tekstu */
            }
            .widget { 
              width: 30%; /* Stała szerokość widgetu */
              background: #f5f5f5; 
              padding: 20px;
              max-width: 300px; 
              overflow: hidden; /* Ukrywa nadmiar treści */
            }
            .task { 
              margin-bottom: 15px; 
              padding: 10px; 
              border-bottom: 1px solid #ddd; 
              word-wrap: break-word;
            }
            .footer { 
              background: #f5f5f5; 
              padding: 10px; 
              text-align: center; 
            }
            .btn-end { 
              background-color: #e74c3c; 
              color: white; 
              padding: 10px 20px; 
              border: none; 
              cursor: pointer; 
            }
            .btn-end:hover { 
              background-color: #c0392b; 
            }
            input { 
              width: 100%; 
              margin-bottom: 10px; 
              padding: 5px; 
            }
            .question-text { 
              word-wrap: break-word; 
              max-width: 100%; 
            }
            .correct-answer {
              color: green;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Autonomiczny System Egzaminacyjny - Podgląd ${collectionName}</h1>
          </div>
          <table>
            <tr>
              <td class="content">
                <h2>Egzamin Lista Zadań</h2>
                ${questions
                  .map((q, index) => {
                    // Sprawdzamy, która odpowiedź jest poprawna na podstawie pola "answer"
                    const correctAnswer = q.answer.toLowerCase();
                    const getAnswerClass = (option) =>
                      option === correctAnswer ? "correct-answer" : "";

                    return `<div class="task">
                          <p class="question-text"><strong>Zadanie ${
                            index + 1
                          }:</strong> ${q.question}</p>
                          <ul>
                            <li class="${getAnswerClass("a")}">A: ${q.a}</li>
                            <li class="${getAnswerClass("b")}">B: ${q.b}</li>
                            <li class="${getAnswerClass("c")}">C: ${q.c}</li>
                            <li class="${getAnswerClass("d")}">D: ${q.d}</li>
                          </ul>
                       </div>`;
                  })
                  .join("")}
              </td>
              <td class="widget">
                <p>Kwalifikacja</p>
                <input type="text" value="${formatQualification(
                  qualification
                )}" disabled />

                <p>Czas rozpoczęcia egzaminu (symulacja)</p>
                <input type="text" value="${new Date().toLocaleString()}" disabled />

                <p>Czas zakończenia egzaminu (symulacja)</p>
                <input type="text" value="${new Date(
                  Date.now() + 60 * 60 * 1000
                ).toLocaleString()}" disabled />

                <p>Liczba pytań w bazie</p>
                <input type="text" value="${questionCount}" style="color: ${countColor};" disabled />

                <p>Oczekiwana liczba pytań</p>
                <input type="text" value="40" disabled />

                <p>Domyślny czas końca egzaminu:</p>
                <input type="text" value="60:00" disabled />

                <button class="btn-end" onclick="window.close()">Zamknij podgląd</button>
              </td>
            </tr>
          </table>
          <div class="footer">
            <small>System próbnych egzaminów zawodowych</small>
          </div>
        </body>
      </html>
    `);
    } catch (error) {
      console.error("Błąd podczas pobierania danych egzaminu: ", error);
    }
  };

  return (
    <div className="mt-4">
      <table className="table table-striped">
        <thead>
          <tr>
            <th onClick={() => handleSort("id")}>lp</th>
            <th onClick={() => handleSort("name")}>Kod egzaminu</th>
            <th onClick={() => handleSort("qualification")}>Kwalifikacja</th>
            <th onClick={() => handleSort("qualification")}>
              Kod arkusza w bazie
            </th>
            <th onClick={() => handleSort("profession")}>Zawód</th>
            <th>Osoby z prawem edycji</th>
            <th>
              {" "}
              <div style={{ textAlign: "center" }}>
                <FontAwesomeIcon icon="fa-solid fa-eye" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {exams.map((exam, index) => (
            <React.Fragment key={exam.id}>
              <tr>
                <td>{index + 1}</td>
                <td onClick={() => handleExamClick(exam.id)}>{exam.name}</td>
                <td>{exam.qualification}</td>
                <td className="text-muted">
                  <strong>{exam.collectionName}</strong>
                </td>
                <td>{exam.profession}</td>
                <td>
                  {exam.autors.map((author, index) => (
                    <Badge key={index} pill bg="primary" className="me-2">
                      {author}
                    </Badge>
                  ))}
                </td>
                <td>
                  <button
                    class="btn btn-outline-success"
                    onClick={() =>
                      handlePreviewClick(
                        exam.collectionName,
                        exam.qualification
                      )
                    }>
                    <FontAwesomeIcon icon="fa-solid fa-eye" />
                  </button>
                </td>
              </tr>
              <tr>
                <td colSpan={5}>
                  <Collapse in={expandedExams[exam.id]}>
                    <div className="p-3 mb-2 bg-light text-dark rounded text-muted">
                      <p>Rok utworzenia: {exam.year}</p>
                      <p>Unikalny kod sesji: {exam.session}</p>
                      <p>Skrót kwalifikacji: {exam.qualification}</p>
                      <p>
                        Autor arkusza: <strong>{exam.autors[0]}</strong>
                      </p>
                    </div>
                  </Collapse>
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <Pagination />
    </div>
  );
};

export default ExamList;
