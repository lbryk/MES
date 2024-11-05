import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase"; // zakładamy, że konfiguracja bazy danych Firebase jest w `firebase.js`
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import Button from "@mui/material/Button";
import SaveIcon from "@mui/icons-material/Save";

const ChangePassword = ({ userName, login }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [originalPassword, setOriginalPassword] = useState("");

  useEffect(() => {
    const fetchPassword = async () => {
      try {
        const userRef = doc(db, "users", `user${login}`);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const fetchedPassword = userDoc.data().password || "";
          setPassword(fetchedPassword);
          setOriginalPassword(fetchedPassword); // Ustawiamy oryginalne hasło
          setIsButtonDisabled(true); // Deaktywujemy przycisk po pobraniu
        } else {
          toast.error("Nie znaleziono użytkownika.");
        }
      } catch (error) {
        toast.error("Błąd podczas pobierania hasła: " + error.message);
      }
    };
    fetchPassword();

    return () => setShowPassword(false);
  }, [login]);

   useEffect(() => {
     setIsButtonDisabled(password === originalPassword);
   }, [password, originalPassword]);

  // Walidacja hasła
  const isPasswordValid = (password) => {
    const hasMinLength = password.length >= 8;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoWhitespace = !/\s/.test(password);

    return hasMinLength && hasNumber && hasSpecialChar && hasNoWhitespace;
  };

  // Obsługa zapisu hasła
  const handleSavePassword = async () => {
    if (!isPasswordValid(password)) {
      toast.error("Hasło nie spełnia wymogów bezpieczeństwa");
      return;
    }

    try {
      const userRef = doc(db, "users", `user${login}`);
      await updateDoc(userRef, { password });
      setOriginalPassword(password); // Aktualizujemy oryginalne hasło po zapisaniu
      setIsButtonDisabled(true); // Deaktywujemy przycisk po zapisaniu
      setShowPassword(false);
      toast.success("Hasło zostało pomyślnie zaktualizowane!");
      return;
    } catch (error) {
      toast.error("Błąd podczas aktualizacji hasła: " + error.message);
      return;
    }
  };

    const toggleShowPassword = () => {
      setShowPassword((prevShowPassword) => !prevShowPassword);
    };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        marginTop: "-70px",
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
          Zmiana hasła administratora
        </h4>
        <div
          style={{
            width: "100%",
            height: "3px",
            backgroundColor: "#3f51b5",
            margin: "0 auto 20px",
            borderRadius: "2px",
          }}></div>
        <div style={{ marginBottom: "15px" }}>
          <label>Imię i nazwisko:</label>
          <div style={{ fontWeight: "bold" }}>{userName}</div>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Login:</label>
          <div style={{ fontWeight: "bold" }}>{login}</div>
        </div>

        <div style={{ marginBottom: "20px", position: "relative" }}>
          <label>Nowe hasło:</label>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}>
            <input
              type={showPassword ? "text" : "password"}
              className="form-control"
              style={{ paddingRight: "2.5rem" }} // Przestrzeń na ikonę
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FontAwesomeIcon
              icon={showPassword ? faEye : faEyeSlash}
              onClick={toggleShowPassword}
              style={{
                position: "absolute",
                right: "10px",
                cursor: "pointer",
                color: "#555",
              }}
            />
          </div>
        </div>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSavePassword}
          style={{ width: "100%", padding: "10px", fontWeight: "bold" }}
          startIcon={<SaveIcon />}
          disabled={isButtonDisabled} // Przycisk jest nieaktywny, gdy hasło jest takie samo
        >
          Zmień hasło
        </Button>
      </div>
    </div>
  );
};

export default ChangePassword;
