import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/js/bootstrap.bundle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Collapse from "@mui/material/Collapse";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
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
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
library.add(faTrashCan, faFileExcel, faFile, faUserPlus, faUserMinus);

const ShowAdmins = ({ currentUserId }) => {
  const [originalUsers, setOriginalUsers] = useState([]);
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

  const [profession, setfetchProfession] = useState([]);
  useEffect(() => {
    const fetchProfession = async () => {
      const querySnapshot = await getDocs(collection(db, "professions"));
      const codes = querySnapshot.docs.map((doc) => doc.id);
      setfetchProfession(codes);
    };
    fetchProfession();
  }, []);

  const [suggestionsFirstName, setSuggestionsFirstName] = useState([]);
  const [suggestionsLastName, setSuggestionsLastName] = useState([]);
  const [suggestionsRole, setSuggestionsRole] = useState([]);

  useEffect(() => {
    // Generowanie unikalnych wartości dla sugestii
    setSuggestionsFirstName([...new Set(users.map((user) => user.firstname))]);
    setSuggestionsLastName([...new Set(users.map((user) => user.lastname))]);
    setSuggestionsRole(
      [
        ...new Set(
          users.map((user) =>
            user.role === "a"
              ? "Administrator"
              : user.role === "sa"
              ? "Super Administrator"
              : ""
          )
        ),
      ].filter(Boolean) // Filtruje puste wartości
    );
  }, [users]);

  const [filterFirstName, setFilterFirstName] = useState("");
  const [filterLastName, setFilterLastName] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const filteredUsers = users
    .filter((user) => user.role === "a" || user.role === "sa")
    .filter((user) =>
      filterFirstName
        ? user.firstname.toLowerCase().includes(filterFirstName.toLowerCase())
        : true
    )
    .filter((user) =>
      filterLastName
        ? user.lastname.toLowerCase().includes(filterLastName.toLowerCase())
        : true
    )
    .filter((user) =>
      filterRole
        ? (user.role === "a" && filterRole.toLowerCase() === "administrator") ||
          (user.role === "sa" &&
            filterRole.toLowerCase() === "super administrator")
        : true
    );

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  const [toastRendered, setToastRendered] = useState(false);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const [editingIndex, setEditingIndex] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const handleDoubleClick = (index, field, value) => {
    setEditingIndex(index);
    setEditingField(field);
    setEditingValue(value);
  };

  const handleKeyDown = async (event, userId, field) => {
    if (event.key === "Enter") {
      const userToUpdate = users.find((user) => user.id === userId);
      if (!userToUpdate) return;

      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, { [field]: editingValue });
        setEditingIndex(null);
        setEditingField(null);
        setEditingValue("");
      } catch (error) {
        toast.error("Błąd aktualizacji: ", error.message);
      }
    }
  };

  useEffect(() => {
    if (editingIndex !== null && editingField !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editingIndex, editingField]);

  const handleClickOutside = (event, field) => {
    if (event.target.tagName !== "INPUT" && event.target.tagName !== "SELECT") {
      setEditingIndex(null);
      setEditingField(null);
    }
  };

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [userIndex, setUserIndex] = useState(null);
 
  const handleDelete = (userId) => {
  if (userId === currentUserId) {
    toast.error("Nie możesz usunąć swojego konta.");
    return;
  }

  setUserIndex(userId);
  setModalIsOpen(true);
  };

  const deleteUser = async () => {
    if (!userIndex) return;
    const id = toast.loading("Trwa usuwanie profili administratorów...", {
      autoClose: false,
    });
    try {
      const userRef = doc(db, "users", userIndex);
      await deleteDoc(userRef);

      toast.dismiss(id);
      toast.success("Usuwanie zdającego zakończone z powodzeniem", {
        autoClose: 1000,
      });
      fetchData();
    } catch (error) {
      toast.error("Błąd podczas usuwania zdającego: " + error.message, {
        autoClose: 5000,
      });
    }
  };

  const handleInputChange = async (event, userId, field) => {
    const value = event.target.value;
    setEditingValue(value);

    const userToUpdate = users.find((user) => user.id === userId);
    if (!userToUpdate) return;

    const updatedUsers = users.map((user) =>
      user.id === userId ? { ...user, [field]: value } : user
    );
    setUsers(updatedUsers);

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        [field]: field === "attemptToSolve" ? Number(value) : value,
      });
    } catch (error) {
      toast.error("Błąd aktualizacji: ", error.message);
    }
  };

  const handleSelectBlur = async (index, field) => {
    const userIndex = usersPerPage * (currentPage - 1) + index;
    const value =
      field === "attemptToSolve" ? Number(editingValue) : editingValue;
    try {
      const userRef = doc(db, "users", users[userIndex].id);
      await updateDoc(userRef, { [field]: value });
      if (users[userIndex].attemptToSolve || users[userIndex].quizID) {
        await updateDoc(userRef, {
          attemptToSolve: 0,
          quizResult: 0,
          percentResult: 0,
          examDate: new Date().toLocaleDateString("en-GB").split("/").join("."),
        });
      }
    } catch (error) {
      toast.error("Błąd aktualizacji: ", error.message);
    }

    if (field === "quizID") {
      setEditingIndex(null);
      setEditingField(null);
    }
  };

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

  const [selectedUsers, setSelectedUsers] = useState([]);
  const [lpSortDirection, setLpSortDirection] = useState("asc");
  const [selectAll, setSelectAll] = useState(false);
  const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);

  const deleteSelectedUsers = async () => {
     if (selectedUsers.includes(currentUserId)) {
       toast.error("Nie możesz usunąć swojego konta.");
       return;
     }

     for (const id of selectedUsers) {
       try {
         const userRef = doc(db, "users", id);
         await deleteDoc(userRef);
         toast.success("Usuwanie zakończone pomyślnie", { autoClose: 1000 });
       } catch (error) {
         toast.error("Błąd podczas usuwania: " + error.message, {
           autoClose: 5000,
         });
       }
     }
     fetchData();
     setSelectedUsers([]);
  };

  const [isFiltersVisible, setFiltersVisible] = useState(false);
  const toggleFiltersVisibility = () => {
    setFiltersVisible(!isFiltersVisible);
  };

  return (
    <div className="mt-4">
      <button
        className="btn btn-outline-secondary mb-3"
        onClick={toggleFiltersVisibility}>
        <FontAwesomeIcon icon={faFilter} />{" "}
        {isFiltersVisible
          ? "Ukryj pola wyszukiwania"
          : "Pokaż pola wyszukiwania"}
      </button>
      <Collapse in={isFiltersVisible}>
        <div className="mb-3 container-sm">
          <fieldset className="border p-2 mt-4">
            <legend className="float-none w-auto p-2 fs-6">Filtry</legend>
            <div className="row">
              <div className="col-md-4 mb-3">
                <Autocomplete
                  freeSolo
                  options={suggestionsFirstName}
                  inputValue={filterFirstName}
                  getOptionLabel={(option) => option || ""}
                  onInputChange={(event, newInputValue) => {
                    setFilterFirstName(newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Imię administratora"
                      className="w-100"
                      size="small"
                    />
                  )}
                />
              </div>
              <div className="col-md-4 mb-3">
                <Autocomplete
                  freeSolo
                  options={suggestionsLastName}
                  inputValue={filterLastName}
                  getOptionLabel={(option) => option || ""}
                  onInputChange={(event, newInputValue) => {
                    setFilterLastName(newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Nazwisko administratora"
                      className="w-100"
                      size="small"
                    />
                  )}
                />
              </div>

              <div className="col-md-4 mb-3">
                <Autocomplete
                  freeSolo
                  options={suggestionsRole}
                  getOptionLabel={(option) => option || ""}
                  inputValue={filterRole}
                  onInputChange={(event, newInputValue) => {
                    setFilterRole(newInputValue);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Uprawnienia"
                      className="w-100"
                      size="small"
                    />
                  )}
                />
              </div>
            </div>
          </fieldset>
        </div>
      </Collapse>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectAll}
                onChange={() => {
                  setSelectAll(!selectAll);
                  if (!selectAll) {
                    setSelectedUsers(users.map((user) => user.id));
                  } else {
                    setSelectedUsers([]);
                  }
                }}
              />
            </th>
            <th>lp</th>
            <th onClick={() => handleSort("firstname")}>Imię</th>
            <th onClick={() => handleSort("lastname")}>Nazwisko</th>
            <th onClick={() => handleSort("login")}>Login</th>
            <th onClick={() => handleSort("password")}>Hasło</th>
            <th onClick={() => handleSort("role")}>Uprawnienia</th>
            <th>
              <div style={{ textAlign: "center" }}>
                <FontAwesomeIcon icon="fa-solid fa-trash-can" />
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {currentUsers.map((user, index) => (
            <tr key={index} onClick={() => handleRowClick(user)}>
              <td>
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => {
                    if (selectedUsers.includes(user.id)) {
                      setSelectedUsers(
                        selectedUsers.filter((id) => id !== user.id)
                      );
                    } else {
                      setSelectedUsers([...selectedUsers, user.id]);
                    }
                  }}
                />
              </td>
              <td>
                {lpSortDirection === "asc"
                  ? (currentPage - 1) * usersPerPage + index + 1
                  : filteredUsers.length -
                    ((currentPage - 1) * usersPerPage + index)}
              </td>
              <td
                onClick={() =>
                  handleDoubleClick(index, "firstname", user.firstname)
                }>
                {editingIndex === index && editingField === "firstname" ? (
                  <input
                    className="form-control"
                    type="text"
                    style={{ width: "80%" }}
                    value={editingValue}
                    onKeyDown={(e) => handleKeyDown(e, user.id, "firstname")}
                    onChange={(e) => handleInputChange(e, user.id, "firstname")}
                  />
                ) : (
                  user.firstname
                )}
              </td>
              <td
                onClick={() =>
                  handleDoubleClick(index, "lastname", user.lastname)
                }>
                {editingIndex === index && editingField === "lastname" ? (
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "80%" }}
                    value={editingValue}
                    onKeyDown={(e) => handleKeyDown(e, user.id, "lastname")}
                    onChange={(e) => handleInputChange(e, user.id, "lastname")}
                  />
                ) : (
                  user.lastname
                )}
              </td>
              <td className="text-success font-weight-bold">{user.login}</td>
              <td
                onClick={() =>
                  handleDoubleClick(index, "password", user.password)
                }>
                {editingIndex === index && editingField === "password" ? (
                  <input
                    type="text"
                    className="form-control"
                    style={{ width: "80%" }}
                    value={editingValue}
                    onKeyDown={(e) => handleKeyDown(e, user.id, "password")}
                    onChange={(e) => handleInputChange(e, user.id, "password")}
                  />
                ) : (
                  <span className="text-success font-weight-bold">
                    {user.password}
                  </span>
                )}
              </td>
              <td>
                {editingIndex === index && editingField === "role" ? (
                  <select
                    className="form-select"
                    style={{ width: "100%" }}
                    value={editingValue}
                    onChange={(e) => handleInputChange(e, user.id, "role")}
                    onBlur={() => handleSelectBlur(index, "role")}>
                    <option value="a">Administrator</option>
                    <option value="sa">Super Administrator</option>
                  </select>
                ) : (
                  <span
                    onClick={() => handleDoubleClick(index, "role", user.role)}>
                    {user.role === "a"
                      ? "Administrator"
                      : user.role === "sa"
                      ? "Super Administrator"
                      : ""}
                  </span>
                )}
              </td>
              <td>
                <button
                  className="btn btn-danger"
                  onClick={() => handleDelete(user.id)}
                  disabled={selectedUsers.length > 1}>
                  <FontAwesomeIcon icon="fa-solid fa-trash-can" />
                </button>
                <WindowConfirm
                  isOpen={modalIsOpen}
                  onClose={() => setModalIsOpen(false)}
                  title="Usuwanie administratora"
                  windowText={(() => {
                    const userToDelete = users.find(
                      (user) => user.id === userIndex
                    );
                    return `Czy napewno chcesz usunąć: ${userToDelete?.firstname} ${userToDelete?.lastname}?`;
                  })()}
                  onConfirm={() => {
                    setModalIsOpen(false);
                    deleteUser();
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="btn btn-danger"
        onClick={() => setDeleteModalIsOpen(true)}
        disabled={selectedUsers.length === 0}>
        Usuń zaznaczonych administratorów &nbsp;
        <FontAwesomeIcon icon="fa-solid fa-trash-can" />
      </button>{" "}
      <WindowConfirm
        isOpen={deleteModalIsOpen}
        onClose={() => setDeleteModalIsOpen(false)}
        title="Usuwanie administratora"
        windowText={
          selectedUsers.length === 1
            ? `Czy napewno chcesz usunąć: ${
                users.find((user) => user.id === selectedUsers[0])?.firstname
              } ${
                users.find((user) => user.id === selectedUsers[0])?.lastname
              }?`
            : `Czy napewno chcesz usunąć wszystkich zaznaczonych administratorów?`
        }
        onConfirm={() => {
          setDeleteModalIsOpen(false);
          deleteSelectedUsers();
        }}
      />
      <Pagination
        usersPerPage={usersPerPage}
        totalUsers={filteredUsers.length}
        paginate={paginate}
      />
      <div style={{ height: 50 }}></div>
    </div>
  );
};

export default ShowAdmins;
