import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import { SessionProvider } from "./context/SessionContext";
import { ProgressProvider } from "./context/ProgressContext";
import { HintProvider } from "./context/HintContext";
import OpeningScene from "./screens/OpeningScene";
import Corkboard from "./screens/Corkboard";
import InterviewRoom from "./screens/InterviewRoom";
import EvidenceBoard from "./screens/EvidenceBoard";
import Accusation from "./screens/Accusation";
import CharacterDossier from "./screens/CharacterDossier";
import { useEffect } from "react";
import { ambientLoop } from "./audio/sounds";

function AudioBoot() {
  useEffect(() => {
    const startAudio = async () => {
      try {
        if (!ambientLoop.playing()) {
          ambientLoop.play();
        }
      } catch {
      }

      window.removeEventListener("click", startAudio);
      window.removeEventListener("keydown", startAudio);
    };

    window.addEventListener("click", startAudio);
    window.addEventListener("keydown", startAudio);

    return () => {
      window.removeEventListener("click", startAudio);
      window.removeEventListener("keydown", startAudio);
    };
  }, []);

  return null;
}

function App() {
  return (
    <SessionProvider>
      <ProgressProvider>
        <HintProvider>
          <AudioBoot />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<OpeningScene />} />
              <Route path="/board" element={<Corkboard />} />
              <Route path="/interview/:characterId" element={<InterviewRoom />} />
              <Route path="/evidence" element={<EvidenceBoard />} />
              <Route path="/accuse" element={<Accusation />} />
              <Route path="/dossier" element={<CharacterDossier />} />
            </Routes>
          </BrowserRouter>
        </HintProvider>
      </ProgressProvider>
    </SessionProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);