import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Answers.css"; // Assurez-vous de styliser les blocs via ce fichier CSS

const Answers = () => {
  const [responses, setResponses] = useState([]);
  const [editingResponse, setEditingResponse] = useState(null);
  const [editedData, setEditedData] = useState({});

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

  // Gérer la suppression d'une réponse
  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette réponse ?")) {
      try {
        await axios.delete(`/api/data/responses/${id}`);
        setResponses(responses.filter((response) => response.id !== id));
      } catch (error) {
        console.error("Erreur lors de la suppression de la réponse :", error);
      }
    }
  };

  // Gérer l'édition d'une réponse
  const handleEdit = (response) => {
    setEditingResponse(response.id);
    setEditedData({
      formFields: { ...response.formFields },
      parameters: { ...response.parameters },
    }); // Copier les champs du formulaire et les paramètres
  };

  // Gérer la modification des champs dans une réponse
  const handleChange = (e, category, key) => {
    setEditedData({
      ...editedData,
      [category]: {
        ...editedData[category],
        [key]: e.target.value,
      },
    });
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      const updatedResponse = {
        formFields: editedData.formFields,
        parameters: editedData.parameters,
      };

      await axios.put(`/api/data/responses/${editingResponse}`, updatedResponse);
      setResponses(
        responses.map((r) =>
          r.id === editingResponse ? { ...r, ...updatedResponse } : r
        )
      );
      setEditingResponse(null);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la réponse :", error);
    }
  };

  // Annuler la modification
  const handleCancel = () => {
    setEditingResponse(null);
    setEditedData({});
  };

  return (
    <div className="answers-container">
      <h2>Réponses</h2>
      <div className="responses-list">
        {responses.map((response) => (
          <div key={response.id} className="response-item">
            <div className="response-header">
              <h3>{response.form}</h3>
              <h4>Paramètre : {response.param}</h4>
            </div>
            <div className="response-details">
              {editingResponse === response.id ? (
                <div className="edit-block">
                  {/* Modifier les paramètres */}
                  <div className="parameters-block">
                    {Object.entries(editedData.parameters).map(([key, value]) => (
                      <label key={key}>
                        <strong>{key}</strong>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleChange(e, "parameters", key)}
                          className="input-field"
                        />
                      </label>
                    ))}
                  </div>

                  {/* Modifier les champs du formulaire */}
                  <table className="form-fields-table">
                    <tbody>
                      {Object.entries(editedData.formFields).map(([field, value]) => (
                        <tr key={field}>
                          <td><strong>{field}</strong></td>
                          <td>
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => handleChange(e, "formFields", field)}
                              className="input-field"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button onClick={handleSave} className="save-button">Sauvegarder</button>
                  <button onClick={handleCancel} className="cancel-button">Annuler</button>
                </div>
              ) : (
                <div className="view-block">
                  {/* Affichage des paramètres */}
                  <div className="parameters-block">
                    {Object.entries(response.parameters).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong> {value}
                      </p>
                    ))}
                  </div>

                  {/* Affichage des champs du formulaire */}
                  <table className="form-fields-table">
                    <tbody>
                      {Object.entries(response.formFields).map(([field, value]) => (
                        <tr key={field}>
                          <td><strong>{field}</strong></td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <button onClick={() => handleEdit(response)} className="edit-button">Modifier</button>
                  <button onClick={() => handleDelete(response.id)} className="delete-button">Supprimer</button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Answers;
