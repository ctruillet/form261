import React from 'react';
import { useNavigate } from 'react-router-dom';

const NavigationButtons = () => {
  const navigate = useNavigate();

  return (
    <div>
      <button onClick={() => navigate(-1)}>Précédent</button>
      <button onClick={() => navigate(1)}>Suivant</button>
    </div>
  );
};

export default NavigationButtons;
