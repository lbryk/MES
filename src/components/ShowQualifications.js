import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase"; // Adjust path as needed
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faPencilAlt,
  faTimesCircle,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { Dropdown, DropdownButton, Badge } from "react-bootstrap";
import { toast } from "react-toastify";
import WindowConfirm from "./WindowConfirm"; // Import modal component

const ShowQualifications = () => {
  const [qualifications, setQualifications] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const editingAreaRef = useRef(null);
  const dropdownAreaRef = useRef(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [qualificationToDelete, setQualificationToDelete] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    const unsubscribeQualifications = fetchQualifications();
    const unsubscribeProfessions = fetchProfessions();

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribeQualifications(); // Wyłącz nasłuchiwanie dla kwalifikacji
      unsubscribeProfessions(); // Wyłącz nasłuchiwanie dla zawodów
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchQualifications = () => {
    const unsubscribe = onSnapshot(
      collection(db, "qualificationName"),
      (snapshot) => {
        const qualificationsData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          professions: doc.data().professions || [],
          index: index + 1,
        }));
        setQualifications(qualificationsData);
      }
    );

    return unsubscribe; // Funkcja do zakończenia nasłuchiwania
  };

  const fetchProfessions = () => {
    const unsubscribe = onSnapshot(
      collection(db, "professions"),
      (snapshot) => {
        const professionsData = snapshot.docs.map((doc) => doc.id);
        setProfessions(professionsData);
      }
    );

    return unsubscribe; // Funkcja do zakończenia nasłuchiwania
  };

  const handleClickOutside = (event) => {
    if (
      editingAreaRef.current &&
      !editingAreaRef.current.contains(event.target) &&
      dropdownAreaRef.current &&
      !dropdownAreaRef.current.contains(event.target)
    ) {
      setEditingId(null); // Close the dropdown if clicked outside
    }
  };

  const handleAddProfession = async (qualificationId, profession) => {
    const qualificationRef = doc(db, "qualificationName", qualificationId);
    await updateDoc(qualificationRef, {
      professions: arrayUnion(profession),
    });
    fetchQualifications(); // refresh list to show new professions
  };

  const handleRemoveProfession = async (qualificationId, profession) => {
    const qualificationRef = doc(db, "qualificationName", qualificationId);
    await updateDoc(qualificationRef, {
      professions: arrayRemove(profession),
    });
    fetchQualifications(); // refresh list to reflect the removed profession
  };

  const generateUniqueQualificationId = async () => {
    const snapshot = await getDocs(collection(db, "qualificationName"));
    const ids = snapshot.docs.map((doc) => doc.id);
    const prefix = "AAA.";
    let maxNumber = 0;

    ids.forEach((id) => {
      if (id.startsWith(prefix)) {
        const number = parseInt(id.replace(prefix, ""), 10);
        if (!isNaN(number) && number > maxNumber) {
          maxNumber = number;
        }
      }
    });

    return `${prefix}${(maxNumber + 1).toString().padStart(2, "0")}`;
  };

  // Funkcja obsługująca dodanie nowego dokumentu
  const handleAddQualification = async () => {
    const newId = await generateUniqueQualificationId();

    let defaultProfession = "testowy zawód";
    if (professions.length > 0) {
      defaultProfession = professions[0]; // Pierwszy dokument w kolekcji professions
    }

    try {
      await setDoc(doc(db, "qualificationName", newId), {
        professions: [defaultProfession],
      });
      fetchQualifications(); // Odśwież dane
      toast.success("Dodano nową kwalifikację");
    } catch (error) {
      toast.error("Błąd podczas dodawania kwalifikacji: " + error.message);
    }
  };

  const handleDeleteClick = (id) => {
    setQualificationToDelete(id); // Ustaw ID kwalifikacji do usunięcia
    setModalIsOpen(true); // Otwórz modal
  };

  const confirmDelete = async () => {
    try {
      if (qualificationToDelete) {
        await deleteDoc(doc(db, "qualificationName", qualificationToDelete)); // Usuń dokument
        fetchQualifications(); // Odśwież dane
        toast.success("Kwalifikacja została usunięta.");
      }
    } catch (error) {
      toast.error("Błąd podczas usuwania kwalifikacji: " + error.message);
    } finally {
      setModalIsOpen(false); // Zamknij modal
      setQualificationToDelete(null); // Wyzeruj ID kwalifikacji
    }
  };

  const renderModalMessage = () => {
    const qualification = qualifications.find(
      (q) => q.id === qualificationToDelete
    );
    return `Czy na pewno chcesz usunąć kwalifikację: ${qualification?.id}?`;
  };

  const handleDoubleClick = (id, currentName) => {
    setEditingId(id);
    setEditingValue(currentName);
  };

  const handleSaveEdit = async (oldId) => {
    if (editingValue === oldId) {
      // Jeśli nazwa się nie zmieniła, zakończ edycję
      setEditingId(null);
      return;
    }

    try {
      // Sprawdzenie duplikatów
      const isDuplicate = await checkIfQualificationExists(editingValue);
      if (isDuplicate) {
        toast.error(
          "Kwalifikacja o tej nazwie już istnieje. Wybierz inną nazwę."
        );
        return;
      }

      // Zmień nazwę dokumentu w Firestore
      await setDoc(doc(db, "qualificationName", editingValue), {
        professions:
          qualifications.find((q) => q.id === oldId)?.professions || [],
      });
      await deleteDoc(doc(db, "qualificationName", oldId));
      fetchQualifications(); // Odśwież dane
      toast.success("Nazwa kwalifikacji została zaktualizowana.");
    } catch (error) {
      toast.error("Błąd podczas zmiany nazwy kwalifikacji: " + error.message);
    } finally {
      setEditingId(null);
    }
  };

  const checkIfQualificationExists = async (name) => {
    const snapshot = await getDocs(collection(db, "qualificationName"));
    return snapshot.docs.some((doc) => doc.id === name);
  };

  const handleKeyDown = (event, oldId) => {
    if (event.key === "Enter") {
      handleSaveEdit(oldId);
    }
  };

  const renderProfessions = (qualification) => {
    return qualification.professions.map((profession, index) => (
      <Badge
        key={index}
        pill
        bg="secondary"
        className="me-1"
        onClick={() => handleRemoveProfession(qualification.id, profession)}>
        {profession} <FontAwesomeIcon icon={faTimesCircle} />
      </Badge>
    ));
  };

  const renderDropdown = (qualification) => {
    return (
      <DropdownButton
        ref={dropdownAreaRef}
        title="Dodaj zawód"
        variant="success"
        className="d-inline-block"
        onSelect={(event) => handleAddProfession(qualification.id, event)}>
        {professions
          .filter((prof) => !qualification.professions.includes(prof))
          .map((profession) => (
            <Dropdown.Item key={profession} eventKey={profession}>
              {profession}
            </Dropdown.Item>
          ))}
      </DropdownButton>
    );
  };

  return (
    <div className="mt-4">
      <table className="table table-striped" ref={editingAreaRef}>
        <thead>
          <tr>
            <th>lp</th>
            <th>Kod kwalifikacji</th>
            <th>Przypisana do zawodów</th>
            <th style={{ textAlign: "center" }}>
              <FontAwesomeIcon icon={faTrashCan} />
            </th>
          </tr>
        </thead>
        <tbody>
          {qualifications.map((qualification, index) => (
            <tr key={qualification.id}>
              <td>{index + 1}</td>
              <td
                onDoubleClick={() =>
                  handleDoubleClick(qualification.id, qualification.id)
                }>
                {editingId === qualification.id ? (
                  <input
                    type="text"
                    className="form-control"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, qualification.id)}
                    onBlur={() => handleSaveEdit(qualification.id)}
                    style={{ width: "100%", maxWidth: "350px" }}
                    autoFocus
                  />
                ) : (
                  qualification.id
                )}
              </td>
              <td onClick={() => setEditingId(qualification.id)}>
                {renderProfessions(qualification)}
                {editingId === qualification.id &&
                  renderDropdown(qualification)}
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteClick(qualification.id)}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td style={{ textAlign: "center" }}>
              <FontAwesomeIcon
                icon={faPlus}
                style={{ cursor: "pointer" }}
                onClick={handleAddQualification}
              />
            </td>
            <td style={{ textAlign: "center" }}>
              <FontAwesomeIcon
                icon={faPlus}
                style={{ cursor: "pointer" }}
                onClick={handleAddQualification}
              />
            </td>
            <td style={{ textAlign: "center" }}>
              <FontAwesomeIcon
                icon={faPlus}
                style={{ cursor: "pointer" }}
                onClick={handleAddQualification}
              />
            </td>
            <td style={{ textAlign: "center" }}>
              <FontAwesomeIcon
                icon={faPlus}
                style={{ cursor: "pointer" }}
                onClick={handleAddQualification}
              />
            </td>
          </tr>
        </tbody>
      </table>
      <WindowConfirm
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)} // Zamknij modal bez akcji
        title="Potwierdzenie usunięcia"
        windowText={renderModalMessage()} // Tekst modala
        onConfirm={confirmDelete} // Potwierdzenie
      />
      <div style={{ height: 50 }}></div>
    </div>
  );
};

export default ShowQualifications;
