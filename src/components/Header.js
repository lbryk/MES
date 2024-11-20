import React, { useContext, useState } from "react";
import logoASE from "../ase_mini.png";
import help1 from "../img/help1.png";
import help2 from "../img/help2.png";
import help3 from "../img/help3.png";
import help4 from "../img/help4.png";
import help5 from "../img/help5.png";
import help6 from "../img/help6.png";
import { Modal, Button } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCircleQuestion, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import AppContext from "./AppContext";
import ExitAlert from "./ExitAlert";
import { useAuth } from "../AuthContext";

library.add(faCircleQuestion);

const Header = () => {
  const { userName } = useContext(AppContext);
  const auth = useAuth(); // Dodajemy auth, aby móc wywołać logout
  const navigate = useNavigate();
  const [showAlert, setShowAlert] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const handleModalOpen = () => {
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const closeAlert = () => {
    setShowAlert(false);
  };

  const handleLogout = () => {
    auth.logout(); // Wyloguj użytkownika
    navigate("/login"); // Przekieruj na stronę logowania
  };

  return (
    <div>
      <div className="row header">
        <div className="col-lg-1 col-md-12">
          <img className="logoCodenight" src={logoASE} />
        </div>
        <div className="col-lg-5 col-md-12 aseHeader">
          Autonomiczny System Egzaminacyjny
        </div>
        <div className="col-3 header-right ">
          <span className="help" onClick={handleModalOpen}>
            <FontAwesomeIcon icon="fa-solid fa-circle-question" />
            <span className="light-green">
              &nbsp;&nbsp;&nbsp;Instrukcja obsługi
            </span>
          </span>
        </div>
        <div className="col-3 loggedInUser">
          <div className="row col-12 usernameDisplay">
            <div className="headerLogin">
              <strong>Zdający:</strong> {userName}
            </div>
          </div>
          <div className="row col-12 logOut" onClick={() => setShowAlert(true)}>
            Wyloguj z systemu
          </div>
          <ExitAlert
            header="Wylogowanie"
            message="Czy na pewno chcesz zakończyć egzamin? Nie będziesz już mógł zmienić odpowiedzi."
            show={showAlert}
            onClose={closeAlert}
            buttons="NoYes"
            handleLogout={handleLogout} // Przekazujemy handleLogout
          />
        </div>
      </div>
      {/* Modal */}
      <Modal
        show={showModal}
        onHide={handleModalClose}
        size="xl"
        aria-labelledby="contained-modal-title-vcenter"
        centered
        style={{ maxHeight: "730px" }}>
        <Modal.Header closeButton>
          <Modal.Title>
            <span>Instrukcja</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body
          style={{
            overflowY: "auto",
            maxHeight: "500px", // Wysokość przewijania treści
          }}>
          <div>
            <div className="alert alert-warning">
              <h4 className="alert-heading">
                Dotyczy państwowego egzaminu zawodowego
              </h4>
              <hr />
              <p>
                Po zalogowaniu się do aplikacji Zdający musi potwierdzić
                zapoznanie się z niniejszą instrukcją przez naciśnięcie
                przycisku <strong>Akceptuje</strong>. Naciśnięcie przycisku{" "}
                <strong>Rezygnacja</strong> spowoduje wylogowanie z aplikacji.
              </p>
              <img
                src={help1}
                alt="Obraz pomocniczy 1"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                  margin: "10px auto",
                }}
              />
              <p>
                Po zaakceptowaniu zobowiązania wyświetla się ekran rozpoczęcia
                egzaminu. Aby rozpocząć egzamin naciska przycisk{" "}
                <strong>Start</strong>.
              </p>
              <img
                src={help2}
                alt="Obraz pomocniczy 2"
                style={{
                  width: "90%",
                  height: "auto",
                  display: "block",
                  margin: "10px auto",
                }}
              />
            </div>
            <p>
              W oknie <strong>Egzamin</strong> – lista zadań Zdający widzi trzy
              sekcje: menu górne, listę zadań w centralnej części ekranu i
              informacje dodatkowe po prawej stronie.
            </p>
            <p>
              W menu górnym Użytkownik ma dostęp do instrukcji obsługi. Aby się
              z nią zapoznać naciska przycisk{" "}
              <strong>Instrukcja obsługi</strong>. Widoczny jest również
              przycisk <strong>Wyloguj z systemu</strong>. Naciśnięcie go będzie
              skutkowało wylogowaniem z systemu i zakończeniem egzaminu.
            </p>
            <p>
              Informacje dodatkowe to: <strong>Kwalifikacja egzaminu</strong>,
              data rozpoczęcia egzaminu (z dokładnością do sekundy), data
              zakończenia egzaminu, Liczba udzielonych odpowiedzi, Liczba
              nieudzielonych odpowiedzi, oraz licznik czasu pozostałego do końca
              egzaminu. Pod tą sekcją znajduje się przycisk
              <strong>Zakończ egzamin</strong>.
            </p>
            <p>
              W centralnej części ekranu znajduje się lista pytań. Aby
              odpowiedzieć na pytanie, Zdający:
            </p>
            <ol>
              <li>
                Naciska w przycisk <strong>Zadanie n</strong> (n jest
                oznaczeniem numeru zadania).
                <img
                  src={help3}
                  alt="Obraz pomocniczy 3"
                  style={{
                    width: "50%",
                    height: "auto",
                    display: "block",
                    margin: "10px auto",
                  }}
                />
              </li>
              <li>Zaznacza jedną z 4 odpowiedzi: A, B, C lub D.</li>
              <li>
                Naciska przycisk <strong>Zapisz odpowiedź</strong>.
                <img
                  src={help4}
                  alt="Obraz pomocniczy 4"
                  style={{
                    width: "30%",
                    height: "auto",
                    display: "block",
                    margin: "10px auto",
                  }}
                />
              </li>
              <li>
                Zaznaczona odpowiedź zostaje zapamiętana. Odpowiedź można
                zmienić w dowolnej chwili w trakcie czasu trwania egzaminu.
              </li>
              <li>
                Po zaznaczeniu odpowiedzi i naciśnięciu przycisku{" "}
                <strong>Anuluj</strong> wprowadzone zmiany zostają porzucone.
                Odpowiedź nie jest zapamiętywana.
                <img
                  src={help5}
                  alt="Obraz pomocniczy 5"
                  style={{
                    width: "70%",
                    height: "auto",
                    display: "block",
                    margin: "10px auto",
                  }}
                />
              </li>
              <li>
                W analogiczny sposób Zdający udziela odpowiedzi na pozostałe
                pytania.
              </li>
              <li>
                Po udzieleniu odpowiedzi na pytania Zdający naciska przycisk
                <strong>Zakończ egzamin</strong>.
                <img
                  src={help6}
                  alt="Obraz pomocniczy 6"
                  style={{
                    width: "30%",
                    height: "auto",
                    display: "block",
                    margin: "10px auto",
                  }}
                />
              </li>
              <li>
                Wyświetlony zostaje komunikat:{" "}
                <em>Czy na pewno chcesz zakończyć egzamin.</em> Nie będziesz się
                już mógł zalogować do systemu i zmienić odpowiedzi. Z
                możliwością wyboru: <strong>Nie, pozostań</strong> oraz{" "}
                <strong>Tak, zakończ</strong>. Po naciśnięciu przycisku{" "}
                <strong>Nie, pozostań</strong>, Użytkownik wróci do okna{" "}
                <strong>Egzamin – lista zadań</strong>. Po naciśnięciu przycisku{" "}
                <strong>Tak, zakończ</strong>, Użytkownik zostaje wylogowany z
                systemu i nie może się ponownie zalogować.
              </li>
            </ol>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="custom-alert-close"
            className="custom-alert-close"
            onClick={handleModalClose}>
            Zamknij <FontAwesomeIcon icon="fa-solid fa-times" />
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Header;
