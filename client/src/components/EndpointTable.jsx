import React from 'react';

export default function EndpointTable({ endpoints }) {
  return (
    <table className="endpoint-table">
      <thead>
        <tr>
          <th>Path</th>
          <th>Method</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {endpoints.map((endpoint) => (
          <tr key={endpoint.id}>
            <td>{endpoint.path}</td>
            <td>{endpoint.method}</td>
            <td>{endpoint.status}</td>
            <td>
              <button>Test</button>
              <button>Copy URL</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
