import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import "../styles/Data.css";

// Fonction pour générer une couleur aléatoire basée sur une clé unique (ici les paramètres)
const generateColor = (key) => {
  const hash = key.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const r = (hash % 255);
  const g = ((hash * 3) % 255);
  const b = ((hash * 7) % 255);
  return `rgb(${r}, ${g}, ${b})`;
};

const Data = () => {
  const [responses, setResponses] = useState([]);
  const [averagesData, setAveragesData] = useState({});
  const [activeIndices, setActiveIndices] = useState({}); // Pour stocker les indices actifs pour chaque facteur

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

  // Fonction pour regrouper les données par formulaire et fichier de paramètre
  const groupDataByFormAndParam = () => {
    const groupedData = {};
    responses.forEach((res) => {
      const key = `${res.form}-${res.param}`;
      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(res);
    });

    // Calculer les moyennes pour chaque paramètre (excluant UserID) et chaque facteur
    const averages = Object.entries(groupedData).reduce((acc, [key, data]) => {
      const groupedByParams = groupDataByParams(data);
      const factors = Object.keys(data[0].formFields);

      const displayData = Object.entries(groupedByParams).map(([paramKey, paramData]) => {
        // Combine the parameter names (e.g., "Technique_Surface")
        const combinedParamName = paramKey; // paramKey already contains combined parameters (as JSON string)
        return factors.map(factor => ({
          name: combinedParamName, // Utiliser la combinaison des paramètres pour le nom de la barre
          factor,
          ...calculateAverageForFactor(paramData, factor),
          colorKey: paramKey // Utiliser cette clé pour déterminer la couleur
        }));
      }).flat();

      acc[key] = displayData;
      return acc;
    }, {});
    setAveragesData(averages);
  };

  // Fonction pour regrouper les réponses par paramètres (Technique, Surface, etc.)
  const groupDataByParams = (data) => {
    const groupedByParams = {};
    data.forEach((res) => {
      const { UserID, ...params } = res.parameters; // Exclure UserID
      const key = Object.values(params).join('_'); // Utiliser la combinaison des paramètres comme clé unique
      if (!groupedByParams[key]) groupedByParams[key] = [];
      groupedByParams[key].push(res);
    });
    return groupedByParams;
  };

  // Fonction pour calculer la moyenne d'un facteur pour chaque groupe de paramètres
  const calculateAverageForFactor = (data, factor) => {
    const total = data.length;
    let sum = 0;
    let sumSquared = 0;
    const values = [];

    data.forEach((res) => {
      const value = parseFloat(res.formFields[factor]);
      sum += value;
      sumSquared += (value * value);
      values.push(value);
    });

    const average = (sum / total).toFixed(2);
    const stdDev = Math.sqrt((sumSquared / total) - Math.pow(average, 2)).toFixed(2);

    return {
      value: average,
      average,
      stdDev,
      values,
    };
  };

  useEffect(() => {
    groupDataByFormAndParam();
  }, [responses]);

  const handleClick = (factor, index) => {
    setActiveIndices((prev) => ({ ...prev, [factor]: index })); // Mettez à jour l'index actif pour le facteur
  };

  return (
    <div className="data-container">
      <h2>Graphiques des Réponses</h2>
      <div className="graph-list">
        {Object.entries(averagesData).map(([key, data], index) => {
          const factors = [...new Set(data.map(d => d.factor))];
          return (
            <div key={index} className="graph-block">
              <h3>Couple Formulaire/Paramètre : {key}</h3>
              <div className="sub-plots">
                {factors.map(factor => {
                  const factorData = data.filter(d => d.factor === factor);
                  const activeIndex = activeIndices[factor] || 0; // Récupérer l'index actif pour le facteur

                  return (
                    <div key={factor} className="sub-plot">
                      <h4>Facteur : {factor}</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={factorData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip content={<CustomTooltip activeIndex={activeIndex} data={factorData} />} />
                          <Legend />
                          <Bar
                            dataKey="value"
                            name={factor}
                            fill={(d) => generateColor(d.colorKey)}
                            onClick={(data, index) => handleClick(factor, index)} // Passer le facteur
                          >
                            {factorData.map((entry, index) => (
                              <Cell cursor="pointer" fill={index === activeIndex ? '#82ca9d' : '#8884d8'} key={`cell-${index}`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Create a custom tooltip component
const CustomTooltip = ({ active, payload, label, activeIndex, data }) => {
  if (active && payload && payload.length) {
    const activeItem = data[activeIndex];
    return (
      <div className="custom-tooltip">
        <p className="label">{`${activeItem.name} : ${activeItem.value}`}</p>
        <p className="intro">{`Moyenne: ${activeItem.average}`}</p>
        <p className="intro">{`Écart type: ${activeItem.stdDev}`}</p>
        <p className="intro">{`Valeurs: [${activeItem.values.join(', ')}]`}</p>
      </div>
    );
  }

  return null;
};

export default Data;
