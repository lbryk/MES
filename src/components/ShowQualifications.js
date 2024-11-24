import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "../firebase"; // Adjust path as needed
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faPencilAlt,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import { Dropdown, DropdownButton, Badge } from "react-bootstrap";
import { toast } from "react-toastify";

const ShowQualifications = () => {
  const [qualifications, setQualifications] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const editingAreaRef = useRef(null);
  const dropdownAreaRef = useRef(null);

  useEffect(() => {
    fetchQualifications();
    fetchProfessions();
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchQualifications = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "qualificationName"));
      const qualificationsData = querySnapshot.docs.map((doc, index) => ({
        id: doc.id,
        professions: doc.data().professions || [],
        index: index + 1,
      }));
      setQualifications(qualificationsData);
    } catch (error) {
      toast.error(
        "Błąd podczas pobierania danych z kolekcji qualificationName."
      );
    }
  };

  const fetchProfessions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "professions"));
      const professionsData = querySnapshot.docs.map((doc) => doc.id);
      setProfessions(professionsData);
    } catch (error) {
      toast.error("Błąd podczas pobierania danych z kolekcji professions.");
    }
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
              <td>{qualification.id}</td>
              <td onClick={() => setEditingId(qualification.id)}>
                {renderProfessions(qualification)}
                {editingId === qualification.id &&
                  renderDropdown(qualification)}
              </td>
              <td style={{ textAlign: "center" }}>
                <button
                  className="btn btn-danger"
                  onClick={() => handleRemoveProfession(qualification.id)}>
                  <FontAwesomeIcon icon={faTrashCan} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShowQualifications;
