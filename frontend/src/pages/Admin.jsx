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
      <p>Affichage des réponses et possibilité de les supprimer ou de les modifier</p>
    </div>
  );
};

export default Admin;
