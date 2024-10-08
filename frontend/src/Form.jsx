import React, { useState } from 'react';
import axios from 'axios';

const Form = () => {
  const [formData, setFormData] = useState({
    participant: '',
    mentalDemand: '',
    physicalDemand: '',
    // Ajoute d'autres facteurs si nécessaire
  });

  // Fonction pour gérer les changements dans le formulaire
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Fonction pour soumettre les données
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('/api/registerData', formData);
      console.log('Réponse du serveur :', response.data);
      alert('Données envoyées avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi des données :', error);
      alert('Erreur lors de l\'envoi des données');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Participant :</label>
        <input
          type="text"
          name="participant"
          value={formData.participant}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Demande mentale (Mental Demand) :</label>
        <input
          type="number"
          name="mentalDemand"
          value={formData.mentalDemand}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Demande physique (Physical Demand) :</label>
        <input
          type="number"
          name="physicalDemand"
          value={formData.physicalDemand}
          onChange={handleChange}
          required
        />
      </div>

      {/* Ajoute d'autres facteurs ici selon les besoins du NASA TLX */}

      <button type="submit">Envoyer</button>
    </form>
  );
};

export default Form;
