import React, { useState, useEffect } from "react";
import "bootstrap/dist/js/bootstrap.bundle";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import Pagination from "./Pagination";
import AddUserForm from "./AddUserForm";
import WindowConfirm from "./WindowConfirm";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faTrashCan,
  faFileExcel,
  faFile,
  faUserPlus,
  faUserMinus,
  faFilePdf,
  faPrint,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import robotoBase64 from "../fonts/RobotoBase64";

library.add(
  faTrashCan,
  faFileExcel,
  faFile,
  faUserPlus,
  faUserMinus,
  faFilePdf,
  faPrint
);

const RaportExam = ({ quizCodesData }) => {
  const [originalUsers, setOriginalUsers] = useState([]);
  const [selectedQuizCode, setSelectedQuizCode] = useState("URFvzAVO"); // inicjalizacja z kodem testu
  const fetchData = async () => {
    const data = await getDocs(collection(db, "users"));
    // setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    const usersData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    setUsers(usersData);
    setOriginalUsers(usersData);
  };

  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const [quizCodes, setQuizCodes] = useState([]);

  useEffect(() => {
    const fetchQuizCodes = async () => {
      const querySnapshot = await getDocs(collection(db, "quizCode"));
      const codes = querySnapshot.docs.map((doc) => doc.id);
      setQuizCodes(codes);
    };
    fetchQuizCodes();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedQuizCode]);

  const [profession, setfetchProfession] = useState([]);
  useEffect(() => {
    const fetchProfession = async () => {
      const querySnapshot = await getDocs(collection(db, "professions"));
      const codes = querySnapshot.docs.map((doc) => doc.id);
      setfetchProfession(codes);
    };
    fetchProfession();
  }, []);
  // Get current users
  const filteredUsers = users.filter(
    (user) =>
      typeof user.role === "string" &&
      user.role.includes("s") &&
      user.quizID === selectedQuizCode
    // && user.profession === quizCode.profession dla nauczycieli z 'a'
  );
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const [userIndex, setUserIndex] = useState(null);

  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
  };

  useEffect(() => {
    const filteredUsers = originalUsers.filter(
      (user) =>
        typeof user.role === "string" &&
        user.role.includes("s") &&
        user.quizID === selectedQuizCode
    );
    setUsers(filteredUsers);
  }, [selectedQuizCode, originalUsers]);

  useEffect(() => {
    let filteredUsers = originalUsers.filter(
      (user) =>
        typeof user.role === "string" &&
        user.role.includes("s") &&
        user.quizID === selectedQuizCode
    );

    if (sortField !== null) {
      filteredUsers.sort((a, b) => {
        if (a[sortField] < b[sortField]) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (a[sortField] > b[sortField]) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setUsers(filteredUsers);
  }, [selectedQuizCode, originalUsers, sortField, sortDirection]);

  const [lpSortDirection, setLpSortDirection] = useState("asc");

  const handlePDFraport = async (user) => {
    if (user && user.quizID && quizCodesData[user.quizID]) {
      const data = quizCodesData[user.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;

        // Upewnienie się, że login użytkownika jest zdefiniowany
        if (!user.login) {
          console.error("Login is undefined");
          return;
        }

        try {
          // Pobranie odpowiedzi ucznia
          const userDocRef = doc(db, "users", `user${user.login}`);
          const userDoc = await getDoc(userDocRef);
          const myAnswers =
            userDoc.exists() && Array.isArray(userDoc.data().myAnswers)
              ? userDoc
                  .data()
                  .myAnswers.map((answer) =>
                    answer === "null"
                      ? "Zdający nie udzielił odpowiedzi"
                      : answer
                  )
              : [];

          // Pobranie poprawnych odpowiedzi w kolejności dokumentów
          const collectionName = `${qualification
            .toLowerCase()
            .replace(".", "")}${data.Year}${data.Session}`;
          const questionsRef = collection(db, collectionName);
          const questionsSnapshot = await getDocs(questionsRef);

          // Sortowanie dokumentów według numerów pytań
          const sortedQuestions = questionsSnapshot.docs.sort(
            (a, b) => parseInt(a.id) - parseInt(b.id)
          );

          const correctAnswers = sortedQuestions.map((doc) => ({
            questionNumber: doc.id, // Numer pytania (nazwa dokumentu)
            correctAnswer: doc.data().answer,
          }));

          // Przekazanie danych do funkcji generującej PDF
          generateUserPDF(user, qualification, myAnswers, correctAnswers);
        } catch (error) {
          console.error("Error fetching myAnswers or generating PDF:", error);
        }
      }
    }
  };

  const generateUserPDF = (user, qualification, myAnswers, correctAnswers) => {
    const docpdf = new jsPDF("p", "pt", "a4");

    docpdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    docpdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    docpdf.setFont("Roboto");

    let y = 40;

    // Nagłówki z informacjami o użytkowniku i egzaminie
    docpdf.setFontSize(12);
    docpdf.text(20, y, `Imię i nazwisko: ${user.firstname} ${user.lastname}`);
    y += 20;
    docpdf.text(20, y, `Zawód: ${user.profession}`);
    y += 20;
    docpdf.text(20, y, `Klasa: ${user.class}`);
    y += 20;
    docpdf.text(20, y, `Kwalifikacja: ${qualification.toUpperCase()}`);
    y += 20;
    docpdf.text(20, y, `Oznaczenie arkusza: ${user.quizID}`);
    y += 20;
    docpdf.text(20, y, `Wynik: ${user.quizResult} / 40`);
    y += 20;
    docpdf.text(20, y, `Wynik procentowy: ${user.percentResult}%`);

    docpdf.setFontSize(16);
    if (user.percentResult >= 50) {
      docpdf.setTextColor(0, 128, 0);
      y += 30;
      docpdf.text(20, y, "Egzamin zdany");
    } else {
      docpdf.setTextColor(255, 0, 0);
      y += 30;
      docpdf.text(20, y, "Egzamin oblany");
    }

    // Przywrócenie koloru tekstu
    docpdf.setTextColor(0, 0, 0);
    docpdf.setFontSize(12);
    y += 20;

    // Tabela z numerem pytania, odpowiedzią ucznia i poprawną odpowiedzią
    const columns = ["Numer pytania", "Odpowiedź ucznia", "Poprawna odpowiedź"];

    const rows = myAnswers.map((answer, index) => [
      correctAnswers[index]
        ? correctAnswers[index].questionNumber
        : "Brak danych",
      answer,
      correctAnswers[index]
        ? correctAnswers[index].correctAnswer
        : "Brak danych",
    ]);

    docpdf.autoTable({
      head: [columns],
      body: rows,
      startY: y,
      styles: { font: "Roboto", fontSize: 10 },
      headStyles: { fillColor: [220, 220, 220] },
    });

    // Finalizacja pliku PDF z informacją o dacie wygenerowania
    const id = toast.loading("Generowanie raportu...");
    setTimeout(() => {
      toast.update(id, {
        render: "Pobieranie rozpoczęte...",
        type: "success",
        isLoading: false,
        autoClose: 1500,
        onClose: () => toast.dismiss(),
      });
    }, 1000);
    docpdf.save(`wyniki_${user.firstname}_${user.lastname}.pdf`);
  };

  const handlePrint = async (user) => {
    if (user && user.quizID) {
      const data = quizCodesData[user.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;

        // Pobranie odpowiedzi ucznia
        const userDocRef = doc(db, "users", `user${user.login}`);
        const userDoc = await getDoc(userDocRef);
        const myAnswers =
          userDoc.exists() && Array.isArray(userDoc.data().myAnswers)
            ? userDoc
                .data()
                .myAnswers.map((answer) =>
                  answer === "null" ? "Zdający nie udzielił odpowiedzi" : answer
                )
            : [];

        // Pobranie poprawnych odpowiedzi w kolejności dokumentów
        const collectionName = `${qualification
          .toLowerCase()
          .replace(".", "")}${data.Year}${data.Session}`;
        const questionsRef = collection(db, collectionName);
        const questionsSnapshot = await getDocs(questionsRef);

        // Mapowanie i sortowanie dokumentów po numerze pytania (nazwie dokumentu)
        const sortedQuestions = questionsSnapshot.docs.sort(
          (a, b) => parseInt(a.id) - parseInt(b.id)
        ); // Sortowanie dokumentów według ID

        const correctAnswers = sortedQuestions.map((doc) => ({
          questionNumber: doc.id, // Numer pytania (nazwa dokumentu)
          correctAnswer: doc.data().answer,
        }));

        // Generowanie treści z tabelą odpowiedzi
        let content = `
        <h1>Imię i nazwisko: ${user.firstname} ${user.lastname}</h1>
        <p>Zawód: ${user.profession}</p>
        <p>Klasa: ${user.class}</p>
        <p>Kwalifikacja: ${qualification.toUpperCase()}</p>
        <p>Oznaczenie arkusza: ${user.quizID}</p>
        <p>Wynik: ${user.quizResult} / 40</p>
        <p>Wynik procentowy: ${user.percentResult}%</p>
        ${
          user.percentResult >= 50
            ? '<p style="color: green;">Egzamin zdany</p>'
            : '<p style="color: red;">Egzamin oblany</p>'
        }
        <h2>Odpowiedzi:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>
              <th style="border: 1px solid black; padding: 5px;">Numer pytania</th>
              <th style="border: 1px solid black; padding: 5px;">Odpowiedź ucznia</th>
              <th style="border: 1px solid black; padding: 5px;">Poprawna odpowiedź</th>
            </tr>
          </thead>
          <tbody>
  ${myAnswers
    .map(
      (answer, index) => `
      <tr>
        <td style="border: 1px solid black; padding: 5px;">
          ${
            correctAnswers[index]
              ? correctAnswers[index].questionNumber
              : "Brak danych"
          }
        </td>
        <td style="border: 1px solid black; padding: 5px;">${answer}</td>
        <td style="border: 1px solid black; padding: 5px;">
          ${
            correctAnswers[index]
              ? correctAnswers[index].correctAnswer
              : "Brak danych"
          }
        </td>
      </tr>
    `
    )
    .join("")}
</tbody>
        </table>
      `;

        // Wydruk zawartości
        let iframe = document.createElement("iframe");
        iframe.style.visibility = "hidden";
        document.body.appendChild(iframe);
        iframe.contentDocument.write(content);
        iframe.contentDocument.close();
        iframe.contentWindow.print();
        iframe.contentWindow.onafterprint = () =>
          document.body.removeChild(iframe);
      }
    }
  };

  return (
    <div className="mt-4">
      <div className="row d-flex align-items-center">
        <div className="col-12 d-flex justify-content-center text-primary fs-5">
          Raport według zdającego
        </div>
      </div>
      <div className="col-3">
        <p>
          Wyświetl według arkusza:
          <select
            className="form-select"
            aria-label="Select Quiz"
            value={selectedQuizCode}
            onChange={(e) => setSelectedQuizCode(e.target.value)}>
            {Object.keys(quizCodesData).map((quizCode, index) => (
              <option key={index} value={quizCode}>
                {quizCode}
              </option>
            ))}
          </select>
        </p>
      </div>

      <table className="table table-striped caption-top">
        <caption>Lista zdających</caption>
        <thead>
          <tr>
            <th>lp</th>
            <th onClick={() => handleSort("lastname")}>Imię i nazwisko</th>

            <th onClick={() => handleSort("profession")}>Zawód</th>
            <th onClick={() => handleSort("class")}>Klasa</th>
            <th onClick={() => handleSort("quizID")}>Arkusz</th>
            <th onClick={() => handleSort("quizResult")}>Wynik</th>
            <th onClick={() => handleSort("percentResult")}>Procent</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={index} onClick={() => handleRowClick(user)}>
              <td>
                {lpSortDirection === "asc"
                  ? (currentPage - 1) * usersPerPage + index + 1
                  : filteredUsers.length -
                    ((currentPage - 1) * usersPerPage + index)}
              </td>
              <td>
                {user.firstname} {user.lastname}
              </td>
              <td>{user.profession}</td>
              <td>{user.class}</td>
              <td>{user.quizID}</td>
              <td>{user.quizResult}</td>
              <td
                className={
                  user.percentResult >= 50 ? "text-success" : "text-danger"
                }>
                {user.percentResult}
              </td>
              <td>
                <button
                  className="btn btn-light"
                  onClick={() => handlePrint(user)}>
                  <FontAwesomeIcon icon="fa-solid fa-print" />
                </button>
                &nbsp;
                <button
                  className="btn btn-light"
                  onClick={() => handlePDFraport(user)}
                  // onClick={() => handlePDFraport(selectedUser)}
                >
                  <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        usersPerPage={usersPerPage}
        totalUsers={filteredUsers.length}
        paginate={paginate}
      />
      <div style={{ height: 50 }}></div>
    </div>
  );
};

export default RaportExam;
