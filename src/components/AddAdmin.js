import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import SaveIcon from "@mui/icons-material/Save";

const AddAdmin = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("a");

  // Funkcja do zamiany polskich znaków na odpowiedniki ASCII
  const replacePolishCharacters = (text) => {
    const polishChars = {
      ł: "l",
      Ł: "L",
      ą: "a",
      Ą: "A",
      ś: "s",
      Ś: "S",
      ż: "z",
      Ż: "Z",
      ć: "c",
      Ć: "C",
      ó: "o",
      Ó: "O",
      ń: "n",
      Ń: "N",
      ź: "z",
      Ź: "Z",
      ę: "e",
      Ę: "E",
    };
    return text.replace(
      /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g,
      (match) => polishChars[match] || match
    );
  };

  // Funkcja do generowania loginu
  const generateLogin = (first, last) => {
    if (!first || !last) return "";
    const initialLogin =
      first.charAt(0).toUpperCase() + last.slice(0, 4).toLowerCase();
    return replacePolishCharacters(initialLogin);
  };

  // Funkcja sprawdzająca istnienie użytkownika
  const checkUserExists = async (login) => {
    const userRef = doc(db, "users", `user${login}`);
    const userDoc = await getDoc(userRef);
    return userDoc.exists();
  };

  // Obsługa zmiany pól imienia i nazwiska z sugerowanym loginem
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    setLogin(generateLogin(value, lastName));
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    setLogin(generateLogin(firstName, value));
  };

  // Obsługa zmiany loginu wpisywanego przez użytkownika
  const handleLoginChange = (e) => {
    const value = replacePolishCharacters(e.target.value);
    setLogin(value);
  };

  const handleSave = async () => {
    if (!firstName || !lastName || !login || !password) {
      toast.error("Wszystkie pola są wymagane.");
      return;
    }

    if (login.length < 5) {
      toast.error("Podany login jest za krótki.");
      return;
    }

    const userExists = await checkUserExists(login);
    if (userExists) {
      toast.error("Użytkownik o podanym loginie już istnieje.");
      return;
    }

    try {
      const userRef = doc(db, "users", `user${login}`);
      await setDoc(userRef, {
        firstname: firstName,
        lastname: lastName,
        login: login,
        password: password,
        role: role,
      });
      toast.success("Administrator został pomyślnie dodany!");
      setFirstName("");
      setLastName("");
      setLogin("");
      setPassword("");
      setRole("a");
    } catch (error) {
      toast.error("Błąd podczas dodawania administratora: " + error.message);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}>
      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          borderRadius: "8px",
          maxWidth: "400px",
          width: "100%",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}>
        <h4 style={{ textAlign: "center", marginBottom: "20px" }}>
          Dodaj nowego administratora
        </h4>

        <TextField
          label="Imię"
          value={firstName}
          onChange={handleFirstNameChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Nazwisko"
          value={lastName}
          onChange={handleLastNameChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Login"
          value={login}
          onChange={handleLoginChange}
          fullWidth
          margin="normal"
          required
          helperText="Login musi mieć co najmniej 5 znaków"
          error={login.length > 0 && login.length < 5}
        />
        <TextField
          label="Hasło"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          select
          label="Uprawnienia"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          fullWidth
          margin="normal"
          required>
          <MenuItem value="a">Administrator</MenuItem>
          <MenuItem value="sa">Super Administrator</MenuItem>
        </TextField>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          startIcon={<SaveIcon />}
          fullWidth
          style={{ marginTop: "20px", fontWeight: "bold" }}
          disabled={
            !firstName || !lastName || !login || !password || login.length < 5
          }>
          Zapisz administratora
        </Button>
      </div>
    </div>
  );
};

export default AddAdmin;
