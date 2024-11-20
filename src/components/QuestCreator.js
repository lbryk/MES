import React, { useState, useEffect, useContext, useRef } from "react";
import "bootstrap/dist/js/bootstrap.bundle";
import JoditEditor from "jodit-react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAdd } from "@fortawesome/free-solid-svg-icons";
import { library } from "@fortawesome/fontawesome-svg-core";
import { toast } from "react-toastify";
import AppContext from "./AppContext";
import "react-toastify/dist/ReactToastify.css";
import CodeImageCreatorJodit from "./CodeImageCreatorJodit";

library.add(faAdd);

const QuestCreator = ({ examName }) => {
  const editorRef = useRef(null);
  const { editorApiKey } = useContext(AppContext); // Context placeholder
  const [questNumber, setQuestNumber] = useState("1");
  const [questText, setquestText] = useState("");
  const [answers, setAnswers] = useState({ A: "", B: "", C: "", D: "" });
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const [isEditorVisible, setIsEditorVisible] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editing, setEditing] = useState({ examId: null, questionIndex: null });

  const handleEditorChange = (content, key) => {
    if (key) {
      setAnswers((prev) => {
        const updatedAnswers = { ...prev, [key]: content };
        return updatedAnswers;
      });
    } else {
      setquestText(content);
    }
  };

  const handleInsertImage = (image) => {
    if (editorRef.current && editorRef.current.editor) {
      const editorInstance = editorRef.current.editor;
      editorInstance.selection.insertHTML(
        `<img src="${image}" alt="Code Preview" />`
      );
    } else {
    }
  };

  const renderAnswerOption = (key, label) => (
    <div className="d-flex mt-4" key={key}>
      <div className="col-1 d-flex justify-content-center">
        <input
          type="radio"
          className="form-check-input"
          name="answer"
          value={key}
          checked={selectedAnswer === key}
          onChange={() => setSelectedAnswer(key)}
        />
        &nbsp;
        <strong>{label}</strong>
      </div>
      <div className="col-10">
        <JoditEditor
          value={answers[key]}
          onBlur={(newContent) => {
            setAnswers((prev) => {
              const updatedAnswers = { ...prev, [key]: newContent };
              return updatedAnswers;
            });
          }}
          onEditorChange={(content) => handleEditorChange(content, key)}
          config={{
            readonly: false,
            toolbarSticky: true,
            height: 200,
            toolbarAdaptive: false,
            buttons: [
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
                  const pre = editor.selection.j.createInside.element("pre");
                  pre.style =
                    "background-color:#F0F0F0; text-align:left; padding:10px;";
                  pre.innerHTML = editor.selection.html;
                  editor.selection.insertNode(pre);
                },
              },
              {
                name: "insertCode",
                tooltip: "Generuj obraz z kodu",
                zIndex: 99999, // Główny zIndex dla całego edytora
                iconURL:
                  "https://cdn.icon-icons.com/icons2/561/PNG/512/code-optimization_icon-icons.com_53810.png",
                exec: () => handleOpenModal(),
              },
            ],
            uploader: {
              insertImageAsBase64URI: true,
            },
          }}
        />
      </div>
    </div>
  );

  const handleFormSubmit = async (event) => {
    event.preventDefault();

    if (
      !questText.trim() ||
      !answers.A.trim() ||
      !answers.B.trim() ||
      !answers.C.trim() ||
      !answers.D.trim() ||
      !selectedAnswer
    ) {
      toast.error(
        "Uzupełnij wszystkie pola: pytanie, odpowiedzi oraz zaznacz poprawną odpowiedź!",
        { autoClose: 950 }
      );
      return;
    }

    try {
      const docRef = doc(db, examName, String(questNumber));
      await setDoc(docRef, {
        question: questText,
        a: answers.A,
        b: answers.B,
        c: answers.C,
        d: answers.D,
        answer: selectedAnswer.toLowerCase(),
      });

      setQuestNumber((prev) => Number(prev) + 1);
      toast.success(`Pytanie ${questNumber} - zostało dodane`, {
        autoClose: 150,
      });
    } catch (error) {
      toast.error("Wystąpił błąd podczas zapisywania pytania.", {
        autoClose: 950,
      });
    }
  };

  return (
    <div className="mt-4">
      <div className="line"></div>
      <div className="d-flex justify-content-end">
        <button
          type="submit"
          onClick={handleFormSubmit}
          className="mt-4 btn btn-success"
          name="addQuestbutton1">
          <FontAwesomeIcon icon={faAdd} />
          &nbsp; Dodaj pytanie
        </button>
      </div>
      <div className="pb-3 h4">Pytanie {questNumber}</div>
      <JoditEditor
        ref={editorRef}
        value="questEdit"
        onBlur={(newContent) => {
          setquestText(newContent);
        }}
        onEditorChange={(content) => {
          setquestText(content);
        }}
        config={{
          readonly: false,
          height: 400,
          toolbarSticky: true,
          toolbarAdaptive: false,
          buttons: [
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
                const pre = editor.selection.j.createInside.element("pre");
                pre.style =
                  "background-color:#F0F0F0; text-align:left; padding:10px;";
                pre.innerHTML = editor.selection.html;
                editor.selection.insertNode(pre);
              },
            },
            {
              name: "insertCode",
              tooltip: "Generuj obraz z kodu",
              zIndex: 99999, // Główny zIndex dla całego edytora
              iconURL:
                "https://cdn.icon-icons.com/icons2/561/PNG/512/code-optimization_icon-icons.com_53810.png",
              exec: () => handleOpenModal(),
            },
          ],
          uploader: {
            insertImageAsBase64URI: true,
          },
        }}
      />
      <div className="mt-4">
        <strong className="h4">Odpowiedzi</strong>
        {["A", "B", "C", "D"].map((key) => renderAnswerOption(key, key))}
        <div className="d-flex justify-content-end">
          <button
            type="submit"
            onClick={handleFormSubmit}
            className="mt-4 btn btn-success">
            <FontAwesomeIcon icon={faAdd} />
            &nbsp; Dodaj pytanie
          </button>
        </div>
      </div>
      <CodeImageCreatorJodit
        show={showModal}
        onClose={handleCloseModal}
        onSave={handleInsertImage}
        editorRef={editorRef}
      />
    </div>
  );
};

export default QuestCreator;
