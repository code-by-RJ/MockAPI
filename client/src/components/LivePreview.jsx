import React from 'react';

export default function LivePreview({ data }) {
  return (
    <div className="live-preview">
      <h3>Live Preview</h3>
      <div className="preview-content">
        {data ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p>Add fields to see preview</p>
        )}
      </div>
    </div>
  );
}
