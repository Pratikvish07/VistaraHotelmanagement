import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';

// Lazy load components for code splitting
const Login = lazy(() => import('./components/auth/Login'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const RoomManagement = lazy(() => import('./components/rooms/RoomManagement'));
const CustomerManagement = lazy(() => import('./components/customers/CustomerManagement'));
const BookingManagement = lazy(() => import('./components/bookings/BookingManagement'));

// Loading component
const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Container fluid className="p-0">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/rooms" element={<RoomManagement />} />
              <Route path="/customers" element={<CustomerManagement />} />
              <Route path="/bookings" element={<BookingManagement />} />
            </Routes>
          </Suspense>
        </Container>
      </div>
    </Router>
  );
}

export default App;
