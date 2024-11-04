import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Answers.css"; // Assurez-vous d'ajouter du style pour les boîtes

const Answers = () => {
  const [responses, setResponses] = useState([]);

  // Charger les réponses au montage du composant
  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const response = await axios.get("/api/data/responses");
        setResponses(response.data);
      } catch (error) {
        console.error("Erreur lors de la récupération des réponses :", error);
      }
    };
    fetchResponses();
  }, []);

  return (
    <div className="answers-container">
      {responses.map((responseFile, index) => (
        <div key={index} className="form-response-box">
          <h3>Formulaire : {responseFile.file}</h3>
          <pre className="response-content">
            {JSON.stringify(responseFile.content, null, 2)}
          </pre>
        </div>
      ))}
    </div>
  );
};

export default Answers;
