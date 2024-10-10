// Admin.jsx
import React, { useState } from 'react';
import axios from 'axios';

const Admin = () => {
  const [factors, setFactors] = useState({
    factor1: '',
    factor2: '',
    // Ajoute d'autres facteurs si nécessaire
  });

  const handleChange = (e) => {
    setFactors({
      ...factors,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Facteurs enregistrés :", factors);
    // Ici, tu pourrais envoyer ces données au backend pour les stocker

    try {
        const response = await axios.post('/api/setFactors', formData);
        console.log('Réponse du serveur :', response.data);
        alert('Données envoyées avec succès');
      } catch (error) {
        console.error('Erreur lors de l\'envoi des données :', error);
        alert('Erreur lors de l\'envoi des données');
      }
  };

  return (
    <div>
      <h2>Page Admin</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Facteur 1 :</label>
          <input
            type="text"
            name="factor1"
            value={factors.factor1}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Facteur 2 :</label>
          <input
            type="text"
            name="factor2"
            value={factors.factor2}
            onChange={handleChange}
            required
          />
        </div>

        {/* Ajoute d'autres champs de formulaire pour les facteurs */}
        
        <button type="submit">Enregistrer les facteurs</button>
      </form>
    </div>
  );
};

export default Admin;
