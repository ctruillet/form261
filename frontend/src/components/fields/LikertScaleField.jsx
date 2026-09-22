import React from 'react';

const LikertScaleField = ({ label, firstLabel, lastLabel, columns = 5, onChange }) => {
  const handleLabelChange = (e, key) => {
    if (onChange) {
      onChange({ [key]: e.target.value });
    }
  };

  const handleColumnChange = (e) => {
    if (onChange) {
      onChange({ columns: parseInt(e.target.value, 10) || 0 });
    }
  };

  const columnCount = Math.max(0, parseInt(columns, 10) || 0);

  return (
    <div className="likert-scale-field">
      <input
        type="text"
        placeholder="Label du champ"
        value={label || ''}
        onChange={(e) => handleLabelChange(e, 'label')}
      />
      <div className="likert-scale-grid">
        <input
          type="text"
          placeholder="Label première colonne"
          value={firstLabel || ''}
          onChange={(e) => handleLabelChange(e, 'firstLabel')}
        />
        {[...Array(columnCount)].map((_, i) => (
          <div key={i} className="likert-scale-item">
            {i + 1}
          </div>
        ))}
        <input
          type="text"
          placeholder="Label dernière colonne"
          value={lastLabel || ''}
          onChange={(e) => handleLabelChange(e, 'lastLabel')}
        />
      </div>
      <input
        type="number"
        placeholder="Nombre de colonnes"
        value={columns ?? ''}
        onChange={handleColumnChange}
      />
    </div>
  );
};

export default LikertScaleField;
