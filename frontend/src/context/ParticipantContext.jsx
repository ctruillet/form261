import React, { createContext, useState, useEffect } from 'react';

export const ParticipantContext = createContext();

export const ParticipantProvider = ({ children }) => {
    // Initialiser avec les données du localStorage s'il y en a
    const [participantData, setParticipantData] = useState(() => {
        const savedData = localStorage.getItem("participantData");
        return savedData ? JSON.parse(savedData) : {};
    });

    // Mettre à jour le localStorage à chaque changement
    useEffect(() => {
        localStorage.setItem("participantData", JSON.stringify(participantData));
    }, [participantData]);

    const updateParticipant = (newData) => {
        setParticipantData(prevData => ({ ...prevData, ...newData }));
    };

    const clearParticipant = () => {
        setParticipantData({});
        localStorage.removeItem("participantData");
    };

    return (
        <ParticipantContext.Provider value={{ participantData, updateParticipant, clearParticipant }}>
            {children}
        </ParticipantContext.Provider>
    );
};