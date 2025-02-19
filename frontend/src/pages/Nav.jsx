// App.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SendIcon from "@mui/icons-material/Send";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import DownloadIcon from "@mui/icons-material/Download";

import "../App.css"; // Import du fichier CSS

function Nav() {
	const navigate = useNavigate();

	// Fonction pour télécharger le fichier des réponses
	const downloadResponses = () => {
		fetch("/api/data/responses/exportResponsesToExcel", {
			method: "GET",
		})
			.then((response) => {
				if (!response.ok) {
					throw new Error("Erreur lors du téléchargement du fichier");
				}
				return response.blob();
			})
			.then((blob) => {
				const url = window.URL.createObjectURL(blob);

				// Récupérer la date et l'heure actuelles
				const now = new Date();
				const year = now.getFullYear();
				const month = String(now.getMonth() + 1).padStart(2, "0"); // Mois de 0 à 11, donc +1
				const day = String(now.getDate()).padStart(2, "0");
				const hours = String(now.getHours()).padStart(2, "0");
				const minutes = String(now.getMinutes()).padStart(2, "0");

				// Construire le nom du fichier
				const fileName = `exported_responses_${year}_${month}_${day}_${hours}_${minutes}.xlsx`;

				const link = document.createElement("a");
				link.href = url;
				link.setAttribute("download", fileName);
				document.body.appendChild(link);
				link.click();
				link.parentNode.removeChild(link);
			})
			.catch((error) => {
				console.error(error);
				alert("Une erreur est survenue lors du téléchargement.");
			});
	};

	return (
		<List component="nav" className="sidebar">
			<ListItemButton onClick={() => navigate("/")}>
				<ListItemIcon>
					<SendIcon />
				</ListItemIcon>
				<ListItemText primary="Formulaires"/>
			</ListItemButton>

			<ListItemButton onClick={() => navigate("/answers")}>
				<ListItemIcon>
					<QuestionAnswerIcon color="action" />
				</ListItemIcon>
				<ListItemText primary="Réponses" />
			</ListItemButton>

			<ListItemButton onClick={downloadResponses}>
				<ListItemIcon>
					<DownloadIcon color="action" />
				</ListItemIcon>
				<ListItemText primary="Télécharger les réponses" />
			</ListItemButton>
		</List>
	);
}

export default Nav;
