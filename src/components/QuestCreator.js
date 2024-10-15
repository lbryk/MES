import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Editor } from '@tinymce/tinymce-react';
import { doc, setDoc } from 'firebase/firestore';
import db from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAdd } from '@fortawesome/free-solid-svg-icons';
import { library } from '@fortawesome/fontawesome-svg-core';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

library.add(faAdd);
const QuestCreator = ({ examName }) => {
	console.log(examName, '<br />');
	const editorRef = useRef(null);
	const [questNumber, setQuestNumber] = useState('1');
	const [questText, setquestText] = useState('');
	const [ansA, setAnsA] = useState('');
	const [ansB, setAnsB] = useState('');
	const [ansC, setAnsC] = useState('');
	const [ansD, setAnsD] = useState('');

	useEffect(() => {
		if (!questNumber) {
			setQuestNumber(setQuestNumber);
		}
	}, [questNumber]);

	const log = () => {
		if (editorRef.current) {
			console.log(editorRef.current.getContent());
		}
	};

	const handleFormSubmit = async (event) => {
		event.preventDefault();

		if (
			!questText ||
			!ansA ||
			!ansB ||
			!ansC ||
			!ansD ||
			!document.querySelector('input[name="answer"]:checked')
		) {
			toast.error(`Uzupełnij wszystkie pola: pytanie, odpowiedzi oraz zanacz poprawną odpowiedź!`, {
				autoClose: 950,
			});
			return;
		}

		if (questNumber > 40) {
			setQuestNumber(40);
			toast.error(`Maksymalna ilość pytań w arkuszu wynosi 40.`, {
				autoClose: 950,
			});

			document.querySelector('button[name="addQuestbutton1"]').disabled = true;
			document.querySelector('button[name="addQuestbutton2"]').disabled = true;
			// wyszarz przycisk "zapisz"
			//
			return;
		}

		const selectedAnswer = document.querySelector(
			'input[name="answer"]:checked'
		).value;

		const docRef = doc(db, examName, String(questNumber));
		await setDoc(docRef, {
			a: ansA.replace(
				/<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
				''
			),
			b: ansB.replace(
				/<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
				''
			),
			c: ansC.replace(
				/<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
				''
			),
			d: ansD.replace(
				/<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
				''
			),
			question: questText.replace(
				/<p>|<\/p>|<pre>|<\/pre>|<h1>|<\/h1>|<h2>|<\/h2>|<h3>|<\/h3>|<h4>|<\/h4>|<h5>|<\/h5>|<h6>|<\/h6>/g,
				''
			),
			answer: selectedAnswer,
		}).then(() => {
			setQuestNumber((prevQuestNumber) => Number(prevQuestNumber) + 1);
		});
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
      <div className="mt-4">
        <form name="questAdd">
          <div className="pb-3 h4">Pytanie {questNumber}</div>
          {
            <Editor
              apiKey="lkd5bbnbo3yigqxq0v3ofuy58c40gv08t47skq72ni7cz8q5"
              onInit={(evt, editor) => (editorRef.current = editor)}
              initialValue="<p>Tu twórz pytanie.</p>"
              name="questEdit"
              onEditorChange={(content, editor) => {
                setquestText(content);
              }}
              init={{
                selector: "textarea",
                toolbar: "language",
                language: "pl",
                content_langs: [{ title: "Polish", code: "pl" }],
                height: 400,
                menubar: false,
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "help",
                  "wordcount",
                  "codesample",
                  "hilitecolor",
                  "charmap",
                ],
                toolbar:
                  "undo redo blocks | media image link table charmap codesample | " +
                  "bold italic underline forecolor backcolor | alignleft aligncenter " +
                  "alignright alignjustify | bullist numlist outdent indent | " +
                  "removeformat | help",
                content_style:
                  "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
              }}
            />
          }
          <div className="mt-4">
            <strong className="h4">Odpowiedzi</strong>
            <div className="d-flex mt-3">
              <div className="col-1 d-flex justify-content-center">
                <input
                  type="radio"
                  className="form-check-input"
                  name="answer"
                  // value={ansA}
                  value="a"
                />
                &nbsp;
                <strong> A. </strong>
              </div>
              <div className="col-10">
                {
                  <Editor
                    apiKey="lkd5bbnbo3yigqxq0v3ofuy58c40gv08t47skq72ni7cz8q5"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    name="ansA"
                    onEditorChange={(content, editor) => {
                      setAnsA(content);
                    }}
                    init={{
                      selector: "textarea",
                      toolbar: "language",
                      language: "pl",
                      content_langs: [{ title: "Polish", code: "pl" }],
                      height: 200,
                      width: 850,
                      menubar: false,
                      forced_root_block: "",
                      force_br_newlines: true,
                      force_p_newlines: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                        "codesample",
                        "hilitecolor",
                        "charmap",
                      ],
                      toolbar:
                        "undo redo | media image link table charmap codesample | " +
                        "bold italic underline forecolor backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    }}
                  />
                }
              </div>
            </div>
            <div className="d-flex mt-4">
              <div className="col-1 d-flex justify-content-center">
                <input
                  type="radio"
                  className="form-check-input"
                  name="answer"
                  // value={ansB}
                  value="b"
                />
                &nbsp;
                <strong> B. </strong>
              </div>
              <div className="col-10">
                {
                  <Editor
                    apiKey="lkd5bbnbo3yigqxq0v3ofuy58c40gv08t47skq72ni7cz8q5"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    name="ansB"
                    onEditorChange={(content, editor) => {
                      setAnsB(content);
                    }}
                    init={{
                      selector: "textarea",
                      toolbar: "language",
                      language: "pl",
                      content_langs: [{ title: "Polish", code: "pl" }],
                      height: 200,
                      width: 850,
                      menubar: false,
                      forced_root_block: "",
                      force_br_newlines: true,
                      force_p_newlines: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                        "codesample",
                        "hilitecolor",
                        "charmap",
                      ],
                      toolbar:
                        "undo redo | media image link table charmap codesample | " +
                        "bold italic underline forecolor backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    }}
                  />
                }
              </div>
            </div>
            <div className="d-flex mt-4">
              <div className="col-1 d-flex justify-content-center">
                <input
                  type="radio"
                  className="form-check-input"
                  name="answer"
                  // value={ansC}
                  value="c"
                />
                &nbsp;
                <strong> C. </strong>
              </div>
              <div className="col-10">
                {
                  <Editor
                    apiKey="lkd5bbnbo3yigqxq0v3ofuy58c40gv08t47skq72ni7cz8q5"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    name="ansC"
                    onEditorChange={(content, editor) => {
                      setAnsC(content);
                    }}
                    init={{
                      selector: "textarea",
                      toolbar: "language",
                      language: "pl",
                      content_langs: [{ title: "Polish", code: "pl" }],
                      height: 200,
                      width: 850,
                      menubar: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                        "codesample",
                        "hilitecolor",
                        "charmap",
                      ],
                      toolbar:
                        "undo redo | media image link table charmap codesample | " +
                        "bold italic underline forecolor backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    }}
                  />
                }
              </div>
            </div>
            <div className="d-flex mt-4">
              <div className="col-1 d-flex justify-content-center">
                <input
                  type="radio"
                  className="form-check-input"
                  name="answer"
                  // value={ansD}
                  value="d"
                />
                &nbsp;
                <strong> D. </strong>
              </div>
              <div className="col-10">
                {
                  <Editor
                    apiKey="lkd5bbnbo3yigqxq0v3ofuy58c40gv08t47skq72ni7cz8q5"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    name="ansD"
                    onEditorChange={(content, editor) => {
                      setAnsD(content);
                    }}
                    init={{
                      selector: "textarea",
                      toolbar: "language",
                      language: "pl",
                      content_langs: [{ title: "Polish", code: "pl" }],
                      height: 200,
                      width: 850,
                      menubar: false,
                      forced_root_block: "",
                      force_br_newlines: true,
                      force_p_newlines: false,
                      plugins: [
                        "advlist",
                        "autolink",
                        "lists",
                        "link",
                        "image",
                        "charmap",
                        "preview",
                        "anchor",
                        "searchreplace",
                        "visualblocks",
                        "code",
                        "fullscreen",
                        "insertdatetime",
                        "media",
                        "table",
                        "help",
                        "wordcount",
                        "codesample",
                        "hilitecolor",
                        "charmap",
                      ],
                      toolbar:
                        "undo redo | media image link table charmap codesample | " +
                        "bold italic underline forecolor backcolor | alignleft aligncenter " +
                        "alignright alignjustify | bullist numlist outdent indent | " +
                        "removeformat | help",
                      content_style:
                        "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    }}
                  />
                }
              </div>
            </div>
            <div className="d-flex justify-content-end">
              <button
                type="submit"
                onClick={handleFormSubmit}
                className="mt-4 btn btn-success"
                name="addQuestbutton2">
                <FontAwesomeIcon icon={faAdd} />
                &nbsp; Dodaj pytanie
              </button>
            </div>
          </div>
        </form>
        <div style={{ height: 50 }}></div>
      </div>
    </div>
  );
};

export default QuestCreator;
