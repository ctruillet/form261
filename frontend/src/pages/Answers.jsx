import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import "../styles/Answers.css";

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

// Champs à afficher
const parametersField = ["param1", "param2"]; // Remplace par tes champs
const fieldFields = ["field1", "field2"]; // Remplace par tes champs

const getFilteredHeaders = (headers) => {
  // Filtrer les champs en fonction des paramètres définis
  return headers.filter(
    (header) =>
      parametersField.includes(header) || fieldFields.includes(header) || header === "id"
  );
};

const Answers = () => {
  const [responses, setResponses] = useState([]);
  const [selectedRow, setSelectedRow] = useState(null);
  const [speedDialPosition, setSpeedDialPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await axios.get("/api/data/responses");
        const data = response.data;
        

        // Traitement des données
        const processedData = data.map((file) => {
          if(!file.content[0]) return null;
          // Extraire les champs depuis parametersFields et fieldsFields
          const parameterKeys = Object.keys(file.content[0].parametersFields || {});
          const fieldKeys = Object.keys(file.content[0].fieldsFields || {});

          // Inclure aussi "id"
          const requiredHeaders = [...parameterKeys, ...fieldKeys, "id", "fieldsFile", "paramFile"];

          // Aplatir chaque réponse
          const flatResponses = file.content.map((response) => flattenJSON(response));

          // Filtrer les réponses pour n'inclure que les requiredHeaders
          const filteredResponses = flatResponses.map((response) =>
            Object.fromEntries(
              Object.entries(response).filter(([key]) => requiredHeaders.includes(key))
            )
          );

          // Déterminer les colonnes non vides
          const nonEmptyHeaders = requiredHeaders.filter((header) =>
            filteredResponses.some((response) => response[header] !== undefined && response[header] !== "")
          );

          return {
            name: file.content[0].name, // Nom du formulaire
            headers: nonEmptyHeaders, // En-têtes non vides
            rows: filteredResponses, // Réponses filtrées
          };
        });

        setResponses(processedData);
      } catch (error) {
        console.error("Erreur lors de la récupération des réponses :", error);
      }
    };

    fetchResponses();
  }, []);

  const handleEdit = () => {
    if (!selectedRow) {
      console.log("Aucune ligne sélectionnée pour l'édition.");
      return;
    }
  
    navigate(
      `/form?fields=${selectedRow.fieldsFile}&param=${selectedRow.paramFile}&id=${selectedRow.id}`
    );
  
    console.log("Édition de la ligne sélectionnée :", selectedRow);
  };
  

  const handleDelete = () => {
    if (!selectedRow) return;
    alert("Êtes-vous sûr de vouloir supprimer cette ligne ?");

    const DeleteResponse = async () => {
      try {
        await axios.delete(`/api/data/responses/id=${selectedRow.id}`);
        
        // Supprimer la ligne de la liste
        setResponses((prevResponses) => {
          const updatedResponses = prevResponses.map((file) => {
            const updatedRows = file.rows.filter((row) => row.id !== selectedRow.id);
            return { ...file, rows: updatedRows };
          });
          return updatedResponses;
        });
      } catch (error) {
        console.error("Erreur lors de la suppression de la ligne :", error);
      }
    };
    DeleteResponse();

    console.log("Suppression de la ligne sélectionnée :", selectedRow);
  };

  const handleRowClick = (params, event) => {
    setSelectedRow(params.row);
    // Récupère les coordonnées de l'événement pour positionner le SpeedDial
    const rect = event.currentTarget.getBoundingClientRect();
    setSpeedDialPosition({ top: rect.top + window.scrollY - 120, right: rect.right - 60 });
  };

  return (
    <div className="answers-container">
      <h2>Réponses des formulaires</h2>
      {responses.map((file, fileIndex) => {
        const columns = file.headers.map((header) => ({
          field: header,
          headerName: header,
          flex: 1,
        }));

        const rows = file.rows.map((row, index) => ({
          id: row.id || index, // Assigner un ID si inexistant
          ...row,
        }));

        return (
          <div key={fileIndex} className="form-table-container">
            <h3>{file.name}</h3>
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                columnVisibilityModel={{id: false, fieldsFile: false, paramFile: false}}
                rows={rows}
                columns={columns}
                pageSize={5}
                disableMultipleRowSelection
                autoPageSize
                density="comfortable"
                onRowClick={(params, event) => handleRowClick(params, event)}
              />
            </div>
          </div>
        );
      })}
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
    </div>
  );
};

export default Answers;