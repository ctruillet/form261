import React, { useState, useEffect } from "react";
import axios from "axios";
import { DataGrid } from "@mui/x-data-grid";
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

const getDynamicHeaders = (rows, headers) => {
  return headers.filter((header) => {
    const uniqueValues = new Set(rows.map((row) => row[header]));
    return uniqueValues.size > 1; // Garder la colonne seulement si elle a plus d'une valeur unique
  });
};

const Answers = () => {
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await axios.get("/api/data/responses");
        const data = response.data;

        // Aplatir chaque fichier de réponse
        const processedData = data.map((file) => {
          const flatResponses = file.content.map((response) => flattenJSON(response));
          const allHeaders = Array.from(
            new Set(flatResponses.flatMap((res) => Object.keys(res)))
          );

          // Récupérer seulement les colonnes dynamiques
          const dynamicHeaders = getDynamicHeaders(flatResponses, allHeaders);
          console.log(dynamicHeaders);
          return {
            name: file.content[0].name, // Nom du formulaire
            headers: dynamicHeaders, // En-têtes filtrés
            rows: flatResponses, // Réponses aplaties
          };
        });

        setResponses(processedData);
      } catch (error) {
        console.error("Erreur lors de la récupération des réponses :", error);
      }
    };
    fetchResponses();
  }, []);

  return (
    <div className="answers-container">
      <h2>Réponses des formulaires</h2>
      {responses.map((file, fileIndex) => {
        // Préparer les colonnes pour DataGrid
        const columns = file.headers.map((header) => ({
          field: header,
          headerName: header,
          flex: 1, // Ajuste automatiquement la largeur
        }));

        // Préparer les lignes pour DataGrid
        const rows = file.rows.map((row, index) => ({
          id: index, // Requis par DataGrid pour l'identifiant unique
          ...row,
        }));

        return (
          <div key={fileIndex} className="form-table-container">
            <h3>{file.name}</h3>
            <div style={{ height: 500, width: "100%" }}>
              <DataGrid
                rows={rows}
                columns={columns}
                pageSize={5} // Nombre fixe de lignes par page
                // paginationMode="server" // Permet de forcer une pagination stricte
                disableMultipleRowSelection
                autoPageSize
                density="comfortable"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Answers;
