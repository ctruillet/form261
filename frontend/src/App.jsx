import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ParticipantProvider } from "./context/ParticipantContext";
import Answers from "./pages/Answers";
import Form from "./pages/Form";
import Home from "./pages/Home";
import Data from "./pages/Data";
import Nav from "./pages/Nav";
import Participant from "./pages/Participant";
import ParticipantAnswers from "./pages/ParticipantAnswers";
import CreateForm from "./pages/CreateForm";
import ManageForms from "./pages/ManageForms";

import "./App.css";

function App() {
  return (
    <ParticipantProvider>
      <Router>
        <div className="app-container">
          <Nav />

          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/form" element={<Form />} />
              <Route path="/participant" element={<Participant />} />
              <Route path="/answers" element={<Answers />} />
              <Route path="/participant-answers" element={<ParticipantAnswers />} />
              <Route path="/data" element={<Data />} />
              <Route path="/create-form" element={<CreateForm />} />
              <Route path="/edit-form/:id" element={<CreateForm />} />
              <Route path="/manage-forms" element={<ManageForms />} />
            </Routes>
          </div>
        </div>
      </Router>
    </ParticipantProvider>
  );
}

export default App;
