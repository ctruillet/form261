// components/fields/RankingField.jsx
import React, { useState } from "react";

const RankingField = ({ label, options, onChange }) => {
  const [rankings, setRankings] = useState(
    options.reduce((acc, option) => ({ ...acc, [option]: "" }), {})
  );

  const handleRankingChange = (option, value) => {
    const newRankings = { ...rankings, [option]: value };
    setRankings(newRankings);

    const values = Object.values(newRankings);
    const hasDuplicates = values.some((val, i) => values.indexOf(val) !== i);

    if (!hasDuplicates) {
      onChange({ label, rankings: newRankings });
    }
  };

  return (
    <div className="ranking-field">
      <label>{label}</label>
      {options.map((option, index) => (
        <div key={index}>
          <span>{option}</span>
          <input
            type="number"
            value={rankings[option]}
            onChange={(e) => handleRankingChange(option, e.target.value)}
            min="1"
            max={options.length}
          />
        </div>
      ))}
    </div>
  );
};

export default RankingField;
