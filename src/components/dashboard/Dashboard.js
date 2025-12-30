import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <nav>
        <ul>
          <li>
            <Link to="/bookings">Manage Bookings</Link>
          </li>
          <li>
            <Link to="/customers">Manage Customers</Link>
          </li>
          <li>
            <Link to="/rooms">Manage Rooms</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Dashboard;
