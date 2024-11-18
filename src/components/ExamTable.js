import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle";
import {
  Button,
  Badge,
  DropdownButton,
  Dropdown,
  Collapse,
  Modal,
  Form,
} from "react-bootstrap";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPencilAlt,
  faTrashCan,
  faUserCircle,
  faCopy,
  faArrowDown,
  faArrowUp,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  setDoc,
  arrayUnion,
  writeBatch,
} from "firebase/firestore";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ExitAlert from "./ExitAlert";
import Pagination from "./Pagination";
import AppContext from "./AppContext";
import WindowConfirm from "./WindowConfirm";
import html2canvas from "html2canvas";
import JoditEditor from "jodit-react";

import CodeEditor from "./CodeEditor";
import domtoimage from "dom-to-image";

const CodeSampleModal = ({ show, onClose, onSave, editorRef }) => {
  const [language, setLanguage] = useState("html");
  const [code, setCode] = useState("");
  const codeRef = useRef(null);

  const handleSaveImage = async () => {
    try {
      const editorContainer = document.querySelector("#UNIQUE_ID_OF_DIV");
      if (!editorContainer) {
        console.error("Nie znaleziono kontenera edytora.");
        return;
      }

      const aceEditorInstance = editorContainer.env?.editor;
      if (!aceEditorInstance) {
        console.error("Nie znaleziono instancji AceEditor.");
        return;
      }

      const code = aceEditorInstance.getValue();
      const lines = code.split("\n");

      const fontSize = 18;
      const lineHeight = fontSize + 6;
      const padding = 20;
      const lineNumberWidth = 60;

      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      tempContext.font = `${fontSize}px monospace`;

      let maxWidth = 0;
      lines.forEach((line) => {
        const lineWidth = tempContext.measureText(line).width + lineNumberWidth;
        if (lineWidth > maxWidth) {
          maxWidth = lineWidth;
        }
      });

      const canvasWidth = maxWidth + 2 * padding;
      const canvasHeight = lines.length * lineHeight + 2 * padding;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const context = canvas.getContext("2d");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      context.font = `${fontSize}px monospace`;

      let y = padding;
      lines.forEach((line, index) => {
        let x = padding;

        const lineNumber = (index + 1).toString().padStart(4, " ");
        context.fillStyle = "#888888";
        context.fillText(`${lineNumber} |`, x, y);
        x += lineNumberWidth;

        const session = aceEditorInstance.getSession();
        const tokens = session.getTokens(index);

        tokens.forEach((token) => {
          const text = token.value;
          const tokenType = token.type;

          console.log(
            `Linia ${index + 1}, Token: "${text}", Typ: "${tokenType}"`
          );

          const color = getTokenColor(tokenType); // Użyj funkcji kolorów
          context.fillStyle = color;
          context.fillText(text, x, y);
          x += context.measureText(text).width;
        });

        y += lineHeight;
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `code-editor-snapshot-${Date.now()}.png`;
      link.click();

      toast.success(
        "Obraz z twojego kodu został wygenerowany pomyślnie.  Użyj narzędzia wstawiania grafiki aby dodać go do edytora."
      );
    } catch (error) {
      toast.error("Wystąpił błąd podczas generowania obrazu z kodu");
    }
  };

  // Funkcja mapująca typ tokenu na kolor
  const getTokenColor = (tokenType) => {
    const colorMapping = {
      keyword: "#0000FF", // Niebieski dla słów kluczowych
      string: "#DD1144", //
      comment: "#808080", // Szary dla komentarzy
      constant: "#B22222", // Czerwony dla stałych
      identifier: "#0086B3", // Czarny dla identyfikatorów
      default: "#000000", // Czarny jako domyślny kolor
      variable: "#0086B3", // Pomarańczowy dla zmiennych
      function: "#0086B3", // Pomarańczowy dla zmiennych
      storage: "#0086B3", // Ciemnoniebieski dla instrukcji (np. print, echo)
      object: "#8B0000", // Bordowy dla obiektów
      identifier: "#000000",
      "keyword.control": "#0086B3", // Ciemnoniebieski dla instrukcji sterujących (np. 'echo', 'print')
      "storage.type": "#0086B3", // Opcjonalne dla typów storage w innych językach
    };

    return colorMapping[tokenType] || colorMapping.default;
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Generetor obrazu z kodu programu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="languageSelect">
            <Form.Label>Wybierz język programowania</Form.Label>
            <Form.Control
              as="select"
              value={language}
              style={{ width: "95%" }}
              onChange={(e) => setLanguage(e.target.value)}>
              <option value="html">HTML/XML</option>
              <option value="javascript">JavaScript</option>
              <option value="css">CSS</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c_cpp">C</option>
              <option value="csharp">C#</option>
              <option value="basic">Basic</option>
              <option value="basic">VBA</option>
              <option value="typescript">TypeScript</option>
              <option value="dart">Dart</option>
              <option value="perl">Perl</option>
              <option value="plain_text">Plain Text</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="codeTextarea">
            <Form.Label>Podgląd kodu</Form.Label>
            <div
              style={{
                display: "flex",
                width: "800px",
              }}>
              <div>
                <CodeEditor language={language} code={code} setCode={setCode} />
              </div>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Zrezygnuj
        </Button>
        <Button variant="primary" onClick={handleSaveImage}>
          Zapisz obraz
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const ExamTable = ({ refreshKey, onExamCreated }) => {
  const { editorApiKey } = useContext(AppContext);
  const [docCounts, setDocCounts] = useState(0);
  const [exams, setExams] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [editingExamId, setEditingExamId] = useState(null);
  const [editingAuthors, setEditingAuthors] = useState([]);
  const [editingField, setEditingField] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [professionsData, setProfessionsData] = useState({});
  const [qualificationName, setQualificationName] = useState({});
  const [showAlert, setShowAlert] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [updateKey, setUpdateKey] = useState(0);
  const [newExamIds, setNewExamIds] = useState([]);
  const [expandedExams, setExpandedExams] = useState({}); // Dodano stan dla rozwiniętych egzaminów
  const [expandedAnswers, setExpandedAnswers] = useState({});
  const tableRef = useRef(null);
  const editingFieldRef = useRef(null);
  const isInsideEditingField = useRef(false);
  const { userName, currentUser } = useContext(AppContext);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [examsPerPage] = useState(10);
  const [editing, setEditing] = useState({ examId: null, questionIndex: null });
  const editorRef = useRef(null);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const fetchUserRole = async () => {
    try {
      const userDoc = await getDoc(doc(db, "users", currentUser));
      if (userDoc.exists()) {
        setUserRole(userDoc.data().role);
      }
    } catch (error) {
      console.error("Error fetching user role: ", error);
    }
  };

  const fetchExams = async () => {
    try {
      const q = query(collection(db, "quizCode"));
      const querySnapshot = await getDocs(q);
      const examsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.id,
        qualification: formatQualificationForDisplay(doc.data().Qualification),
        profession: doc.data().Profession,
        year: doc.data().Year,
        session: doc.data().Session,
        autors: doc.data().Autors || [],
      }));

      let filteredExams;
      if (userRole === "sa") {
        filteredExams = examsData;
      } else {
        filteredExams = examsData.filter(
          (exam) =>
            exam.autors.includes(userName) ||
            exam.qualification.toLowerCase().includes("test")
        );
      }
      setExams(filteredExams);
      fetchExamDocCounts(filteredExams);
    } catch (error) {
      console.error("Error fetching exams: ", error);
    }
  };

  const fetchUsers = async () => {
    const q = query(collection(db, "users"), where("role", "in", ["a", "sa"]));
    const querySnapshot = await getDocs(q);
    const fetchedUsers = [];
    querySnapshot.forEach((doc) => {
      fetchedUsers.push({ id: doc.id, ...doc.data() });
    });
    setAvailableUsers(fetchedUsers);
  };

  const fetchProfessionsAndQualifications = async () => {
    try {
      const professionsSnapshot = await getDocs(collection(db, "professions"));
      const professionsData = {};
      professionsSnapshot.forEach((doc) => {
        professionsData[doc.id] = doc.data();
      });
      setProfessionsData(professionsData);

      const qualificationsSnapshot = await getDocs(
        collection(db, "qualificationName")
      );
      const qualificationData = {};
      qualificationsSnapshot.forEach((doc) => {
        qualificationData[doc.id] = doc.data();
      });
      setQualificationName(qualificationData);
    } catch (error) {
      console.error("Error fetching professions and qualifications: ", error);
    }
  };

  useEffect(() => {
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    if (userRole && !isEditorVisible) {
      fetchExams();
      fetchUsers();
      fetchProfessionsAndQualifications();
    }
  }, [userRole, userName, updateKey, refreshKey]);

  useEffect(() => {
    let sortedExams = [...exams];
    if (sortField !== null) {
      sortedExams.sort((a, b) => {
        if (a[sortField] < b[sortField]) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (a[sortField] > b[sortField]) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    setExams(sortedExams);
  }, [sortField, sortDirection]);

  const handleFieldClick = async (examId, authors, field) => {
    if (editingExamId !== null) {
      await handleBlur();
    }

    setEditingExamId(examId);
    setEditingField(field);
    setEditingAuthors(
      authors.map((author, index) => {
        const [firstname, lastname] = author.split(" ");
        return {
          id: index === 0 ? "main" : `${firstname} ${lastname}`,
          firstname,
          lastname,
        };
      })
    );
  };

  const handleSelectUser = (userId) => {
    const user = availableUsers.find((user) => user.id === userId);
    if (user && !editingAuthors.some((author) => author.id === userId)) {
      setEditingAuthors((prevSelected) => [
        ...prevSelected,
        { ...user, id: userId },
      ]);
    }
  };

  const handleRemoveUser = (userId) => {
    if (userId !== "main") {
      setEditingAuthors((prevSelected) =>
        prevSelected.filter((user) => user.id !== userId)
      );
    }
  };

  const handleBlur = async () => {
    if (editingExamId !== null && editingField === "authors") {
      try {
        const examDocRef = doc(db, "quizCode", editingExamId);
        const authorNames = editingAuthors.map(
          (user) => `${user.firstname} ${user.lastname}`
        );
        await updateDoc(examDocRef, { Autors: authorNames });
        const updatedExams = exams.map((exam) =>
          exam.id === editingExamId ? { ...exam, autors: authorNames } : exam
        );
        setExams(updatedExams);
      } catch (error) {
        console.error("Error updating authors: ", error);
      }
    }
    setEditingExamId(null);
    setEditingField(null);
  };

  const handleClickOutside = async (event) => {
    if (
      editingFieldRef.current &&
      !editingFieldRef.current.contains(event.target) &&
      !event.target.closest(".dropdown-menu") &&
      !event.target.closest(".dropdown-toggle")
    ) {
      await handleBlur();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingExamId, editingAuthors]);

  const handleBadgeClick = (user) => {
    if (user.id === "main") {
      setShowAlert(true);
    } else {
      handleRemoveUser(user.id);
    }
  };

  const handleDuplicate = async (exam) => {
    try {
      const generateCode = () => {
        let code = "";
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 8; i++) {
          code += characters.charAt(
            Math.floor(Math.random() * characters.length)
          );
        }
        return code;
      };

      const newCode = generateCode();
      const sessionsDocRef = doc(db, "sessions", "all");
      let sessionsDocSnap = await getDoc(sessionsDocRef);

      if (!sessionsDocSnap.exists()) {
        await setDoc(sessionsDocRef, { sessions: [] });
        sessionsDocSnap = await getDoc(sessionsDocRef);
      }

      let existingSessions = sessionsDocSnap.data().sessions || [];
      let newSession = "A1";
      let i = 0,
        j = 1,
        k = 1,
        l = 1;

      while (existingSessions.includes(newSession)) {
        j++;
        if (j > 9) {
          j = 1;
          i++;
          if (i > 25) {
            i = 0;
            k++;
            if (k > 9) {
              k = 1;
              l++;
            }
          }
        }
        newSession = `${String.fromCharCode(65 + i)}${j}`;
        if (l > 1) {
          newSession = `${String.fromCharCode(65 + l - 2)}${k}${newSession}`;
        }
      }

      await updateDoc(sessionsDocRef, { sessions: arrayUnion(newSession) });

      const examCopy = {
        Qualification: exam.qualification.toLowerCase().replace(".", ""),
        Session: newSession,
        Year: exam.year,
        Profession: exam.profession,
        Autors: exam.autors,
      };

      await setDoc(doc(db, "quizCode", newCode), examCopy);

      const oldCollectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${exam.session}`;
      const newCollectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${newSession}`;

      const oldCollectionRef = collection(db, oldCollectionName);
      const newCollectionRef = collection(db, newCollectionName);

      const oldDocsSnapshot = await getDocs(oldCollectionRef);

      const duplicateDocsPromises = oldDocsSnapshot.docs.map(
        async (docSnapshot) => {
          await setDoc(
            doc(newCollectionRef, docSnapshot.id),
            docSnapshot.data()
          );
        }
      );

      await Promise.all(duplicateDocsPromises);

      setNewExamIds((prevIds) => [...prevIds, newCode]);
      fetchExams(); // Re-fetch the exams to update the list
      toast.success(`Egzamin został pomyślnie zduplikowany: ${newCode}`);
    } catch (error) {
      console.error("Error duplicating exam: ", error);
      toast.error("Błąd podczas duplikowania egzaminu");
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renameCollection = async (oldCollectionName, newCollectionName) => {
    try {
      const oldCollectionRef = collection(db, oldCollectionName);
      const newCollectionRef = collection(db, newCollectionName);

      const oldDocsSnapshot = await getDocs(oldCollectionRef);

      const moveDocPromises = oldDocsSnapshot.docs.map(async (docSnapshot) => {
        await setDoc(doc(newCollectionRef, docSnapshot.id), docSnapshot.data());
        await deleteDoc(docSnapshot.ref);
      });

      await Promise.all(moveDocPromises);
    } catch (error) {
      console.error("Error renaming collection: ", error);
    }
  };

  const renameCollectionAndUpdateDoc = async (
    examId,
    exam,
    newQualification,
    newProfession
  ) => {
    const formattedOldQualification = formatQualificationForStorage(
      exam.qualification
    );
    const formattedNewQualification =
      formatQualificationForStorage(newQualification);
    const oldCollectionName = `${formattedOldQualification}${exam.year}${exam.session}`;
    const newCollectionName = `${formattedNewQualification}${exam.year}${exam.session}`;

    if (oldCollectionName !== newCollectionName) {
      await renameCollection(oldCollectionName, newCollectionName);
    }

    await updateDoc(doc(db, "quizCode", examId), {
      Qualification: formattedNewQualification,
      Profession: newProfession,
    });

    setUpdateKey((prevKey) => prevKey + 1);
  };

  const handleQualificationChange = async (examId, newQualification) => {
    const exam = exams.find((e) => e.id === examId);
    const formattedQualification =
      formatQualificationForStorage(newQualification);

    const updatedExams = exams.map((exam) =>
      exam.id === examId
        ? { ...exam, qualification: formattedQualification }
        : exam
    );
    setExams(updatedExams);

    try {
      await renameCollectionAndUpdateDoc(
        examId,
        exam,
        newQualification,
        exam.profession
      );
    } catch (error) {
      const revertedExams = exams.map((exam) =>
        exam.id === examId
          ? {
              ...exam,
              qualification: formatQualificationForStorage(exam.qualification),
            }
          : exam
      );
      setExams(revertedExams);

      toast.error("Błąd podczas aktualizacji egzaminu", {
        autoClose: 5000,
      });
    }
  };

  const handleProfessionChange = async (examId, newProfession) => {
    const exam = exams.find((e) => e.id === examId);
    const newQualifications = Object.keys(qualificationName).filter(
      (qualification) =>
        qualificationName[qualification].professions.includes(newProfession)
    );
    const formattedQualification = newQualifications[0];

    const updatedExams = exams.map((exam) =>
      exam.id === examId
        ? {
            ...exam,
            profession: newProfession,
            qualification: formattedQualification,
          }
        : exam
    );
    setExams(updatedExams);

    try {
      await renameCollectionAndUpdateDoc(
        examId,
        exam,
        formattedQualification,
        newProfession
      );
    } catch (error) {
      const revertedExams = exams.map((exam) =>
        exam.id === examId
          ? {
              ...exam,
              profession: exam.profession,
              qualification: formatQualificationForStorage(exam.qualification),
            }
          : exam
      );
      setExams(revertedExams);

      toast.error("Błąd podczas aktualizacji egzaminu", {
        autoClose: 5000,
      });
    }
  };

  const formatQualificationForDisplay = (qualification) => {
    const match = qualification.match(/([a-z]+)(\d+)/i);
    return match ? `${match[1].toUpperCase()}.${match[2]}` : qualification;
  };

  const formatQualificationForStorage = (qualification) => {
    return qualification.toLowerCase().replace(".", "");
  };

  const formatQualificationForDeletion = (qualification) => {
    return qualification.toLowerCase().replace(".", "");
  };

  const deleteExam = async (exam) => {
    const formattedQualification = formatQualificationForDeletion(
      exam.qualification
    );
    const examCollectionName = `${formattedQualification}${exam.year}${exam.session}`;
    try {
      await deleteDoc(doc(db, "quizCode", exam.name));

      const examCollectionRef = collection(db, examCollectionName);
      const examDocsSnapshot = await getDocs(examCollectionRef);

      const docDeletionPromises = [];
      examDocsSnapshot.forEach((doc) => {
        docDeletionPromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(docDeletionPromises);

      try {
        const collectionDocs = await getDocs(examCollectionRef);
        collectionDocs.forEach(async (doc) => {
          await deleteDoc(doc.ref);
        });
        console.log(`Collection ${examCollectionName} cleared.`);
      } catch (error) {
        console.error(
          `Error clearing collection ${examCollectionName}: `,
          error
        );
      }

      const updatedExams = exams.filter((e) => e.id !== exam.id);
      setExams(updatedExams);

      toast.success(`Egzamin został pomyślnie usunięty ${examCollectionName}`, {
        autoClose: 2000,
        onClose: () => {
          onExamCreated(); // Wywołanie funkcji odświeżającej
        },
      });
    } catch (error) {
      toast.error("Błąd podczas usuwania egzaminu: " + error.message, {
        autoClose: 5000,
      });
    }
  };

  const handleDeleteClick = (exam) => {
    setSelectedExam(exam);
    setModalIsOpen(true);
  };

  const handleSort = (field) => {
    let direction = "asc";
    if (sortField === field && sortDirection === "asc") {
      direction = "desc";
    }
    setSortField(field);
    setSortDirection(direction);
  };

  const handleExamClick = async (exam) => {
    const expandedState = { ...expandedExams };
    if (expandedState[exam.id]) {
      expandedState[exam.id] = false;
    } else {
      const collectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${exam.session}`;

      const docsSnapshot = await getDocs(collection(db, collectionName));

      const docsData = docsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => parseInt(a.id) - parseInt(b.id)); // Sort by document ID

      expandedState[exam.id] = docsData;
    }
    setExpandedExams(expandedState);
  };

  const toggleAnswerVisibility = (examId, questionIdx) => {
    const key = `${examId}-${questionIdx}`;
    setExpandedAnswers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const onDragEnd = async (result) => {
    const { source, destination } = result;
    if (
      !destination ||
      (source.droppableId === destination.droppableId &&
        source.index === destination.index)
    ) {
      return; // Nie wykonuj żadnej operacji, jeśli nie ma przesunięcia
    }

    const sourceExams = Array.from(expandedExams[source.droppableId]);
    const movedItem = sourceExams[source.index]; // Zapisujemy przesunięty element
    sourceExams.splice(source.index, 1); // Usuwamy element z oryginalnego miejsca
    sourceExams.splice(destination.index, 0, movedItem); // Wstawiamy element na nowe miejsce

    setExpandedExams({
      ...expandedExams,
      [source.droppableId]: sourceExams,
    });

    const exam = exams.find((exam) => exam.id === source.droppableId);
    const collectionName = `${exam.qualification
      .toLowerCase()
      .replace(".", "")}${exam.year}${exam.session}`;
    const batch = writeBatch(db);

    // Ustawianie nowej kolejności z zastosowaniem metody set z opcją merge
    sourceExams.forEach((docData, index) => {
      const docRef = doc(db, collectionName, `${index + 1}`);
      batch.set(docRef, { ...docData, order: index + 1 }, { merge: true });
    });

    try {
      await batch.commit();
      toast.success("Kolejność pytań została pomyślnie zaktualizowana!");
    } catch (error) {
      console.error("Błąd podczas aktualizacji kolejności pytań:", error);
      toast.error("Aktualizacja kolejności pytań nie powiodła się.");
    }
  };

  const handleDoubleClick = (examId, questionIndex, field) => {
    setEditing({ examId, questionIndex, field });
    document.removeEventListener("mousedown", handleClickOutsideEditor);
    document.addEventListener("mousedown", handleClickOutsideEditor);
    setIsEditorVisible(true);
    setIsSaved(true);
  };

  const updateQuestionInDatabase = async (
    examId,
    questionId,
    updatedContent,
    field
  ) => {
    try {
      const exam = exams.find((e) => e.id === examId);
      const collectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${exam.session}`;
      const questionDocRef = doc(db, collectionName, `${questionId + 1}`);

      const cleanContent = updatedContent.replace(
        /<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
        ""
      );

      await updateDoc(questionDocRef, { [field]: cleanContent });
      setIsSaved(true);
      setEditing({ examId: null, questionIndex: null, field: null });
      toast.success("Odpowiedź została pomyślnie zaktualizowana!", {
        autoClose: 2000,
      });

      setExpandedExams((prevExams) => {
        const updatedExams = { ...prevExams };
        updatedExams[examId] = updatedExams[examId].map((question, index) =>
          index === questionId
            ? { ...question, [field]: updatedContent }
            : question
        );
        return updatedExams;
      });
    } catch (error) {
      console.error("Błąd podczas aktualizacji odpowiedzi:", error);
      toast.error("Aktualizacja odpowiedzi nie powiodła się.", {
        autoClose: 5000,
      });
    }
  };

  const handleEditorChange = (content, examId, questionId, field) => {
    if (
      editing.examId === examId &&
      editing.questionIndex === questionId &&
      editing.field === field
    ) {
      setExpandedExams((prevExams) => {
        const updatedExams = { ...prevExams };
        updatedExams[examId] = updatedExams[examId].map((question, index) =>
          index === questionId ? { ...question, [field]: content } : question
        );
        return updatedExams;
      });
    }
    setIsSaved(false); // Zresetuj stan po każdej zmianie
  };

  const handleBlurEgzam = () => {
    if (
      !isSaved &&
      editing.examId !== null &&
      editing.questionIndex !== null &&
      editing.field
    ) {
      const { examId, questionIndex, field } = editing;
      const updatedContent = expandedExams[examId][questionIndex][field];
      updateQuestionInDatabase(examId, questionIndex, updatedContent, field);
    }
    setEditing({ examId: null, questionIndex: null, field: null });
    setIsEditorVisible(false);
    document.removeEventListener("mousedown", handleClickOutsideEditor);
    fetchExams();
  };

  // Funkcja do zamykania edytora po kliknięciu poza jego obszar
  // const handleClickOutsideEditor = (event) => {
  //   if (
  //     editorRef.current &&
  //     !editorRef.current.editorContainer.contains(event.target)
  //   ) {
  //     handleBlurEgzam();
  //   }
  // };

  const handleClickOutsideEditor = (event) => {
    // Check if the editorRef and editor container exist before proceeding
    if (
      editorRef.current &&
      editorRef.current.editorContainer &&
      !editorRef.current.editorContainer.contains(event.target)
    ) {
      handleBlurEgzam();
    }
  };

  // Nasłuchiwacz kliknięć uruchamiany tylko wtedy, gdy edytor jest otwarty
  useEffect(() => {
    if (editing.examId !== null && editing.questionIndex !== null) {
      document.addEventListener("mousedown", handleClickOutsideEditor);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideEditor);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutsideEditor);
  }, [editing]);

  const indexOfLastExam = currentPage * examsPerPage;
  const indexOfFirstExam = indexOfLastExam - examsPerPage;
  const currentExams = exams.slice(indexOfFirstExam, indexOfLastExam);

  const [hoverField, setHoverField] = useState(null);

  const fetchExamDocCounts = async (exams) => {
    const counts = {};
    // Iterujemy przez każdy egzamin, aby pobrać liczbę dokumentów w jego kolekcji
    for (const exam of exams) {
      const collectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${exam.session}`;
      const examCollectionRef = collection(db, collectionName);
      const examDocsSnapshot = await getDocs(examCollectionRef);
      counts[exam.id] = examDocsSnapshot.size; // Przypisujemy liczbę dokumentów do danego egzaminu
    }
    setDocCounts(counts); // Aktualizujemy stan docCounts dla wszystkich egzaminów
  };

  useEffect(() => {
    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    if (userRole) {
      fetchExams();
      fetchUsers();
      fetchProfessionsAndQualifications();
    }
  }, [userRole, userName, updateKey, refreshKey]);

  const addQuestion = async (exam) => {
    try {
      // Nazwa kolekcji na podstawie pola Qualification, Year i Session egzaminu
      const collectionName = `${exam.qualification
        .toLowerCase()
        .replace(".", "")}${exam.year}${exam.session}`;

      // Kolejny numer pytania - docCounts[exam.id] przechowuje liczbę pytań
      const nextQuestionNumber = docCounts[exam.id] + 1;

      // Referencja do nowego dokumentu w Firebase
      const newQuestionRef = doc(
        db,
        collectionName,
        nextQuestionNumber.toString()
      );

      // Dane nowego pytania z pustymi polami oraz odpowiednimi wartościami pól `id` i `order`
      const newQuestionData = {
        a: "<em>dodaj odpowiedź A</em>",
        b: "<em>dodaj odpowiedź B</em>",
        c: "<em>dodaj odpowiedź C</em>",
        d: "<em>dodaj odpowiedź D</em>",
        answer: "a",
        question:
          "<em>W tym miejscu wprowadź pytanie do testu. Dwukrotnie kliknij we mnie lub raz w ikonę ołówka z prawej strony a następnie usuń ten tekst</em>",
        id: nextQuestionNumber.toString(),
        order: nextQuestionNumber,
      };

      // Tworzenie nowego dokumentu z odpowiednim numerem pytania
      await setDoc(newQuestionRef, newQuestionData);

      // Aktualizacja stanu docCounts - zwiększenie liczby pytań o 1
      setDocCounts((prevCounts) => ({
        ...prevCounts,
        [exam.id]: nextQuestionNumber,
      }));

      // Aktualizacja stanu expandedExams
      setExpandedExams((prevExams) => {
        const updatedExams = { ...prevExams };
        if (updatedExams[exam.id]) {
          updatedExams[exam.id] = [
            ...updatedExams[exam.id],
            newQuestionData,
          ].sort((a, b) => a.order - b.order);
        }
        return updatedExams;
      });

      toast.success(
        <div>
          <b>Pytanie {docCounts[exam.id] + 1}</b>
          <br />
          zostało pomyślnie dodane!
        </div>
      );
    } catch (error) {
      console.error(`Błąd podczas dodawania nowego pytania:`, error);
      toast.error("Dodawanie nowego pytania nie powiodło się.");
    }
  };

  const [showModal, setShowModal] = useState(false);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  // const waitForEditorInstance = async (maxRetries = 10, interval = 100) => {
  //   for (let i = 0; i < maxRetries; i++) {
  //     if (editorRef.current && editorRef.current.editor) {
  //       return editorRef.current.editor;
  //     }
  //     console.log(`Waiting for editor instance... (${i + 1}/${maxRetries})`);
  //     await new Promise((resolve) => setTimeout(resolve, interval));
  //   }
  //   throw new Error(
  //     "Failed to initialize Jodit editor instance within the timeout."
  //   );
  // };

  // const handleSaveCodeSample = async () => {
  //   try {
  //     const codeContainer = codeRef.current; // Odwołanie do bloku kodu
  //     if (!codeContainer) {
  //       console.error("Nie znaleziono kontenera kodu.");
  //       return;
  //     }

  //     // Renderowanie kontenera kodu jako obraz
  //     const canvas = await html2canvas(codeContainer, {
  //       backgroundColor: "#fff", // Ustaw białe tło dla przejrzystości
  //     });
  //     const image = canvas.toDataURL("image/png");

  //     // Tworzenie linku do pobrania
  //     const link = document.createElement("a");
  //     link.href = image;
  //     link.download = `code-preview-${Date.now()}.png`; // Nazwa pliku z timestampem
  //     link.click();

  //     console.log("Obraz wygenerowany pomyślnie!");
  //   } catch (error) {
  //     console.error("Błąd podczas generowania obrazu:", error);
  //   }
  // };

  const handleInsertImage = (image) => {
    if (editorRef.current && editorRef.current.editor) {
      const editorInstance = editorRef.current.editor;
      editorInstance.selection.insertHTML(
        `<img src="${image}" alt="Code Preview" />`
      );
      console.log("Obraz dodany do edytora!");
    } else {
      console.error("Brak aktywnego edytora JoditEditor.");
    }
  };

  return (
    <div className="mt-4" ref={tableRef}>
      <DragDropContext onDragEnd={onDragEnd}>
        <table className="table table-striped">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>lp</th>
              <th onClick={() => handleSort("name")}>Kod egzaminu</th>
              <th onClick={() => handleSort("qualification")}>Kwalifikacja</th>
              <th onClick={() => handleSort("profession")}>Zawód</th>
              <th>Osoby z prawem edycji</th>
              <th>Pytań w arkuszu</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {currentExams.map((exam, index) => {
              const isTestQualification = exam.qualification
                .toLowerCase()
                .includes("test");
              const isNewExam = newExamIds.includes(exam.id);
              return (
                <React.Fragment key={exam.id}>
                  <tr
                    key={exam.id}
                    className={`align-middle ${
                      isTestQualification ? "table-warning" : ""
                    } ${isNewExam ? "table-success" : ""}`}>
                    <td className="align-middle">{index + 1}</td>
                    <td
                      className="align-middle"
                      onDoubleClick={() => handleExamClick(exam)}>
                      {exam.name}
                    </td>
                    <td
                      className="align-middle"
                      style={{ width: "20%" }}
                      onClick={(e) => {
                        if (
                          !isInsideEditingField.current &&
                          !isTestQualification
                        ) {
                          handleFieldClick(
                            exam.id,
                            exam.autors,
                            "qualification"
                          );
                        }
                      }}
                      ref={
                        editingExamId === exam.id &&
                        editingField === "qualification"
                          ? editingFieldRef
                          : null
                      }>
                      {editingExamId === exam.id &&
                      editingField === "qualification" ? (
                        <div>
                          <DropdownButton
                            title={formatQualificationForDisplay(
                              exam.qualification
                            )}
                            onSelect={(e) =>
                              handleQualificationChange(exam.id, e)
                            }
                            onMouseEnter={() =>
                              (isInsideEditingField.current = true)
                            }
                            onMouseLeave={() =>
                              (isInsideEditingField.current = false)
                            }>
                            {Object.keys(qualificationName)
                              .filter((key) =>
                                qualificationName[key].professions.includes(
                                  exam.profession
                                )
                              )
                              .map((key) => (
                                <Dropdown.Item key={key} eventKey={key}>
                                  {formatQualificationForDisplay(key)}
                                </Dropdown.Item>
                              ))}
                          </DropdownButton>
                        </div>
                      ) : (
                        formatQualificationForDisplay(exam.qualification)
                      )}
                    </td>
                    <td
                      className="align-middle"
                      style={{ width: "20%" }}
                      onClick={(e) => {
                        if (
                          !isInsideEditingField.current &&
                          !isTestQualification
                        ) {
                          handleFieldClick(exam.id, exam.autors, "profession");
                        }
                      }}
                      ref={
                        editingExamId === exam.id &&
                        editingField === "profession"
                          ? editingFieldRef
                          : null
                      }>
                      {editingExamId === exam.id &&
                      editingField === "profession" ? (
                        <div>
                          <DropdownButton
                            title={exam.profession}
                            onSelect={(e) => handleProfessionChange(exam.id, e)}
                            onMouseEnter={() =>
                              (isInsideEditingField.current = true)
                            }
                            onMouseLeave={() =>
                              (isInsideEditingField.current = false)
                            }>
                            {Object.keys(professionsData).map((profession) => (
                              <Dropdown.Item
                                key={profession}
                                eventKey={profession}>
                                {profession}
                              </Dropdown.Item>
                            ))}
                          </DropdownButton>
                        </div>
                      ) : (
                        exam.profession
                      )}
                    </td>
                    <td
                      className="align-middle"
                      onClick={(e) => {
                        if (!isInsideEditingField.current) {
                          handleFieldClick(exam.id, exam.autors, "authors");
                        }
                      }}
                      ref={
                        editingExamId === exam.id && editingField === "authors"
                          ? editingFieldRef
                          : null
                      }>
                      {editingExamId === exam.id &&
                      editingField === "authors" ? (
                        <div>
                          <div>
                            {editingAuthors.map((user, index) => (
                              <Badge
                                key={index}
                                pill
                                bg="primary"
                                className="me-2"
                                onClick={() => handleBadgeClick(user)}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() =>
                                  (isInsideEditingField.current = true)
                                }
                                onMouseLeave={() =>
                                  (isInsideEditingField.current = false)
                                }>
                                <FontAwesomeIcon icon={faUserCircle} />{" "}
                                {user.firstname} {user.lastname}
                              </Badge>
                            ))}
                          </div>
                          <br />
                          <DropdownButton
                            title="Wybierz użytkownika"
                            onSelect={(e) => handleSelectUser(e)}
                            onMouseEnter={() =>
                              (isInsideEditingField.current = true)
                            }
                            onMouseLeave={() =>
                              (isInsideEditingField.current = false)
                            }>
                            {availableUsers
                              .filter(
                                (user) =>
                                  !editingAuthors.some(
                                    (author) =>
                                      `${author.firstname} ${author.lastname}` ===
                                      `${user.firstname} ${user.lastname}`
                                  )
                              )
                              .map((user) => (
                                <Dropdown.Item key={user.id} eventKey={user.id}>
                                  {`${user.firstname} ${user.lastname}`}
                                </Dropdown.Item>
                              ))}
                          </DropdownButton>
                        </div>
                      ) : (
                        exam.autors.map((author, index) => (
                          <div key={index}>
                            {author}
                            <br />
                          </div>
                        ))
                      )}
                    </td>
                    <td>{docCounts[exam.id]} / 40</td>
                    <td className="align-middle">
                      {!isTestQualification && (
                        <Button
                          variant="info"
                          className="me-2"
                          onClick={() => handleExamClick(exam)}>
                          <FontAwesomeIcon
                            title={
                              expandedExams[exam.id]
                                ? "Ukryj zadania"
                                : "Pokaż zadania"
                            }
                            icon={
                              expandedExams[exam.id] ? faArrowUp : faArrowDown
                            }
                          />
                        </Button>
                      )}
                      {!isTestQualification && (
                        <Button
                          variant="danger"
                          className="me-2"
                          onClick={() => handleDeleteClick(exam)}>
                          <FontAwesomeIcon icon={faTrashCan} />
                        </Button>
                      )}
                      {!isTestQualification && (
                        <Button
                          variant="warning"
                          onClick={() => handleDuplicate(exam)}>
                          <FontAwesomeIcon icon={faCopy} />
                        </Button>
                      )}
                      {docCounts[exam.id] < 40 &&
                        !exam.qualification.startsWith("TEST") && (
                          <Button
                            variant="success"
                            title="Dodaj pytanie do arkusza"
                            className="ms-2"
                            onClick={() => addQuestion(exam)}>
                            <FontAwesomeIcon icon={faPlus} />
                          </Button>
                        )}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <Collapse in={expandedExams[exam.id]}>
                        <Droppable droppableId={String(exam.id)}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="container-fluid">
                              {expandedExams[exam.id] &&
                                expandedExams[exam.id].map((doc, idx) => (
                                  <Draggable
                                    key={idx}
                                    draggableId={`drag-${exam.id}-${idx}`}
                                    index={idx}>
                                    {(provided) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="alert alert-info"
                                        onDoubleClick={() =>
                                          toggleAnswerVisibility(exam.id, idx)
                                        }>
                                        <strong>Pytanie {idx + 1}</strong>

                                        <hr />

                                        <div
                                          style={{
                                            position: "relative",
                                          }}
                                          className="p-3 mb-2 bg-light text-dark rounded position-relative"
                                          onDoubleClick={() =>
                                            handleDoubleClick(
                                              exam.id,
                                              idx,
                                              "question"
                                            )
                                          }
                                          onMouseEnter={() =>
                                            setHoverField(
                                              `${exam.id}-${idx}-question`
                                            )
                                          }>
                                          {editing.examId === exam.id &&
                                          editing.questionIndex === idx &&
                                          editing.field === "question" ? (
                                            <JoditEditor
                                              ref={editorRef}
                                              value={
                                                expandedExams[exam.id][idx]
                                                  .question
                                              }
                                              onEditorChange={(content) =>
                                                handleEditorChange(
                                                  content,
                                                  exam.id,
                                                  idx,
                                                  "question"
                                                )
                                              }
                                              onChange={() =>
                                                setIsEditorReady(true)
                                              }
                                              onBlur={() =>
                                                setIsEditorReady(true)
                                              }
                                              config={{
                                                readonly: false,
                                                toolbarSticky: true,
                                                toolbarStickyOffset: 0,

                                                height: 400,
                                                toolbarAdaptive: false,
                                                buttons: [
                                                  {
                                                    name: "save",
                                                    exec: () =>
                                                      updateQuestionInDatabase(
                                                        exam.id,
                                                        idx,
                                                        editorRef.current.value,
                                                        "question"
                                                      ),
                                                  },
                                                  "|",
                                                  "undo",
                                                  "redo",
                                                  "|",
                                                  "video",
                                                  "image",
                                                  "link",
                                                  "table",
                                                  "|",
                                                  "font",
                                                  "fontsize",
                                                  "bold",
                                                  "italic",
                                                  "underline",
                                                  "strikethrough",
                                                  "brush",
                                                  "|",
                                                  "align",
                                                  "|",
                                                  "ul",
                                                  "ol",
                                                  "outdent",
                                                  "indent",
                                                  "|",
                                                  "copyformat",
                                                  "eraser",
                                                  "|",
                                                  "hr",
                                                ],
                                                extraButtons: [
                                                  {
                                                    name: "codeBlock",
                                                    tooltip: "Wstaw blok kodu",
                                                    iconURL:
                                                      "https://cdn.icon-icons.com/icons2/2406/PNG/512/codeblock_editor_highlight_icon_145997.png",
                                                    exec: (editor) => {
                                                      const pre =
                                                        editor.selection.j.createInside.element(
                                                          "pre"
                                                        );
                                                      pre.style =
                                                        "background-color:#F0F0F0; text-align:left; padding:10px;";
                                                      pre.innerHTML =
                                                        editor.selection.html;
                                                      editor.selection.insertNode(
                                                        pre
                                                      );
                                                    },
                                                  },
                                                  {
                                                    name: "insertCode",
                                                    tooltip:
                                                      "Generuj obraz z kodu",
                                                    zIndex: 99999, // Główny zIndex dla całego edytora
                                                    iconURL:
                                                      "https://cdn.icon-icons.com/icons2/561/PNG/512/code-optimization_icon-icons.com_53810.png",
                                                    exec: () =>
                                                      handleOpenModal(),
                                                  },
                                                  {
                                                    name: "exitEditor",
                                                    tooltip:
                                                      "Wyjdź z trybu edycji",
                                                    iconURL:
                                                      "https://cdn.icon-icons.com/icons2/1993/PNG/512/cancel_close_delete_exit_logout_remove_x_icon_123217.png",
                                                    exec: () => {
                                                      handleBlurEgzam();
                                                    },
                                                  },
                                                ],
                                                uploader: {
                                                  insertImageAsBase64URI: true,
                                                },
                                              }}
                                            />
                                          ) : (
                                            <div className="position-relative">
                                              <p
                                                onDoubleClick={() =>
                                                  handleDoubleClick(
                                                    exam.id,
                                                    idx
                                                  )
                                                }
                                                dangerouslySetInnerHTML={{
                                                  __html:
                                                    expandedExams[exam.id][idx]
                                                      .question,
                                                }}
                                              />
                                              {hoverField ===
                                                `${exam.id}-${idx}-question` && (
                                                <div
                                                  className="position-absolute top-0 end-0 p-2"
                                                  onClick={() =>
                                                    handleDoubleClick(
                                                      exam.id,
                                                      idx,
                                                      "question"
                                                    )
                                                  }
                                                  style={{ cursor: "pointer" }}>
                                                  <FontAwesomeIcon
                                                    icon={faPencilAlt}
                                                    className="text-secondary"
                                                  />
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        <Collapse
                                          in={
                                            expandedAnswers[`${exam.id}-${idx}`]
                                          }>
                                          <div>
                                            {["a", "b", "c", "d", "answer"].map(
                                              (field) => (
                                                <div
                                                  key={field}
                                                  className={`p-3 mb-2 bg-${
                                                    field === "answer"
                                                      ? "dark text-white"
                                                      : "light text-dark"
                                                  } rounded`}
                                                  onMouseEnter={() =>
                                                    setHoverField(
                                                      `${exam.id}-${idx}-${field}`
                                                    )
                                                  }>
                                                  <p>
                                                    <strong>
                                                      {field === "answer"
                                                        ? "Poprawna odpowiedź:"
                                                        : `${field}:`}
                                                    </strong>
                                                  </p>
                                                  {editing.examId === exam.id &&
                                                  editing.questionIndex ===
                                                    idx &&
                                                  editing.field === field ? (
                                                    field === "answer" ? (
                                                      <DropdownButton
                                                        title={
                                                          expandedExams[
                                                            exam.id
                                                          ][idx].answer ||
                                                          "Wybierz odpowiedź"
                                                        }
                                                        onSelect={(
                                                          selectedAnswer
                                                        ) => {
                                                          handleEditorChange(
                                                            selectedAnswer,
                                                            exam.id,
                                                            idx,
                                                            field
                                                          );
                                                          updateQuestionInDatabase(
                                                            exam.id,
                                                            idx,
                                                            selectedAnswer,
                                                            field
                                                          );
                                                          setIsSaved(true);
                                                        }}
                                                        variant="dark">
                                                        <Dropdown.Item eventKey="a">
                                                          a
                                                        </Dropdown.Item>
                                                        <Dropdown.Item eventKey="b">
                                                          b
                                                        </Dropdown.Item>
                                                        <Dropdown.Item eventKey="c">
                                                          c
                                                        </Dropdown.Item>
                                                        <Dropdown.Item eventKey="d">
                                                          d
                                                        </Dropdown.Item>
                                                      </DropdownButton>
                                                    ) : (
                                                      <JoditEditor
                                                        ref={editorRef}
                                                        value={
                                                          expandedExams[
                                                            exam.id
                                                          ][idx][field]
                                                        }
                                                        onEditorChange={(
                                                          content
                                                        ) =>
                                                          handleEditorChange(
                                                            content,
                                                            exam.id,
                                                            idx,
                                                            field
                                                          )
                                                        }
                                                        onBlur={handleBlurEgzam}
                                                        config={{
                                                          readonly: false,
                                                          toolbarSticky: true,
                                                          toolbarStickyOffset: 0,
                                                          zIndex: 9999, // Aby zapewnić widoczność paska narzędzi nad innymi elementami
                                                          popup: {
                                                            showOnClick: true,
                                                            zIndex: 9999, // Ustawienia z-index dla popupów
                                                          },
                                                          toolbarAdaptive: false,

                                                          buttons: [
                                                            "save",
                                                            "|",
                                                            "undo",
                                                            "redo",
                                                            "|",
                                                            "video",
                                                            "image",
                                                            "link",
                                                            "table",
                                                            "|",
                                                            "font",
                                                            "fontsize",
                                                            "bold",
                                                            "italic",
                                                            "underline",
                                                            "strikethrough",
                                                            "brush",
                                                            "|",
                                                            "align",
                                                            "|",
                                                            "ul",
                                                            "ol",
                                                            "outdent",
                                                            "indent",
                                                            "|",
                                                            "copyformat",
                                                            "|",
                                                            "hr",
                                                          ],
                                                          uploader: {
                                                            insertImageAsBase64URI: true, // Enables image insertion as base64 data URI directly
                                                          },
                                                          style: {
                                                            pre: "font-family: monospace; background: #f4f4f4; padding: 10px; border-radius: 4px;",
                                                            code: "color: #d6336c; background-color: #f4f4f4; padding: 3px; border-radius: 3px;",
                                                          },
                                                        }}
                                                      />
                                                    )
                                                  ) : (
                                                    <div
                                                      onClick={() =>
                                                        handleDoubleClick(
                                                          exam.id,
                                                          idx,
                                                          field
                                                        )
                                                      }
                                                      className="position-relative"
                                                      style={{
                                                        cursor: "pointer",
                                                      }}>
                                                      <p
                                                        dangerouslySetInnerHTML={{
                                                          __html:
                                                            expandedExams[
                                                              exam.id
                                                            ][idx][field],
                                                        }}
                                                      />
                                                      {hoverField ===
                                                        `${exam.id}-${idx}-${field}` && (
                                                        <div
                                                          className="position-absolute top-0 end-0 p-2"
                                                          onClick={() =>
                                                            handleDoubleClick(
                                                              exam.id,
                                                              idx,
                                                              field
                                                            )
                                                          }
                                                          style={{
                                                            cursor: "pointer",
                                                          }}>
                                                          <FontAwesomeIcon
                                                            icon={faPencilAlt}
                                                            className="text-secondary"
                                                          />
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </Collapse>
                                        <Button
                                          title={
                                            expandedAnswers[`${exam.id}-${idx}`]
                                              ? "Zwiń odpowiedzi"
                                              : "Rozwiń odpowiedzi"
                                          }
                                          variant="info"
                                          onClick={() =>
                                            toggleAnswerVisibility(exam.id, idx)
                                          }>
                                          <FontAwesomeIcon
                                            icon={
                                              expandedAnswers[
                                                `${exam.id}-${idx}`
                                              ]
                                                ? faArrowUp
                                                : faArrowDown
                                            }
                                          />
                                        </Button>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </DragDropContext>
      <Pagination
        usersPerPage={examsPerPage}
        totalUsers={exams.length}
        paginate={paginate}
      />
      <div style={{ height: 50 }}></div>
      <ExitAlert
        header="Uwaga"
        message="Nie można edytować głównego autora arkusza egzaminacyjnego"
        show={showAlert}
        onClose={() => setShowAlert(false)}
        buttons="Ok"
      />
      <WindowConfirm
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        title="Usuwanie egzaminu"
        windowText={
          selectedExam
            ? `Czy napewno chcesz usunąć egzamin: ${selectedExam.name}?`
            : ""
        }
        onConfirm={() => {
          setModalIsOpen(false);
          if (selectedExam) deleteExam(selectedExam);
        }}
      />
      <CodeSampleModal
        show={showModal}
        onClose={handleCloseModal}
        onSave={handleInsertImage}
        editorRef={editorRef}
      />
    </div>
  );
};

export default ExamTable;
