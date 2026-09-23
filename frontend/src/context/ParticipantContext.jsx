import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

export const ParticipantContext = createContext();

export const ParticipantProvider = ({ children }) => {
  // Données du participant actif persistées en localStorage
  const [participantData, setParticipantData] = useState(() => {
    try {
      const savedData = localStorage.getItem("participantData");
      return savedData ? JSON.parse(savedData) : {};
    } catch (e) {
      return {};
    }
  });

  // Protocole expérimental actif (facteurs, blocs, méthode)
  const [protocol, setProtocol] = useState(null);
  const [loadingProtocol, setLoadingProtocol] = useState(true);

  // Charger le protocole depuis l'API
  const fetchProtocol = useCallback(async () => {
    setLoadingProtocol(true);
    try {
      const response = await axios.get('/api/protocol');
      setProtocol(response.data);
    } catch (error) {
      console.error('Erreur chargement protocole:', error);
    } finally {
      setLoadingProtocol(false);
    }
  }, []);

  useEffect(() => {
    fetchProtocol();
  }, [fetchProtocol]);

  // Mettre à jour le localStorage à chaque changement de participant
  useEffect(() => {
    try {
      localStorage.setItem("participantData", JSON.stringify(participantData));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage:', e);
    }
  }, [participantData]);

  // Liste ordonnée des essais pour le bloc du participant actif
  const activeTrials = useMemo(() => {
    if (!protocol || !protocol.blocks || !participantData?.Block) return [];
    return protocol.blocks[participantData.Block] || [];
  }, [protocol, participantData?.Block]);

  // Index de l'essai courant (1-indexé)
  const currentTrialIndex = useMemo(() => {
    const raw = Number(participantData?.currentTrialIndex);
    if (!isNaN(raw) && raw >= 1) return raw;
    return 1;
  }, [participantData?.currentTrialIndex]);

  // Essai courant (ex: { trialOrder: 1, Technique: "vMirrorAR" })
  const currentTrial = useMemo(() => {
    if (activeTrials.length === 0) return null;
    return activeTrials.find(t => t.trialOrder === currentTrialIndex) || activeTrials[0];
  }, [activeTrials, currentTrialIndex]);

  // Facteurs expérimentaux purs de l'essai courant (sans clés internes)
  const activeFactors = useMemo(() => {
    if (!currentTrial) return {};
    const factorsObj = { ...currentTrial };
    delete factorsObj.trialOrder;
    delete factorsObj.macroBlock;
    delete factorsObj.subTrial;
    return factorsObj;
  }, [currentTrial]);

  const updateParticipant = (newData) => {
    setParticipantData(prev => ({
      ...prev,
      ...newData,
      currentTrialIndex: newData.currentTrialIndex !== undefined ? newData.currentTrialIndex : (prev.currentTrialIndex || 1)
    }));
  };

  const clearParticipant = () => {
    setParticipantData({});
    try {
      localStorage.removeItem("participantData");
    } catch (e) {}
  };

  const setTrialIndex = (index) => {
    const maxTrials = activeTrials.length || 1;
    const clamped = Math.max(1, Math.min(index, maxTrials));
    setParticipantData(prev => ({
      ...prev,
      currentTrialIndex: clamped
    }));
  };

  const nextTrial = () => {
    const maxTrials = activeTrials.length || 1;
    setParticipantData(prev => {
      const cur = Number(prev?.currentTrialIndex || 1);
      const next = Math.min(cur + 1, maxTrials);
      return { ...prev, currentTrialIndex: next };
    });
  };

  const prevTrial = () => {
    setParticipantData(prev => {
      const cur = Number(prev?.currentTrialIndex || 1);
      const prevIdx = Math.max(cur - 1, 1);
      return { ...prev, currentTrialIndex: prevIdx };
    });
  };

  return (
    <ParticipantContext.Provider
      value={{
        participantData,
        protocol,
        loadingProtocol,
        activeTrials,
        currentTrialIndex,
        currentTrial,
        activeFactors,
        updateParticipant,
        clearParticipant,
        setTrialIndex,
        nextTrial,
        prevTrial,
        reloadProtocol: fetchProtocol
      }}
    >
      {children}
    </ParticipantContext.Provider>
  );
};