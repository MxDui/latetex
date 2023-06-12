import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Transition } from "@headlessui/react";
import AceEditor from "react-ace";
import { Document, Page, pdfjs } from "react-pdf";
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

import "ace-builds/src-noconflict/theme-monokai";
import "ace-builds/src-noconflict/mode-latex";
import TreeFile from "./components/Files/FileTree";
import Navbar from "./components/Navbar/Navbar";

function App() {
  const [greetMsg, setGreetMsg] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [latexCode, setLatexCode] = useState<string>("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [compileTimeout, setCompileTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  async function compile() {
    const response2: string = await invoke("compile", { code: latexCode });
    const uint8Array: Uint8Array = base64ToUint8Array(response2);
    const blob: Blob = new Blob([uint8Array], { type: "application/pdf" });
    const url: string = URL.createObjectURL(blob);
    setPdfUrl(url);
  }

  function base64ToUint8Array(base64: string): Uint8Array {
    const binary_string: string = window.atob(base64);
    const len: number = binary_string.length;
    const bytes: Uint8Array = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }
  function debounce(func: (...args: any[]) => any, wait: number) {
    let timeout: NodeJS.Timeout;

    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };

      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  useEffect(() => {
    if (latexCode !== "" && compileTimeout === null) {
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        compile();
        setCompileTimeout(null);
      }, 500);

      setCompileTimeout(timeoutId);
    }
    return () => clearTimeout(compileTimeout!);
  }, [latexCode]);

  const debouncedCompile = debounce(compile, 500);

  const handleLatexCodeChange = (code: string) => {
    setLatexCode(code);
    debouncedCompile();
  };

  return (
    <>
      <Navbar
        fileName={name}
        handleNewFile={() => {}}
        handleSaveFile={() => {}}
      />
      <div className=" min-h-screen bg-gray-100 w-full grid grid-cols-[1fr,2fr,1fr] ">
        <TreeFile />
        <Transition
          show={isOpen}
          enter="transition-all duration-500"
          enterFrom="opacity-0 transform translate-x-[-100%]"
          enterTo="opacity-100 transform translate-x-0"
          leave="transition-all duration-500"
          leaveFrom="opacity-100 transform translate-x-0"
          leaveTo="opacity-0 transform translate-x-[-100%]"
        >
          <div className=" h-full bg-gray-100 ">
            <AceEditor
              width="100%"
              height="100%"
              mode="latex"
              theme="monokai"
              onChange={handleLatexCodeChange}
              name="UNIQUE_ID_OF_DIV"
              editorProps={{ $blockScrolling: true }}
              value={latexCode}
              className="w-full h-full"
            />
          </div>
          <button onClick={() => compile()} className="bg-blue-500 p-2">
            Compile
          </button>
        </Transition>
        <div className="h-full bg-gray-100">
          <div className="flex flex-col justify-center items-center h-full">
            {pdfUrl && (
              <Document
                file={pdfUrl}
                onError={(err) => console.log(err)}
                onLoadError={(err) => console.log(err)}
              >
                <Page pageNumber={1} />
              </Document>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default App;
