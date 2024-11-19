import React, { useState, useRef } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { toast } from "react-toastify";
import html2canvas from "html2canvas";
import CodeEditor from "./CodeEditor";

const CodeImageCreatorJodit = ({ show, onClose, onSave, editorRef }) => {
  const [language, setLanguage] = useState("html");
  const [code, setCode] = useState("");
  const codeRef = useRef(null);

  const handleSaveImage = async () => {
    try {
      const editorContainer = document.querySelector("#UNIQUE_ID_OF_DIV");
      if (!editorContainer) {
        console.error("Nie znaleziono kontenera edytora.");
        return;
      }

      const aceEditorInstance = editorContainer.env?.editor;
      if (!aceEditorInstance) {
        console.error("Nie znaleziono instancji AceEditor.");
        return;
      }

      const code = aceEditorInstance.getValue();
      const lines = code.split("\n");

      const fontSize = 18;
      const lineHeight = fontSize + 6;
      const padding = 20;
      const lineNumberWidth = 60;

      const tempCanvas = document.createElement("canvas");
      const tempContext = tempCanvas.getContext("2d");
      tempContext.font = `${fontSize}px monospace`;

      let maxWidth = 0;
      lines.forEach((line) => {
        const lineWidth = tempContext.measureText(line).width + lineNumberWidth;
        if (lineWidth > maxWidth) {
          maxWidth = lineWidth;
        }
      });

      const canvasWidth = maxWidth + 2 * padding;
      const canvasHeight = lines.length * lineHeight + 2 * padding;

      const canvas = document.createElement("canvas");
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const context = canvas.getContext("2d");

      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvasWidth, canvasHeight);

      context.font = `${fontSize}px monospace`;

      let y = padding;
      lines.forEach((line, index) => {
        let x = padding;

        const lineNumber = (index + 1).toString().padStart(4, " ");
        context.fillStyle = "#888888";
        context.fillText(`${lineNumber} |`, x, y);
        x += lineNumberWidth;

        const session = aceEditorInstance.getSession();
        const tokens = session.getTokens(index);

        tokens.forEach((token) => {
          const text = token.value;
          const tokenType = token.type;

          console.log(
            `Linia ${index + 1}, Token: "${text}", Typ: "${tokenType}"`
          );

          const color = getTokenColor(tokenType); // Użyj funkcji kolorów
          context.fillStyle = color;
          context.fillText(text, x, y);
          x += context.measureText(text).width;
        });

        y += lineHeight;
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `[${language}]-image-sample-code-${Date.now()}.png`;
      link.click();

      toast.success(
        "Obraz z twojego kodu został wygenerowany pomyślnie.  Użyj narzędzia wstawiania grafiki aby dodać go do edytora."
      );
    } catch (error) {
      toast.error("Wystąpił błąd podczas generowania obrazu z kodu");
    }
  };

  // Funkcja mapująca typ tokenu na kolor
  const getTokenColor = (tokenType) => {
    const colorMapping = {
      keyword: "#0000FF", // Niebieski dla słów kluczowych
      string: "#DD1144", //
      comment: "#808080", // Szary dla komentarzy
      constant: "#B22222", // Czerwony dla stałych
      identifier: "#0086B3", // Czarny dla identyfikatorów
      default: "#000000", // Czarny jako domyślny kolor
      variable: "#0086B3", // Pomarańczowy dla zmiennych
      function: "#0086B3", // Pomarańczowy dla zmiennych
      storage: "#0086B3", // Ciemnoniebieski dla instrukcji (np. print, echo)
      object: "#8B0000", // Bordowy dla obiektów
      identifier: "#000000",
      "keyword.control": "#0086B3", // Ciemnoniebieski dla instrukcji sterujących (np. 'echo', 'print')
      "storage.type": "#0086B3", // Opcjonalne dla typów storage w innych językach
    };

    return colorMapping[tokenType] || colorMapping.default;
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Generetor obrazu z kodu programu</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group controlId="languageSelect">
            <Form.Label>Wybierz język programowania</Form.Label>
            <Form.Control
              as="select"
              value={language}
              style={{ width: "95%" }}
              onChange={(e) => setLanguage(e.target.value)}>
              <option value="html">HTML/XML</option>
              <option value="javascript">JavaScript</option>
              <option value="css">CSS</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c_cpp">C</option>
              <option value="csharp">C#</option>
              <option value="basic">Basic</option>
              <option value="basic">VBA</option>
              <option value="typescript">TypeScript</option>
              <option value="dart">Dart</option>
              <option value="perl">Perl</option>
              <option value="plain_text">Plain Text</option>
            </Form.Control>
          </Form.Group>
          <Form.Group controlId="codeTextarea">
            <Form.Label>Podgląd kodu</Form.Label>
            <div
              style={{
                display: "flex",
                width: "800px",
              }}>
              <div>
                <CodeEditor language={language} code={code} setCode={setCode} />
              </div>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Zrezygnuj
        </Button>
        <Button variant="primary" onClick={handleSaveImage}>
          Zapisz obraz
        </Button>
      </Modal.Footer>
    </Modal>
  );
};


export default CodeImageCreatorJodit;