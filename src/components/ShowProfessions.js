import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrashCan, faPlus } from "@fortawesome/free-solid-svg-icons";
import { toast } from "react-toastify";
import WindowConfirm from "./WindowConfirm"; // Import the modal component

const ShowProfessions = () => {
  const [professions, setProfessions] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const [selectedProfessions, setSelectedProfessions] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [professionToDelete, setProfessionToDelete] = useState(null);
  const [isBulkDelete, setIsBulkDelete] = useState(false);
  const [disableActionButtons, setDisableActionButtons] = useState(false);

  const fetchProfessions = () => {
    const unsubscribe = onSnapshot(
      collection(db, "professions"),
      (snapshot) => {
        const professionsData = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          index: index + 1,
        }));
        setProfessions(professionsData);
      }
    );

    return unsubscribe; // Funkcja do zakończenia nasłuchiwania
  };

  useEffect(() => {
    const unsubscribe = fetchProfessions(); // Rozpocznij nasłuchiwanie zmian
    return () => unsubscribe(); // Wyłącz nasłuchiwanie po odmontowaniu komponentu
  }, []);

  const handleDoubleClick = (index, currentName) => {
    setEditingIndex(index);
    setEditingValue(currentName);
  };

  const handleSaveEdit = async (oldId) => {
    // Exit early if there's no change in the name
    if (editingValue === oldId) {
      setEditingIndex(null); // Exit editing mode
      return;
    }

    // Check if the new name is a duplicate
    const isDuplicate = await checkIfProfessionExists(editingValue, oldId);
    if (isDuplicate) {
      toast.error("Zawód już istnieje. Użyj innej nazwy.");
      return;
    }

    try {
      // Proceed with renaming the document if no duplicate found
      const uniqueName = editingValue;
      await setDoc(doc(db, "professions", uniqueName), { name: uniqueName });
      await deleteDoc(doc(db, "professions", oldId));
      fetchProfessions();
      toast.success("Nazwa zawodu zaktualizowana");
    } catch (error) {
      toast.error("Błąd aktualizacji: " + error.message);
    }

    setEditingIndex(null);
  };

  const checkIfProfessionExists = async (name, excludeId = null) => {
    const snapshot = await getDocs(collection(db, "professions"));
    return snapshot.docs.some((doc) => doc.id === name && doc.id !== excludeId);
  };

  const handleDeleteClick = (id) => {
    setProfessionToDelete(id);
    setModalIsOpen(true);
  };

  const confirmDelete = async () => {
    if (isBulkDelete) {
      // Bulk delete logic
      for (const id of selectedProfessions) {
        await deleteDoc(doc(db, "professions", id));
      }
      setSelectedProfessions([]);
      toast.success("Wybrane zawody zostały usunięte");
    } else if (professionToDelete) {
      // Single delete logic
      await deleteDoc(doc(db, "professions", professionToDelete));
      toast.success("Zawód usunięty");
    }

    // Close modal and reset state
    fetchProfessions();
    setModalIsOpen(false);
    setProfessionToDelete(null);
    setIsBulkDelete(false);
  };

  const handleKeyDown = (event, oldId) => {
    if (event.key === "Enter") {
      handleSaveEdit(oldId);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProfessions.length === 0) {
      toast.warning("Wybierz przynajmniej jeden zawód do usunięcia.");
      return;
    }
    setIsBulkDelete(true); // Bulk delete mode
    setModalIsOpen(true);
  };

  const handleAddProfession = async () => {
    const newDocumentId = await generateUniqueName("nowy zawód");
    try {
      await setDoc(doc(db, "professions", newDocumentId), {
        name: newDocumentId,
      });
      fetchProfessions();
      toast.success("Dodano nowy zawód");
    } catch (error) {
      toast.error("Błąd dodawania: " + error.message);
    }
  };

  const generateUniqueName = async (baseName) => {
    let name = baseName;
    let exists = true;
    let counter = 1;

    while (exists) {
      const snapshot = await getDocs(collection(db, "professions"));
      exists = snapshot.docs.some((doc) => doc.id === name);
      if (exists) {
        name = `${baseName} ${String(counter).padStart(3, "0")}`;
        counter += 1;
      }
    }
    return name;
  };

  const handleSelectAll = () => {
    const newSelection = selectAll ? [] : professions.map((p) => p.id);
    setSelectedProfessions(newSelection);
    setDisableActionButtons(newSelection.length > 1);
    setSelectAll(!selectAll);
  };

  const handleSelect = (id) => {
    const newSelection = selectedProfessions.includes(id)
      ? selectedProfessions.filter((selectedId) => selectedId !== id)
      : [...selectedProfessions, id];
    setSelectedProfessions(newSelection);
    setDisableActionButtons(newSelection.length > 1);
  };

  const renderModalMessage = () => {
    if (isBulkDelete) {
      return "Czy chcesz usunąć wszystkie zaznaczone zawody?";
    } else {
      const profession = professions.find((p) => p.id === professionToDelete);
      return `Czy na pewno chcesz usunąć zawód: ${profession?.name}?`;
    }
  };

  const centeredIconStyle = {
    textAlign: "center",
    verticalAlign: "middle",
  };

  return (
    <div className="mt-4">
      <button
        className="btn btn-danger mb-3"
        onClick={handleBulkDelete}
        disabled={selectedProfessions.length === 0}>
        Usuń zaznaczone &nbsp;
        <FontAwesomeIcon icon={faTrashCan} />
      </button>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
            <th>lp</th>
            <th>Nazwa zawodu</th>
            <th style={centeredIconStyle}>
              <FontAwesomeIcon icon={faTrashCan} />
            </th>
          </tr>
        </thead>
        <tbody>
          {professions.map((profession, index) => (
            <tr key={profession.id}>
              <td>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedProfessions.includes(profession.id)}
                  onChange={() => handleSelect(profession.id)}
                />
              </td>
              <td>{index + 1}</td>
              <td
                onDoubleClick={() => handleDoubleClick(index, profession.name)}>
                {editingIndex === index ? (
                  <input
                    type="text"
                    className="form-control"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, profession.id)}
                    onBlur={() => handleSaveEdit(profession.id)}
                    style={{ width: "100%", maxWidth: "500px" }}
                  />
                ) : (
                  profession.name
                )}
              </td>
              <td style={centeredIconStyle}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDeleteClick(profession.id)}
                  disabled={disableActionButtons}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </td>
            </tr>
          ))}
          <tr>
            <td style={centeredIconStyle} onClick={handleAddProfession}>
              <FontAwesomeIcon icon={faPlus} style={{ cursor: "pointer" }} />
            </td>
            <td onClick={handleAddProfession}>
              <FontAwesomeIcon icon={faPlus} style={{ cursor: "pointer" }} />
            </td>
            <td style={centeredIconStyle} onClick={handleAddProfession}>
              <FontAwesomeIcon icon={faPlus} style={{ cursor: "pointer" }} />
            </td>
            <td style={centeredIconStyle} onClick={handleAddProfession}>
              <FontAwesomeIcon icon={faPlus} style={{ cursor: "pointer" }} />
            </td>
          </tr>
        </tbody>
      </table>
      <WindowConfirm
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        title="Potwierdzenie usunięcia"
        windowText={renderModalMessage()}
        onConfirm={confirmDelete}
      />
      <div style={{ height: 50 }}></div>
    </div>
  );
};

export default ShowProfessions;
