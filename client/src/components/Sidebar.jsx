import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-menu">
        <Link
          to="/dashboard"
          className={location.pathname === '/dashboard' ? 'active' : ''}
        >
          Dashboard
        </Link>
        <Link
          to="/projects"
          className={location.pathname.includes('/projects') ? 'active' : ''}
        >
          Projects
        </Link>
        <Link
          to="/resources"
          className={location.pathname.includes('/resources') ? 'active' : ''}
        >
          Resources
        </Link>
      </div>
    </aside>
  );
}
