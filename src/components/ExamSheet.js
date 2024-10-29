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
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import robotoBase64 from "../fonts/RobotoBase64";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import { Collapse } from "react-bootstrap";
import MyChart from "./MyChart";
import PieChart from "./PieChart";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parse, isValid } from "date-fns";
import { pl } from "date-fns/locale";
import { isSameDay } from "date-fns";
import Badge from "@mui/material/Badge";
import { styled } from "@mui/material/styles";

// import { MyChart as LibraryChart } from 'library-name';
library.add(
  faTrashCan,
  faFileExcel,
  faFile,
  faUserPlus,
  faUserMinus,
  faFilePdf,
  faPrint,
  faFilter
);

const StyledBadge = styled(Badge)(({ theme }) => ({
  "& .MuiBadge-dot": {
    backgroundColor: theme.palette.primary.main,
  },
}));

const ExamSheet = ({ quizCodesData }) => {
  const [originalUsers, setOriginalUsers] = useState([]);
  const [selectedQuizCode, setSelectedQuizCode] = useState("URFvzAVO"); // inicjalizacja z kodem testu
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [selectedUser, setSelectedUser] = useState(null); // inicjalizacja z kodem testu

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
    const fetchData = async () => {
      const data = await getDocs(collection(db, "users"));
      // setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
      const usersData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setUsers(usersData);
      setOriginalUsers(usersData);
    };
    fetchData();
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
      (user.quizID === selectedQuizCode || user.quizID === "URFvzAVO")
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

  const handlePDFraport = async (group) => {
    if (group && group.quizID && quizCodesData[group.quizID]) {
      const data = quizCodesData[group.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;
        generatePDF(group, qualification); // Pass user and qualification to generatePDF
      } else {
        console.error(
          "Qualification field is missing or invalid in the document data"
        );
      }
    } else {
      console.error(
        "User, user.quizID, or quizCodesData[user.quizID] is undefined or null"
      );
    }
  };

  useEffect(() => {
    let sortedUsers = [...users];
    if (sortField !== null) {
      sortedUsers.sort((a, b) => {
        if (a[sortField] < b[sortField]) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (a[sortField] > b[sortField]) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    setUsers(sortedUsers);
  }, [sortField, sortDirection]);

  const [lpSortDirection, setLpSortDirection] = useState("asc");

  const handlePrint = (user) => {
    if (user && user.quizID) {
      const data = quizCodesData[user.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;
        let iframe = document.createElement("iframe");

        // Set the iframe to be invisible
        iframe.style.visibility = "hidden";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        document.body.appendChild(iframe);
        // Generate the content for the report
        let content =
          `
        <h1>Imię i nazwisko: ${user.firstname} ${user.lastname}</h1><br />
		<hr />
        <p>Zawód:<b> ${user.profession}</b></p>
        <p>Klasa: ${user.class}</p><br/><br/>
		<p>Kwalifikacja:<b> ${qualification
      .match(/[a-zA-Z]+/g)
      .join("")
      .toUpperCase()}` +
          `.${qualification.match(/\d+/g)}</b></p>
        <p>Oznaczenie arkusza:<b> ${user.quizID}</b></p>
        <p>Wynik: ${user.quizResult} / 40</p>
        <p>Wynik procentowy: ${user.percentResult}%</p><br />
		${
      user.percentResult >= 50
        ? '<p style="color: rgb(0,128,0);" >Egzamin zdany</p>'
        : '<p style="color:rgb(255,0,0);">Egzamin oblany</p>'
    } 
        <footer style="position: fixed; bottom: 0; width: 100%;">
		<small>Raport utworzony dnia: ${new Date().toLocaleDateString()}</small>
		<p><small>Zestawienie zostało wygenerowane w programie MES, aplikacji do tworzenia i przeprowadzania próbnych egzaminów zawodowych</small></p></footer>
    `;

        iframe.contentDocument.write(content);
        iframe.contentDocument.close();

        // Call the print function
        iframe.contentWindow.print();

        // Remove the iframe after printing
        iframe.contentWindow.onafterprint = () => {
          document.body.removeChild(iframe);
        };
      } else {
        console.error(
          "Qualification field is missing or invalid in the document data"
        );
      }
    } else {
      console.error("User or user.quizID is undefined or null");
    }
  };

  const formatDate = (date) => {
    if (!date) {
      return "0000-00-00"; // Default value
    }
    const [day, month, year] = date.split(".");
    return `${year}-${month}-${day}`;
  };

  const groupedUsers = users.reduce((acc, user) => {
    const key = `${user.quizID}-${user.class}-${user.examDate}`;
    if (!acc[key]) {
      acc[key] = {
        quizID: user.quizID,
        profession: user.profession,
        class: user.class,
        examDate: user.examDate,
        passed: Number(user.quizResult) > 20 ? 1 : 0,
        users: [user],
        examTerm: user.examDate,
        count: 1,
        minScore: Number(user.quizResult),
        minPerCent: Number(user.percentResult),
        maxScore: Number(user.quizResult),
        maxPerCent: Number(user.percentResult),
        totalScore: Number(user.quizResult),
        Qualification: user.Qualification,
      };
    } else {
      acc[key].users.push(user);
      acc[key].count += 1;
      acc[key].profession = acc[key].profession;
      if (Number(user.quizResult) > 20) {
        acc[key].passed += 1;
      }
      acc[key].minScore = Math.min(acc[key].minScore, Number(user.quizResult));
      acc[key].maxScore = Math.max(acc[key].maxScore, Number(user.quizResult));
      acc[key].minPerCent = Math.min(
        acc[key].minPerCent,
        Number(user.percentResult)
      );
      acc[key].maxPerCent = Math.max(
        acc[key].maxPerCent,
        Number(user.percentResult)
      );
      acc[key].totalScore += Number(user.quizResult);
      acc[key].examTerm = user.examDate;
      acc[key].Qualification = user.Qualification;
    }
    return acc;
  }, {});
  const groupedUsersArray = Object.values(groupedUsers);
  const [open, setOpen] = useState({});

  const generatePDF = (group, qualification) => {
    try {
      const docpdf = new jsPDF("p", "pt", "a4");

      docpdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      docpdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");

      docpdf.setFont("Roboto");
      let y = 20;

      y += 20;
      docpdf.text(20, y, `Numer arkusza: ${group.quizID}`);
      y += 25;
      docpdf.text(20, y, `Kwalifikacja:`);
      docpdf.setFont("Roboto", "bold");
      docpdf.text(
        125,
        y,
        `${qualification
          .match(/[a-zA-Z]+/g)
          .join("")
          .toUpperCase()}` + `.${qualification.match(/\d+/g)}`
      );
      docpdf.setFont("Roboto", "normal");
      y += 30;
      docpdf.text(20, y, `Klasa:`);
      docpdf.setFont("Roboto", "bold");
      docpdf.text(70, y, `${group.class}`);
      docpdf.setFont("Roboto", "normal");
      y += 30;
      docpdf.text(20, y, `Data egzaminu:`);
      docpdf.setFont("Roboto", "bold");
      docpdf.text(140, y, `${group.examTerm}`);
      docpdf.setFont("Roboto", "normal");

      const columns = ["Etap pisemny", ""];
      const rows = [
        ["Liczba zdających", group.count],
        ["Próg zaliczenia", "50%    20pkt"],
        ["Wynik max", `${group.maxScore}    ${group.maxPerCent}%`],
        ["Wynik min", `${group.minScore}    ${group.minPerCent}%`],
        ["Średni wynik", (group.totalScore / group.count).toFixed(2)],
      ];

      docpdf.autoTable(columns, rows, {
        margin: { top: y + 20 },
        styles: { font: "Roboto", fontSize: 10 },
      });
      y += 180;

      docpdf.text(20, y, `Lista zdających:`);
      y += 20; // Add space after the inscription

      const userColumns = [
        "Lp.",
        "Imię i nazwisko",
        "Wynik",
        "Wynik procentowy",
      ];
      const userRows = group.users.map((user, index) => [
        index + 1,
        `${user.firstname} ${user.lastname}`,
        `${user.quizResult}pkt`,
        `${user.percentResult}%`,
      ]);

      docpdf.autoTable(userColumns, userRows, {
        startY: y,
        styles: { font: "Roboto", fontSize: 10 },
      });

      // Update y to the bottom of the table
      y = docpdf.autoTable.previous.finalY;

      docpdf.setFontSize(10);
      const pageCount = docpdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docpdf.setPage(i);

        docpdf.text(
          "Raport utworzony dnia: " + new Date().toLocaleDateString(),
          20,
          docpdf.internal.pageSize.height - 40
        );
        y += 20;
        docpdf.setFontSize(8);
        docpdf.text(
          "Zestawienie zostało wygenerowane w programie MES, aplikacji do tworzenia i przeprowadzania próbnych egzaminów zawodowych ",
          20,
          docpdf.internal.pageSize.height - 20
        );
      }

      const id = toast.loading("Generowanie reportu...");
      //do something else
      setTimeout(() => {
        toast.update(id, {
          render: "Za chwilę rozpocznie się automatyczne pobieranie...",
          type: "success",
          isLoading: false,
          autoClose: 1500,
          onClose: () => {
            docpdf.save(`wyniki_${group.quizID}_${group.examTerm}.pdf`);
          },
        });
      }, 1000);
    } catch (error) {
      toast.error("Błąd: " + error.message, {
        autoClose: 5000, // Close the error message after 5 seconds
      });
    }
  };

  const handleGroupPrint = (group) => {
    if (group && group.quizID) {
      const data = quizCodesData[group.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;
        let iframe = document.createElement("iframe");

        // Set the iframe to be invisible
        iframe.style.visibility = "hidden";
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        document.body.appendChild(iframe);
        // Generate the content for the report

        let content =
          `
<p>Numer arkusza:<b> ${group.quizID}</b></p>

<p>Kwalifikacja:<b> ${qualification
            .match(/[a-zA-Z]+/g)
            .join("")
            .toUpperCase()}` +
          `.${qualification.match(/\d+/g)}</b></p>

<p>Klasa: <b>${group.class}</b></p>
<p>Data egzaminu: <b>${group.examTerm}</b></p>
<table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
	<tr style="background-color: #407fb6;">
		<th colspan="2" style="border: 1px solid black; padding: 10px;">Etap pisemny</th>
	</tr>
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Liczba zdających</td>
		<td style="border: 1px solid black; padding: 10px;">${group.count}</td>
	</tr>
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Próg zaliczenia</td>
		<td style="border: 1px solid black; padding: 10px;">50% &nbsp;&nbsp;&nbsp;20pkt</td>
	</tr>
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Wynik max</td>
		<td style="border: 1px solid black; padding: 10px;">${
      group.maxScore
    }  &nbsp;&nbsp;&nbsp;${group.maxPerCent}%</td>
	</tr>
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Wynik min</td>
		<td style="border: 1px solid black; padding: 10px;">${
      group.minScore
    } &nbsp;&nbsp;&nbsp;${group.minPerCent}%</td>
	</tr>
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Średni wynik</td>
		<td style="border: 1px solid black; padding: 10px;">${(
      group.totalScore / group.count
    ).toFixed(2)}</td>
	</tr>
</table><br />
<p>Lista zdających:</p><br />
<table style="width: 100%; border-collapse: collapse;">
	<tr>
		<td style="border: 1px solid black; padding: 10px;">Lp.</td>
		<td style="border: 1px solid black; padding: 10px;">Imię i nazwisko</td>
		<td style="border: 1px solid black; padding: 10px;">Wynik</td>
		<td style="border: 1px solid black; padding: 10px;">Wynik procentowy</td>																									
	</tr>
	${
    group.users
      ? group.users
          .map(
            (user, index) => `
	<tr>
		<td style="border: 1px solid black; padding: 10px;">${index + 1}</td>
		<td style="border: 1px solid black; padding: 10px;">${user.firstname} ${
              user.lastname
            }</td>
		<td style="border: 1px solid black; padding: 10px;">${user.quizResult}pkt</td>
		<td style="border: 1px solid black; padding: 10px;">${user.percentResult}%</td>
	</tr>
	`
          )
          .join("")
      : ""
  }
</table>
<footer style="position: relative; width: 100%;">
<small>Report created on: ${new Date().toLocaleDateString()}</small>
<p><small>This report was generated by the MES application, a tool for creating and conducting mock professional exams</small></p></footer>
`;

        iframe.contentDocument.write(content);
        iframe.contentDocument.close();

        // Call the print function
        iframe.contentWindow.print();

        // Remove the iframe after printing
        iframe.contentWindow.onafterprint = () => {
          document.body.removeChild(iframe);
        };
      } else {
        console.error(
          "Qualification field is missing or invalid in the document data"
        );
      }
    } else {
      console.error("Group or group.quizID is undefined or null");
    }
  };

  const handleUserPDFraport = async (user) => {
    if (user && user.quizID && quizCodesData[user.quizID]) {
      const data = quizCodesData[user.quizID];
      if (data && data.Qualification) {
        const qualification = data.Qualification;
        generateUserPDF(user, qualification); // Pass user and qualification to generatePDF
      } else {
        console.error(
          "Qualification field is missing or invalid in the document data"
        );
      }
    } else {
      console.error(
        "User, user.quizID, or quizCodesData[user.quizID] is undefined or null"
      );
    }
  };

  const generateUserPDF = (user, qualification) => {
    try {
      const docpdf = new jsPDF("p", "pt", "a4");

      docpdf.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
      docpdf.addFont("Roboto-Regular.ttf", "Roboto", "normal");

      docpdf.setFont("Roboto");
      let y = 20;

      y += 20;
      docpdf.text(20, y, `Imię i nazwisko: ${user.firstname} ${user.lastname}`);
      y += 20;
      docpdf.line(0, y, 595, y);

      y += 20;

      docpdf.setFontSize(10);
      docpdf.text(20, y, `Zawód: `);

      docpdf.setFont("Roboto", "bold");
      docpdf.text(55, y, `${user.profession}`);
      y += 20;
      docpdf.setFont("Roboto", "normal");
      docpdf.text(20, y, `Klasa: ${user.class}`);

      y += 40;
      docpdf.text(20, y, `Kwalifikacja:`);
      docpdf.setFont("Roboto", "bold");
      docpdf.text(
        85,
        y,
        `${qualification
          .match(/[a-zA-Z]+/g)
          .join("")
          .toUpperCase()}` + `.${qualification.match(/\d+/g)}`
      );
      docpdf.setFont("Roboto", "normal");
      y += 20;
      docpdf.text(20, y, `Oznaczenie arkusza:`);
      docpdf.setFont("Roboto", "bold");
      docpdf.text(120, y, `${user.quizID}`);
      docpdf.setFont("Roboto", "normal");
      y += 20;
      docpdf.text(20, y, `Wynik: ${user.quizResult} / 40`);

      y += 20;
      docpdf.text(20, y, `Wynik procentowy: ${user.percentResult}%`);
      y += 20;

      docpdf.setFontSize(10);
      const pageCount = docpdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        docpdf.setPage(i);

        docpdf.text(
          "Raport utworzony dnia: " + new Date().toLocaleDateString(),
          20,
          docpdf.internal.pageSize.height - 40
        );
        y += 20;
        docpdf.setFontSize(8);
        docpdf.text(
          "Zestawienie zostało wygenerowane w programie MES, aplikacji do tworzenia i przeprowadzania próbnych egzaminów zawodowych ",
          20,
          docpdf.internal.pageSize.height - 20
        );
      }

      docpdf.setFontSize(16);
      if (user.percentResult >= 50) {
        docpdf.setTextColor(0, 128, 0); // Set text color to green
        y += 20; // Increase Y-coordinate for the next line
        docpdf.text(20, y, "Egzamin zdany");
      } else {
        docpdf.setTextColor(255, 0, 0); // Set text color to red
        y += 20; // Increase Y-coordinate for the next line
        docpdf.text(20, y, "Egzamin oblany");
      }

      const id = toast.loading("Generowanie reportu...");
      //do something else
      setTimeout(() => {
        toast.update(id, {
          render: "Za chwilę rozpocznie się automatyczne pobieranie...",
          type: "success",
          isLoading: false,
          autoClose: 1500,
          onClose: () => {
            docpdf.save(`wyniki_${user.firstname}_${user.lastname}.pdf`);
          },
        });
      }, 1000);
    } catch (error) {
      toast.error("Błąd: " + error.message, {
        autoClose: 5000, // Close the error message after 5 seconds
      });
    }
  };

 
  const [filterQuizID, setFilterQuizID] = useState("");
  const [filterQualification, setFilterQualification] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterExamDate, setFilterExamDate] = useState(null);
  const [filterProfession, setFilterProfession] = useState("");
  const [filterCount, setFilterCount] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Suggestions for Autocomplete fields
  const quizIDSuggestions = [
    ...new Set(groupedUsersArray.map((group) => group.quizID)),
  ];
 const qualificationSuggestions = [
   ...new Set(
     Object.values(quizCodesData)
       .map((quiz) =>
         quiz.Qualification
           ? `${quiz.Qualification.replace(
               /([a-zA-Z]+)(\d+)/,
               "$1.$2"
             ).toUpperCase()}`
           : ""
       )
       .filter((qual) => qual) // Usuwa puste wartości
   ),
 ];


  const classSuggestions = [
    ...new Set(groupedUsersArray.map((group) => group.class)),
  ];
  const professionSuggestions = [
    ...new Set(groupedUsersArray.map((group) => group.profession)),
  ];

  const filteredGroups = groupedUsersArray
    .filter((group) =>
      filterQuizID ? group.quizID?.includes(filterQuizID) : true
    )
    .filter((group) =>
      filterQualification
        ? `${
            quizCodesData[group.quizID]?.Qualification.replace(
              /([a-zA-Z]+)(\d+)/,
              "$1.$2"
            ).toUpperCase() || ""
          }`.includes(filterQualification.toUpperCase())
        : true
    )
    .filter((group) =>
      filterClass ? group.class?.includes(filterClass) : true
    )
    .filter((group) => {
      if (!filterExamDate) return true;
      const formattedFilterDate = format(filterExamDate, "yyyy-MM-dd");
      const parsedExamTerm = parse(group.examTerm, "dd.MM.yyyy", new Date());
      const formattedExamTerm = isValid(parsedExamTerm)
        ? format(parsedExamTerm, "yyyy-MM-dd")
        : null;
      return formattedExamTerm === formattedFilterDate;
    })
    .filter((group) =>
      filterProfession ? group.profession?.includes(filterProfession) : true
    )
    .filter((group) =>
      filterCount ? group.count?.toString().includes(filterCount) : true
    );

	const examDates = [
    ...new Set(
      groupedUsersArray.map((group) => {
        const parsedDate = parse(group.examTerm, "dd.MM.yyyy", new Date());
        return isValid(parsedDate) ? parsedDate : null;
      })
    ),
  ].filter(Boolean);

  return (
    <div className="mt-4">
      <div className="row d-flex align-items-center">
        <div className="col-12 d-flex justify-content-center text-primary fs-5 mt-4">
          Raporty według arkuszy
        </div>
      </div>
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={() => setFiltersVisible(!filtersVisible)}>
        <FontAwesomeIcon icon={faFilter} />{" "}
        {filtersVisible ? "Ukryj pola wyszukiwania" : "Pokaż pola wyszukiwania"}
      </button>
      <Collapse in={filtersVisible}>
        <div className="mb-3 container-sm">
          <fieldset className="border p-2 mt-4">
            <legend className="float-none w-auto p-2 fs-6">Filtry</legend>
            <div className="row">
              <div className="col-md-3 mb-3">
                <Autocomplete
                  freeSolo
                  options={quizIDSuggestions}
                  getOptionLabel={(option) => option || ""} // Safeguard against undefined options
                  inputValue={filterQuizID}
                  onInputChange={(event, newValue) => setFilterQuizID(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Numer arkusza" size="small" />
                  )}
                />
              </div>
              <div className="col-md-3 mb-3">
                <Autocomplete
                  freeSolo
                  options={qualificationSuggestions}
                  getOptionLabel={(option) => option || ""}
                  value={filterQualification} // Ustawienie wartości
                  onInputChange={(event, newValue) =>
                    setFilterQualification(newValue)
                  } // Pozwala na wpisywanie ręczne
                  renderInput={(params) => (
                    <TextField {...params} label="Kwalifikacja" size="small" />
                  )}
                />
              </div>
              <div className="col-md-3 mb-3">
                <Autocomplete
                  freeSolo
                  options={classSuggestions}
                  getOptionLabel={(option) => option || ""}
                  inputValue={filterClass}
                  onInputChange={(event, newValue) => setFilterClass(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} label="Klasa" size="small" />
                  )}
                />
              </div>
              <div className="col-md-3 mb-3">
                <LocalizationProvider
                  dateAdapter={AdapterDateFns}
                  adapterLocale={pl}>
                  <DatePicker
                    label="Data egzaminu"
                    value={filterExamDate}
                    onChange={(newDate) => setFilterExamDate(newDate)}
                    renderInput={(params) => (
                      <TextField {...params} size="small" />
                    )}
                    renderDay={(day, _value, DayComponentProps) => {
                      // Step 2: Check if the day is an exam date
                      const isExamDay = examDates.some((examDate) =>
                        isSameDay(day, examDate)
                      );

                      return (
                        <StyledBadge
                          key={day.toString()}
                          overlap="circular"
                          color="primary"
                          variant="dot"
                          invisible={!isExamDay}>
                          <div {...DayComponentProps} />
                        </StyledBadge>
                      );
                    }}
                  />
                </LocalizationProvider>
              </div>
              <div className="col-md-6 mb-3">
                <Autocomplete
                  freeSolo
                  options={professionSuggestions}
                  getOptionLabel={(option) => option || ""}
                  inputValue={filterProfession}
                  onInputChange={(event, newValue) =>
                    setFilterProfession(newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Zawód" size="small" />
                  )}
                />
              </div>
              <div className="col-md-3 mb-3">
                <TextField
                  label="Liczba zdających"
                  value={filterCount}
                  onChange={(event) => setFilterCount(event.target.value)}
                  size="small"
                />
              </div>
            </div>
          </fieldset>
        </div>
      </Collapse>
      <div className="table-responsive mt-5">
        <table className="table table-striped caption-top">
          <thead>
            <tr>
              <th onClick={() => handleSort("lp")}>lp</th>
              <th onClick={() => handleSort("quizID")}>Numer arkusza</th>
              <th onClick={() => handleSort("Qualification")}>Kwalifikacja</th>
              <th onClick={() => handleSort("class")}>Klasa</th>
              <th onClick={() => handleSort("examTerm")}>Data egzaminu</th>
              <th onClick={() => handleSort("profession")}>Zawód</th>
              <th>
                <div className="col-2">Liczba zdających</div>
              </th>
              <th>
                <div className="col-2">Zaliczyli etap pisemny</div>
              </th>
              <th colSpan={2}>Wynik max</th>
              <th colSpan={2}>Wynik min</th>
              <th onClick={() => handleSort("totalScore")}>Średni wynik</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups
              .filter(
                (group) =>
                  group.users.length > 0 && group.quizID && group.examDate
              )
              .map((group, index) => (
                <React.Fragment key={index}>
                  <tr
                    onDoubleClick={() =>
                      setOpen((prevOpen) => ({
                        ...prevOpen,
                        [`${group.quizID}-${group.examDate}-${group.class}`]:
                          !prevOpen[
                            `${group.quizID}-${group.examDate}-${group.class}`
                          ],
                      }))
                    }
                    className="align-middle">
                    <td>
                      {lpSortDirection === "asc"
                        ? (currentPage - 1) * usersPerPage + index + 1
                        : filteredUsers.length -
                          ((currentPage - 1) * usersPerPage + index)}
                    </td>
                    <td className="text-success font-weight-bold">
                      {group.quizID}
                    </td>
                    <td>
                      {/* {quizCodesData[group.quizID]?.Qualification || 'N/A'} */}
                      {quizCodesData[group.quizID]?.Qualification.match(
                        /[a-zA-Z]+/g
                      )
                        .join("")
                        .toUpperCase()}
                      .
                      {quizCodesData[group.quizID]?.Qualification.match(/\d+/g)}
                    </td>
                    <td>{group.class}</td>
                    <td>{group.examTerm}</td>
                    <td className="font-weight-bold text-white bg-dark">
                      {group.profession}
                    </td>
                    <td className="text-center">{group.count}</td>
                    <td className="text-center">{group.passed}</td>

                    <td>{group.maxScore}</td>
                    <td>{group.maxPerCent}%</td>
                    <td>{group.minScore}</td>
                    <td>{group.minPerCent}%</td>
                    <td>{(group.totalScore / group.count).toFixed(2)}</td>

                    <td className="col-2">
                      <button
                        className="btn btn-light"
                        onClick={() => handleGroupPrint(group)}>
                        <FontAwesomeIcon icon="fa-solid fa-print" />
                      </button>
                      &nbsp;
                      <button
                        className="btn btn-light"
                        onClick={() => handlePDFraport(group)}
                        // onClick={() => handlePDFraport(selectedUser)}
                      >
                        <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={10}>
                      <Collapse
                        in={
                          open[
                            `${group.quizID}-${group.examDate}-${group.class}`
                          ]
                        }>
                        <div className="container-fluid">
                          <div className="row">
                            <div className="col-10">
                              <MyChart
                                data={group.users.map(
                                  (user) => user.quizResult
                                )}
                                labels={group.users.map(
                                  (user) => `${user.firstname} ${user.lastname}`
                                )}
                                label={`Wynik w punktach`}
                              />
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-md-7 mt-5">
                              {group.users.map((user, index) => (
                                <div
                                  className={`alert alert-${
                                    user.percentResult >= 50
                                      ? "success"
                                      : "danger"
                                  } d-flex justify-content-between align-items-center`} // Add flexbox classes here
                                  key={index}>
                                  <div className="listUserExam">
                                    {" "}
                                    {/* Wrap the text in a div */}
                                    {index + 1}) {user.firstname}{" "}
                                    {user.lastname}
                                    {"  "}
                                    <div className="vr"></div> {user.quizResult}
                                    pkt
                                    {"  "}
                                    <div className="vr"></div>{" "}
                                    {user.percentResult}%
                                  </div>
                                  <div>
                                    {" "}
                                    {/* Wrap the buttons in a div */}
                                    <button
                                      className="btn btn-light"
                                      onClick={() => handlePrint(user)}>
                                      <FontAwesomeIcon icon="fa-solid fa-print" />
                                    </button>
                                    &nbsp;
                                    <button
                                      className="btn btn-light"
                                      onClick={() => handleUserPDFraport(user)}>
                                      <FontAwesomeIcon icon="fa-solid fa-file-pdf" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="col-md-4 mt-5">
                              <PieChart
                                data={[
                                  group.users.filter(
                                    (user) => user.percentResult >= 50
                                  ).length,
                                  group.users.filter(
                                    (user) => user.percentResult < 50
                                  ).length,
                                ]}
                                labels={["Zdało", "Oblało"]}
                              />
                            </div>
                          </div>
                        </div>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              ))}
          </tbody>
        </table>
        <Pagination
          usersPerPage={usersPerPage}
          totalUsers={filteredUsers.length}
          paginate={paginate}
        />
      </div>
    </div>
  );
};
export default ExamSheet;
