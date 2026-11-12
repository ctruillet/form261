import React, { useContext } from "react";
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ParticipantContext, ParticipantProvider } from "./context/ParticipantContext";
import Answers from "./pages/Answers";
import Form from "./pages/Form";
import Data from "./pages/Data";
import Nav from "./pages/Nav";
import Session from "./pages/Session";
import CreateForm from "./pages/CreateForm";
import ManageForms from "./pages/ManageForms";
import ProtocolManager from "./pages/ProtocolManager";

import "./App.css";

// Deux modes, déterminés par l'état de la session :
//  - session active  -> mode participant : uniquement le déroulé de la session et les
//    questionnaires, sans menu ni accès aux pages d'administration ;
//  - aucune session  -> mode admin : sessions, questionnaires, protocole, réponses, résultats.
const useSessionActive = () => Boolean(useContext(ParticipantContext).participantData?.UserID);

function Layout({ children }) {
  const location = useLocation();
  const sessionActive = useSessionActive();
  const showMenu = !sessionActive && location.pathname !== "/form";

  return (
    <div className="app-container">
      {showMenu && <Nav />}
      <div className={`main-content ${showMenu ? "" : "main-content-focus"}`}>{children}</div>
    </div>
  );
}

// Page d'administration : inaccessible tant qu'une session est en cours
function AdminOnly({ children }) {
  return useSessionActive() ? <Navigate to="/session" replace /> : children;
}

function App() {
  return (
    <ParticipantProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Communes aux deux modes : démarrer / dérouler une session, remplir un questionnaire */}
            <Route path="/session" element={<Session />} />
            <Route path="/form" element={<Form />} />

            {/* Mode admin */}
            <Route path="/forms" element={<AdminOnly><ManageForms /></AdminOnly>} />
            <Route path="/forms/new" element={<AdminOnly><CreateForm /></AdminOnly>} />
            <Route path="/forms/:id" element={<AdminOnly><CreateForm /></AdminOnly>} />
            <Route path="/protocol" element={<AdminOnly><ProtocolManager /></AdminOnly>} />
            <Route path="/answers" element={<AdminOnly><Answers /></AdminOnly>} />
            <Route path="/results" element={<AdminOnly><Data /></AdminOnly>} />

            <Route path="*" element={<Navigate to="/session" replace />} />
          </Routes>
        </Layout>
      </Router>
    </ParticipantProvider>
  );
}

export default App;
