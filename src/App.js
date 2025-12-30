import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import RoomManagement from './components/rooms/RoomManagement';
import CustomerManagement from './components/customers/CustomerManagement';
import BookingManagement from './components/bookings/BookingManagement';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<RoomManagement />} />
          <Route path="/customers" element={<CustomerManagement />} />
          <Route path="/bookings" element={<BookingManagement />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
