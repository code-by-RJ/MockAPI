import React from 'react';
import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="project-card-footer">
        <span className="resource-count">{project.resourceCount} resources</span>
        <Link to={`/project/${project.id}`} className="btn-secondary">
          View
        </Link>
      </div>
    </div>
  );
}
