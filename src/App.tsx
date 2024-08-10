import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

import { Command } from "@tauri-apps/plugin-shell";
function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    let result = await Command.create("ollama-server", [
      "-c",
      "OLLAMA_ORIGINS=* OLLAMA_HOST=127.0.0.1:11435 ollama serve",
    ]).execute();
    console.log(result);
  }

  return (
    <div className="container">
      <h1>Welcome to Tauri!</h1>

      <button onClick={greet}>test</button>
    </div>
  );
}

export default App;
