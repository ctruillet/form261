import React from 'react';

const TextField = ({ label, onChange }) => {
  return (
    <div className="text-field">
      <input
        type="text"
        placeholder="Label du champ"
        value={label}
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <textarea placeholder="Prévisualisation du champ texte" readOnly></textarea>
    </div>
  );
};

export default TextField;
