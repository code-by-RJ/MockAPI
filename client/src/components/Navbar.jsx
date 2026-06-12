import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Clear auth token
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">MockAPI</Link>
      </div>
      <div className="navbar-menu">
        <Link to="/dashboard">Dashboard</Link>
      </div>
      <div className="navbar-end">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
