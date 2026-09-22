import React, { useState, useEffect } from "react";
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
import CircularProgress from '@mui/material/CircularProgress';

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

const Answers = () => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRow, setSelectedRow] = useState(null);
  const [speedDialPosition, setSpeedDialPosition] = useState({ top: 0, left: 0 });
  const [openDialog, setOpenDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await axios.get("/api/data/responses");
        const data = response.data || [];

        // Traitement des données
        const processedData = data.map((file) => {
          if (!file || !Array.isArray(file.content) || file.content.length === 0) return null;

          const reversedContent = [...file.content].reverse(); // Afficher les réponses les plus récentes en premier

          const parameterKeys = Object.keys(reversedContent[0].parametersFields || {});
          const fieldKeys = Object.keys(reversedContent[0].fieldsFields || {});
          const requiredHeaders = [...parameterKeys, ...fieldKeys, "id", "fieldsFile", "paramFile"];
          const flatResponses = reversedContent.map((resp) => flattenJSON(resp));
          const filteredResponses = flatResponses.map((resp) =>
            Object.fromEntries(
              Object.entries(resp).filter(([key]) => requiredHeaders.includes(key))
            )
          );
          const nonEmptyHeaders = requiredHeaders.filter((header) =>
            filteredResponses.some((resp) => resp[header] !== undefined && resp[header] !== "")
          );

          return {
            name: reversedContent[0].name || file.file,
            headers: nonEmptyHeaders,
            rows: filteredResponses,
          };
        });

        const validData = processedData.filter((file) => file !== null);
        setResponses(validData);
      } catch (error) {
        console.error("Erreur lors de la récupération des réponses :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, []);

  const handleEdit = () => {
    if (!selectedRow) return;

    navigate(
      `/form?fields=${selectedRow.fieldsFile}&param=${selectedRow.paramFile}&id=${selectedRow.id}`
    );
  };

  const confirmDelete = async () => {
    if (!selectedRow) return;
    try {
      await axios.delete(`/api/data/responses/id=${selectedRow.id}`);
      setResponses((prevResponses) => {
        return prevResponses
          .map((file) => {
            if (!file) return null;
            const updatedRows = file.rows.filter((row) => row.id !== selectedRow.id);
            return { ...file, rows: updatedRows };
          })
          .filter((file) => file && file.rows.length > 0);
      });
      setOpenDialog(false);
      setSelectedRow(null);
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
    setSpeedDialPosition({
      top: Math.max(10, rect.top + window.scrollY - 80),
      left: Math.max(10, rect.right - 60),
    });
  };

  return (
    <div className="answers-container">
      <h2>Réponses des formulaires</h2>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '40px' }}>
          <CircularProgress />
        </div>
      ) : !responses || responses.length === 0 ? (
        <Alert severity="info" sx={{ marginTop: "20px" }}>
          Aucune donnée n&apos;a encore été enregistrée.
        </Alert>
      ) : (
        responses.map((file, fileIndex) => {
          if (!file) return null;

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
                  pageSize={5}
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
            left: `${speedDialPosition.left}px`,
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
            Êtes-vous sûr de vouloir supprimer cette réponse ?
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

export default Answers;
