import React from 'react';
import { Link } from 'react-router-dom';

export default function ResourceTable({ resources }) {
  return (
    <table className="resource-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Endpoint</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {resources.map((resource) => (
          <tr key={resource.id}>
            <td>{resource.name}</td>
            <td>{resource.type}</td>
            <td>{resource.endpoint}</td>
            <td>
              <Link to={`/resource/${resource.id}`}>Edit</Link>
              <button>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
