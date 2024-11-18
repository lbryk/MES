import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-csharp";
import "ace-builds/src-noconflict/mode-html";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-java";
import "ace-builds/src-noconflict/mode-basic";
import "ace-builds/src-noconflict/mode-typescript";
import "ace-builds/src-noconflict/mode-dart";
import "ace-builds/src-noconflict/mode-perl";
import "ace-builds/src-noconflict/mode-plain_text";
import "ace-builds/src-noconflict/mode-css";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

const CodeEditor = ({ language, code, setCode }) => {
  const onChange = (newValue) => {
    setCode(newValue);
  };

  return (
    <AceEditor
      mode={language.toLowerCase()}
      theme="github"
      onChange={onChange}
      name="UNIQUE_ID_OF_DIV"
      editorProps={{ $blockScrolling: true }}
      value={code}
      width="750px" // Ustaw szerokość explicite

      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
        fontSize: "18px",
        useWorker: false,
      }}
    />
  );
};

export default CodeEditor;
