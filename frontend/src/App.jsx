// App.jsx
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { ParticipantProvider } from "./context/ParticipantContext";
import Answers from "./pages/Answers";
import Form from "./pages/Form";
import Home from "./pages/Home";
import Data from "./pages/Data";
import Nav from "./pages/Nav";
import Participant from "./pages/Participant";
import ParticipantAnswers from "./pages/ParticipantAnswers";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Collapse from "@mui/material/Collapse";
import StarBorder from "@mui/icons-material/StarBorder";
import SendIcon from "@mui/icons-material/Send";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import DownloadIcon from "@mui/icons-material/Download";


import "./App.css"; // Import du fichier CSS

function App() {
	return (
		<ParticipantProvider>
			<Router>
				<div className="app-container">
					<Nav />
					{}

					<div className="main-content">
						<Routes>
							<Route path="/" element={<Home />} />
							<Route path="/form" element={<Form />} />
							<Route path="/participant" element={<Participant />} />
							<Route path="/answers" element={<Answers />} />
							<Route path="/participant-answers" element={<ParticipantAnswers />} />
							<Route path="/data" element={<Data />} />
						</Routes>
					</div>
				</div>
			</Router>
		</ParticipantProvider>
	);
}

export default App;
