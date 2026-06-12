import React from 'react';

export default function FieldRow({ field, onUpdate, onRemove }) {
  return (
    <div className="field-row">
      <input
        type="text"
        placeholder="Field Name"
        value={field.name}
        onChange={(e) => onUpdate(field.id, { name: e.target.value })}
      />
      <select
        value={field.type}
        onChange={(e) => onUpdate(field.id, { type: e.target.value })}
      >
        <option value="string">String</option>
        <option value="number">Number</option>
        <option value="boolean">Boolean</option>
        <option value="array">Array</option>
        <option value="object">Object</option>
      </select>
      <button onClick={() => onRemove(field.id)}>Remove</button>
    </div>
  );
}
