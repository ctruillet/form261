import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { ParticipantContext } from '../context/ParticipantContext';

// Import des composants de champs (les mêmes que dans Form.jsx)
import TextInputField from "../components/fields/TextInputField";
import MultipleChoiceField from "../components/fields/MultipleChoiceField";
import ChoiceField from "../components/fields/ChoiceField";
import RangeField from "../components/fields/RangeField";

// Import du style pour garder la cohérence visuelle
import "../styles/Form.css";

function Participant() {
    const { participantData, updateParticipant, clearParticipant } = useContext(ParticipantContext);
    
    const [parameterFields, setParameterFields] = useState([]);
    const [formData, setFormData] = useState(participantData || {});
    const [errors, setErrors] = useState({});
    
    // Par défaut, on charge UserID_Block.json, mais on peut le changer dynamiquement
    const [selectedParamFile, setSelectedParamFile] = useState("UserID_Block.json");
    const [paramFilesList, setParamFilesList] = useState([]);

    // 1. Récupérer la liste de tous les paramètres disponibles dans le backend
    useEffect(() => {
        const fetchParametersList = async () => {
            try {
                const response = await axios.get("/api/parameters");
                setParamFilesList(response.data);
            } catch (error) {
                console.error("Erreur lors de la récupération de la liste des paramètres :", error);
            }
        };
        fetchParametersList();
    }, []);

    // 2. Charger le fichier JSON spécifique sélectionné (ex: UserID_Block.json)
    useEffect(() => {
        const fetchParameterFields = async () => {
            if (!selectedParamFile) return;
            try {
                const response = await axios.get(`/api/parameters/${selectedParamFile}`);
                setParameterFields(response.data.fields || []);

                // Pré-remplir avec les données du contexte si elles existent déjà
                const initialFormData = {};
                if (response.data.fields) {
                    response.data.fields.forEach((field) => {
                        initialFormData[field.label] = participantData[field.label] || "";
                    });
                }
                setFormData(prev => ({ ...prev, ...initialFormData }));
            } catch (error) {
                console.error("Erreur lors de la récupération des champs du paramètre :", error);
            }
        };
        fetchParameterFields();
    }, [selectedParamFile, participantData]);

    // Gérer la modification des champs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({
            ...prev,
            [name]: value !== "" ? "" : `${name} est requis`
        }));
    };

    // Gérer la sauvegarde dans le contexte global
    const handleSave = (e) => {
        e.preventDefault();
        
        let isValid = true;
        let newErrors = {};

        // Validation basique
        parameterFields.forEach((field) => {
            if (field.required && !formData[field.label]) {
                newErrors[field.label] = `${field.label} est requis`;
                isValid = false;
            }
        });

        setErrors(newErrors);

        if (isValid) {
            updateParticipant(formData);
            alert("Les informations du participant ont été sauvegardées avec succès !");
        } else {
            alert("Veuillez remplir tous les champs requis.");
        }
    };

    // Fonction de rendu dynamique calquée sur Form.jsx
    const renderField = (field) => {
        return (
            <div className={`field-block ${errors[field.label] ? "error" : ""}`} key={field.label}>
                {field.type === "text" && (
                    <TextInputField
                        label={field.label}
                        sublabel={field.sublabel}
                        value={formData[field.label] || ""}
                        errors={errors}
                        onChange={handleChange}
                        required={field.required}
                    />
                )}

                {/* "drop-down" correspond à MultipleChoiceField dans Form.jsx */}
                {field.type === "drop-down" && (
                    <MultipleChoiceField
                        label={field.label}
                        sublabel={field.sublabel}
                        value={formData[field.label] || ""}
                        errors={errors}
                        onChange={handleChange}
                        options={field.options || []}
                        required={field.required}
                    />
                )}

                {field.type === "choice" && (
                    <ChoiceField
                        label={field.label}
                        value={formData[field.label] || ""}
                        onChange={handleChange}
                        options={field.options || []}
                        required={field.required}
                    />
                )}
                
                {field.type === "range" && (
                    <RangeField
                        label={field.label}
                        sublabel={field.sublabel}
                        value={formData[field.label] || ""}
                        errors={errors}
                        min={field.min}
                        max={field.max}
                        labelMin={field.labelMin}
                        labelMax={field.labelMax}
                        onChange={handleChange}
                        required={field.required}
                    />
                )}
            </div>
        );
    };

    return (
        <div className="fields-page" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h1>Configuration du Participant</h1>
            <p>Ces données seront utilisées par défaut dans les prochains formulaires.</p>

            {/* Menu déroulant pour choisir quel formulaire de paramètre utiliser */}
            <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f5f5f5", borderRadius: "8px" }}>
                <label style={{ fontWeight: "bold", marginRight: "10px" }}>Sélectionner la structure des paramètres :</label>
                <select 
                    value={selectedParamFile} 
                    onChange={(e) => setSelectedParamFile(e.target.value)}
                    style={{ padding: "5px" }}
                >
                    {paramFilesList.map((param, index) => (
                        <option key={index} value={param.file}>{param.title || param.file}</option>
                    ))}
                </select>
            </div>

            <div className="fields-container">
                <form onSubmit={handleSave}>
                    {/* Génération dynamique des champs */}
                    {parameterFields.map(renderField)}
                    
                    <button type="submit" style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Enregistrer dans la session
                    </button>
                </form>
            </div>

            <button 
                onClick={clearParticipant} 
                style={{ padding: '10px 20px', marginTop: '40px', cursor: 'pointer', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px' }}
            >
                Effacer les données en cours (Nouveau Participant)
            </button>
        </div>
    );
}

export default Participant;