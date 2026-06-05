import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';

// Import du contexte du participant
import { ParticipantContext } from "../context/ParticipantContext";

import "../styles/Answers.css";

// Fonction utilitaire pour aplanir le JSON (identique à Answers.jsx)
const flattenJSON = (obj, parentKey = "", res = {}) => {
  for (const key in obj) {
    const propName = parentKey ? `${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
      flattenJSON(obj[key], propName, res);
    } else {
      res[propName] = obj[key];
    }
  }
  return res;
};

const actions = [
  { icon: <EditIcon />, name: "Edit" },
  { icon: <DeleteIcon />, name: "Delete" }
];

const ParticipantAnswers = () => {
  const { participantData } = useContext(ParticipantContext); // Récupération du participant courant
  const [responses, setResponses] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [speedDialPosition, setSpeedDialPosition] = useState({ top: 0, left: 0 });
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si aucun participant n'est défini, on redirige vers la page Participant
    if (!participantData?.UserID) {
      navigate("/participant");
      return;
    }

    const fetchResponses = async () => {
      try {
        const response = await axios.get("/api/data/responses");
        const data = response.data;

        // Traitement et FILTRAGE des données
        const processedData = data.map((file) => {
          if (!file.content || file.content.length === 0) return null;

          // On ne garde que les réponses dont l'UserID correspond au participant enregistré
          const participantContent = file.content.filter(
            (resp) => resp.parametersFields && resp.parametersFields.UserID === participantData.UserID
          );

          // Si ce formulaire n'a aucune réponse pour ce participant, on l'ignore
          if (participantContent.length === 0) return null;

          participantContent.reverse(); // Afficher les réponses les plus récentes en premier

          const parameterKeys = Object.keys(participantContent[0].parametersFields || {});
          const fieldKeys = Object.keys(participantContent[0].fieldsFields || {});
          const requiredHeaders = [...parameterKeys, ...fieldKeys, "id", "fieldsFile", "paramFile"];
          
          const flatResponses = participantContent.map((response) => flattenJSON(response));
          
          const filteredResponses = flatResponses.map((response) =>
            Object.fromEntries(
              Object.entries(response).filter(([key]) => requiredHeaders.includes(key))
            )
          );
          
          const nonEmptyHeaders = requiredHeaders.filter((header) =>
            filteredResponses.some((response) => response[header] !== undefined && response[header] !== "")
          );

          return {
            name: participantContent[0].name || "Formulaire",
            headers: nonEmptyHeaders,
            rows: filteredResponses,
          };
        }).filter(item => item !== null); // On retire les null (les formulaires sans réponse du participant)

        setResponses(processedData);
      } catch (error) {
        console.error("Erreur lors de la récupération des réponses :", error);
      }
    };

    fetchResponses();
  }, [participantData, navigate]);

  // Fonctions de gestion de l'édition et de la suppression (identiques à Answers.jsx)
  const handleEdit = () => {
    if (!selectedRow) return;
    navigate(`/form?fields=${selectedRow.fieldsFile}&param=${selectedRow.paramFile}&id=${selectedRow.id}`);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/api/data/responses/id=${selectedRow.id}`);
      setResponses((prevResponses) => {
        const updatedResponses = prevResponses.map((file) => {
          const updatedRows = file.rows.filter((row) => row.id !== selectedRow.id);
          return { ...file, rows: updatedRows };
        }).filter(file => file.rows.length > 0); // Enlève la table si elle est devenue vide
        
        return updatedResponses;
      });
      setOpenDialog(false);
    } catch (error) {
      console.error("Erreur lors de la suppression de la ligne :", error);
    }
  };

  const handleDelete = () => {
    setOpenDialog(true);
  };

  const handleRowClick = (params, event) => {
    setSelectedRow(params.row);
    const rect = event.currentTarget.getBoundingClientRect();
    setSpeedDialPosition({ top: rect.top + window.scrollY - 120, right: rect.right - 60 });
  };

  return (
    <div className="answers-container">
      <h2>Réponses du Participant : {participantData?.UserID}</h2>
      
      {responses.length === 0 ? (
        <Alert severity="info" sx={{ marginTop: "20px" }}>
          Aucune donnée n'a encore été enregistrée pour le participant {participantData?.UserID}.
        </Alert>
      ) : (
        responses.map((file, fileIndex) => {
          const columns = file.headers.map((header) => ({
            field: header,
            headerName: header,
            flex: 1,
          }));

          const rows = file.rows.map((row, index) => ({
            id: row.id || index,
            ...row,
          }));

          return (
            <div key={fileIndex} className="form-table-container">
              <h3>{file.name}</h3>
              <div style={{ height: 475, width: "100%" }}>
                <DataGrid
                  initialState={{
                    columns: {
                      columnVisibilityModel: {
                        id: false,
                        fieldsFile: false,
                        paramFile: false,
                      },
                    },
                  }}
                  rows={rows}
                  columns={columns}
                  pageSize={1}
                  disableMultipleRowSelection
                  autoPageSize
                  density="comfortable"
                  onRowClick={(params, event) => handleRowClick(params, event)}
                />
              </div>
            </div>
          );
        })
      )}

      {selectedRow && (
        <SpeedDial
          ariaLabel="SpeedDial"
          sx={{
            position: "absolute",
            top: `${speedDialPosition.top}px`,
            left: `${speedDialPosition.right}px`,
          }}
          icon={<SpeedDialIcon />}
        >
          {actions.map((action) => (
            <SpeedDialAction
              key={action.name}
              icon={action.icon}
              tooltipTitle={action.name}
              tooltipOpen
              onClick={() => {
                if (action.name === "Edit") {
                  handleEdit();
                } else if (action.name === "Delete") {
                  handleDelete();
                }
              }}
            />
          ))}
        </SpeedDial>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Êtes-vous sûr de vouloir supprimer cette réponse pour {participantData?.UserID} ?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={confirmDelete} color="error">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ParticipantAnswers;