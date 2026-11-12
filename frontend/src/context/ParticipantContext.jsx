import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';

export const ParticipantContext = createContext();

export const ParticipantProvider = ({ children }) => {
  // Données du participant actif persistées en localStorage
  const [participantData, setParticipantData] = useState(() => {
    try {
      const savedData = localStorage.getItem("participantData");
      const parsed = savedData ? JSON.parse(savedData) : {};
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_e) {
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
    const raw = Math.floor(Number(participantData?.currentTrialIndex));
    if (isNaN(raw) || raw < 1) return 1;
    // Ne jamais dépasser le nombre d'essais du bloc (index enregistré avant un changement
    // de protocole, donnée saisie à la main...) : sinon « Essai 7 sur 6 » et progression > 100 %.
    if (activeTrials.length > 0 && raw > activeTrials.length) return activeTrials.length;
    return raw;
  }, [participantData?.currentTrialIndex, activeTrials.length]);

  // Sauvegarder l'avancement (essai courant) côté serveur, pour pouvoir reprendre la session
  // d'un sujet là où elle s'était arrêtée, y compris depuis un autre navigateur.
  const lastSyncedTrialRef = useRef(null);
  useEffect(() => {
    const uid = participantData?.UserID;
    if (!uid) {
      lastSyncedTrialRef.current = null;
      return undefined;
    }

    const syncKey = `${uid}:${currentTrialIndex}`;
    if (lastSyncedTrialRef.current === null) {
      // Premier rendu ou activation d'un sujet : l'index vient déjà du serveur / du stockage local
      lastSyncedTrialRef.current = syncKey;
      return undefined;
    }
    if (lastSyncedTrialRef.current === syncKey) return undefined;

    const sameParticipant = lastSyncedTrialRef.current.startsWith(`${uid}:`);
    lastSyncedTrialRef.current = syncKey;
    if (!sameParticipant) return undefined; // changement de sujet : rien à enregistrer

    const timer = setTimeout(() => {
      axios
        .put(`/api/participants/${encodeURIComponent(uid)}`, { currentTrialIndex })
        .catch((error) => {
          // 404 : sujet non enregistré côté serveur (session locale uniquement)
          if (error.response?.status !== 404) {
            console.error("Erreur de sauvegarde de l'essai courant :", error);
          }
        });
    }, 400);
    return () => clearTimeout(timer);
  }, [participantData?.UserID, currentTrialIndex]);

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
    } catch (e) {
      console.error('Erreur nettoyage localStorage:', e);
    }
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
    const maxTrials = activeTrials.length || Infinity;
    setParticipantData(prev => {
      // Partir de l'index borné : un index enregistré hors limites ne doit pas « absorber » le clic
      const cur = Math.min(Number(prev?.currentTrialIndex || 1), maxTrials);
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