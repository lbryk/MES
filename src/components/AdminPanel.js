import React, { useState, useEffect, useContext, useCallback } from "react";
import logoASE from "../ase_mini.png";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faClosedCaptioning,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import "bootstrap/dist/js/bootstrap.bundle";
import ExamCreator from "./ExamCreator";
import ExamTable from "./ExamTable";
import Footer from "./Footer";
import ShowUser from "./ShowUser";
import ExamList from "./EgzamList";
import RaportExam from "./RaportExam";
import AdminHeader from "./AdminHeader";
import AppContext from "./AppContext";
import LiveUser from "./LiveUser";
import ShowAdmins from "./ShowAdmins";
import AddAdmin from "./AddAdmin";
import ChangePassword from "./ChangePassword";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { collection, getDocs } from "firebase/firestore";
import { db, remoteConfig } from "../firebase";
import {
  getRemoteConfig,
  fetchAndActivate,
  getValue,
} from "firebase/remote-config";
import { faClose, faDownload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

library.add(faClose, faDownload);

const AdminPanel = () => {
  const currentVersion = "3.11.04"; // wersja aplikacji
  const checkLogin = useNavigate();
  const { userRole, setUserRole } = useContext(AppContext);
  const [quizCodesData, setQuizCodesData] = useState({});
  const { userName, setUserName } = useContext(AppContext);
  const { login, setLogin } = useContext(AppContext);
  const [refreshExams, setRefreshExams] = useState(0);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  if (userName === "") {
    checkLogin(`/login`);
  }

  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        await fetchAndActivate(remoteConfig);
        const latestVersion = getValue(
          remoteConfig,
          "latest_version"
        ).asString();

        console.log(`wersja aplikacji ${latestVersion}`);
        if (currentVersion !== latestVersion) {
          setShowUpdateModal(true);
        }
      } catch (error) {
        console.error("Błąd podczas sprawdzania aktualizacji:", error);
      }
    };
    checkForUpdates();
  }, []);

  useEffect(() => {
    const fetchQuizCodes = async () => {
      const querySnapshot = await getDocs(collection(db, "quizCode"));
      const codesData = {};
      querySnapshot.docs.forEach((doc) => {
        codesData[doc.id] = doc.data();
      });
      setQuizCodesData(codesData);
    };
    fetchQuizCodes();
  }, []);

  const [professionsData, setProfessionsData] = useState({});

  useEffect(() => {
    const fetchProfessions = async () => {
      const querySnapshot = await getDocs(collection(db, "professions"));
      const professions = {};
      querySnapshot.docs.forEach((doc) => {
        professions[doc.id] = doc.data();
      });
      setProfessionsData(professions);
    };
    fetchProfessions();
  }, []);

  const [qualificationNameData, setQualificationNameData] = useState({});

  useEffect(() => {
    const fetchqualificationNameData = async () => {
      const querySnapshot = await getDocs(collection(db, "qualificationName"));
      const qualificationName = {};
      querySnapshot.docs.forEach((doc) => {
        qualificationName[doc.id] = doc.data();
      });
      setQualificationNameData(qualificationName);
    };
    fetchqualificationNameData();
  }, []);

  const handleRefreshExams = useCallback(() => {
    setRefreshExams((prev) => prev + 1);
  }, []);

  return (
    <div>
      <AdminHeader />
      <div className="container">
        <div
          className={`modal ${showUpdateModal ? "show" : ""}`}
          tabIndex="-1"
          style={{ display: showUpdateModal ? "block" : "none" }}
          aria-hidden={!showUpdateModal}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <img className="logoCodenight" src={logoASE} /> MES -
                  Aktualizacja dostępna
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowUpdateModal(false)}
                  aria-label="Zamknij"></button>
              </div>
              <div className="modal-body">
                <p>
                  Nowa wersja aplikacji jest dostępna! <br /> Proszę
                  zaktualizować, aby korzystać z najnowszych funkcji.
                </p>
              </div>
              <div className="modal-footer">
                <a
                  href="https://github.com/lbryk/MES-app.git"
                  className="btn btn-warning"
                  target="_blank"
                  rel="noopener noreferrer">
                  <FontAwesomeIcon icon="fa-solid fa-download" /> {}
                  Pobierz
                </a>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowUpdateModal(false)}>
                  Zamknij {}
                  <FontAwesomeIcon icon="fa-solid fa-close" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <nav className="mt-4">
          <div className="nav nav-tabs" id="nav-tab" role="tablist">
            <button
              className="nav-link active"
              id="nav-users-tab"
              data-bs-toggle="tab"
              data-bs-target="#users"
              type="button"
              role="tab"
              aria-controls="users"
              aria-selected="true">
              Lista zdających
            </button>
            <button
              className="nav-link"
              id="nav-live-users-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-live-users"
              type="button"
              role="tab"
              aria-controls="nav-live-users"
              aria-selected="false">
              Podgląd zdających na żywo
            </button>
            <button
              className="nav-link"
              id="nav-exam-list-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-exam-list"
              type="button"
              role="tab"
              aria-controls="nav-exam-list"
              aria-selected="false">
              Lista egzaminów
            </button>
            <button
              className="nav-link"
              id="nav-raports-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-raports"
              type="button"
              role="tab"
              aria-controls="nav-raports"
              aria-selected="false">
              Raporty
            </button>
            <button
              className="nav-link"
              id="nav-exam-maker-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-exam-maker"
              type="button"
              role="tab"
              aria-controls="nav-exam-maker"
              aria-selected="false">
              Kreator egzaminów
            </button>
            <button
              className="nav-link"
              id="nav-change-password-tab"
              data-bs-toggle="tab"
              data-bs-target="#nav-change-password"
              type="button"
              role="tab"
              aria-controls="nav-change-password"
              aria-selected="false">
              Zmiana hasła
            </button>
            {userRole === "sa" && (
              <button
                className="nav-link"
                id="nav-settings-tab"
                data-bs-toggle="tab"
                data-bs-target="#nav-settings"
                type="button"
                role="tab"
                aria-controls="nav-settings"
                aria-selected="false">
                Ustawienia oprogramowania
              </button>
            )}
          </div>
        </nav>
        <div className="tab-content" id="nav-tabContent">
          <div
            className="tab-pane fade show active"
            id="users"
            role="tabpanel"
            aria-labelledby="nav-users-tab"
            tabindex="0">
            <ShowUser refreshKey={refreshExams} />
          </div>
          <div
            className="tab-pane fade"
            id="nav-live-users"
            role="tabpanel"
            aria-labelledby="nav-live-users-tab"
            tabindex="0">
            <LiveUser />
          </div>
          <div
            className="tab-pane fade"
            id="nav-exam-list"
            role="tabpanel"
            aria-labelledby="nav-exam-list-tab"
            tabindex="0">
            <ExamList />
          </div>
          <div
            className="tab-pane fade"
            id="nav-raports"
            role="tabpanel"
            aria-labelledby="nav-raports-tab"
            tabindex="0">
            <RaportExam
              quizCodesData={quizCodesData}
              professionsData={professionsData}
            />
          </div>
          <div
            className="tab-pane fade"
            id="nav-exam-maker"
            role="tabpanel"
            aria-labelledby="nav-exam-maker-tab"
            tabindex="0">
            <div className="mt-4">
              <ul className="nav nav-pills mb-3" id="pills-tab" role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link active"
                    id="pills-home-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#pills-home"
                    type="button"
                    role="tab"
                    aria-controls="pills-home"
                    aria-selected="true">
                    Twórz nowy egzamin
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="edit-exam-tab"
                    data-bs-toggle="pill"
                    data-bs-target="#edit-exam"
                    type="button"
                    role="tab"
                    aria-controls="edit-exam"
                    aria-selected="false">
                    Edytuj istniejący egzamin
                  </button>
                </li>
              </ul>
              <div className="tab-content" id="pills-tabContent">
                <div
                  className="tab-pane fade show active"
                  id="pills-home"
                  role="tabpanel"
                  aria-labelledby="pills-home-tab">
                  <ExamCreator
                    quizCodesData={quizCodesData}
                    professionsData={professionsData}
                    qualificationName={qualificationNameData}
                    onExamCreated={handleRefreshExams}
                  />
                </div>
                <div
                  className="tab-pane fade"
                  id="edit-exam"
                  role="tabpanel"
                  aria-labelledby="edit-exam-tab">
                  <ExamTable
                    onExamCreated={handleRefreshExams}
                    refreshKey={refreshExams}
                  />
                </div>
              </div>
            </div>
          </div>
          <div
            className="tab-pane fade"
            id="nav-change-password"
            role="tabpanel"
            aria-labelledby="nav-change-password-tab"
            tabIndex="0">
            <ChangePassword userName={userName} login={login} />
          </div>
          <div
            className="tab-pane fade"
            id="nav-settings"
            role="tabpanel"
            aria-labelledby="nav-settings-tab"
            tabindex="0">
            <div className="mt-4">
              <ul
                className="nav nav-pills mb-3"
                id="settings-tab"
                role="tablist">
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link active" // Ustaw active tutaj
                    id="admin-btn"
                    data-bs-toggle="pill"
                    data-bs-target="#admin-tab"
                    type="button"
                    role="tab"
                    aria-controls="admin-tab"
                    aria-selected="true">
                    Administratorzy
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="create-admin-btn"
                    data-bs-toggle="pill"
                    data-bs-target="#create-admin-tab"
                    type="button"
                    role="tab"
                    aria-controls="create-admin-tab"
                    aria-selected="false">
                    Twórz nowego administratora
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="qualifications-btn"
                    data-bs-toggle="pill"
                    data-bs-target="#qualifications-tab"
                    type="button"
                    role="tab"
                    aria-controls="qualifications-tab"
                    aria-selected="false">
                    Kwalifikacje
                  </button>
                </li>

                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="admin-panel-settings-btn"
                    data-bs-toggle="pill"
                    data-bs-target="#admin-panel-settings-tab"
                    type="button"
                    role="tab"
                    aria-controls="admin-panel-settings-tab"
                    aria-selected="false">
                    Ustawienia panelu administracyjnego
                  </button>
                </li>
              </ul>
              <div className="tab-content " id="nav-tabContent">
                <div
                  className="tab-pane fade show active" // Ustaw show active tutaj
                  id="admin-tab"
                  role="tabpanel"
                  aria-labelledby="admin-btn"
                  tabIndex="0">
                  <ShowAdmins currentUserId={`user${login}`} />{" "}
                </div>
              </div>
              <div className="tab-content " id="nav-tabContent">
                <div
                  className="tab-pane fade"
                  id="create-admin-tab"
                  role="tabpanel"
                  aria-labelledby="create-admin-btn"
                  tabIndex="0">
                  <AddAdmin />
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </div>
      <Footer version={currentVersion} />
    </div>
  );
};

export default AdminPanel;
