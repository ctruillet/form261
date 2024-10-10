import React from 'react';

const RangeField = ({ label, min, max, onChange }) => {
  const handleRangeChange = (e, key) => {
    onChange({ [key]: e.target.value });
  };

  return (
    <div className="range-field">
      <input
        type="text"
        placeholder="Label du champ"
        value={label}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <div>
        <input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) => handleRangeChange(e, 'min')}
        />
        <input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) => handleRangeChange(e, 'max')}
        />
      </div>
      <input type="range" min={min} max={max} readOnly />
    </div>
  );
};

export default RangeField;
