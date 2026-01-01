import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load components
const Login = lazy(() => import('./components/auth/Login'));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const RoomManagement = lazy(() => import('./components/rooms/RoomManagement'));
const CustomerManagement = lazy(() => import('./components/customers/CustomerManagement'));
const BookingManagement = lazy(() => import('./components/bookings/BookingManagement'));
const CleaningManagement = lazy(() => import('./components/cleaning/CleaningManagement'));

const LoadingSpinner = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
    <Spinner animation="border" role="status" />
  </div>
);

function App() {
  return (
    <Router>
      <Container fluid className="p-0">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public route */}
            <Route path="/" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/rooms"
              element={
                <ProtectedRoute>
                  <RoomManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <CustomerManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/cleaning"
              element={
                <ProtectedRoute>
                  <CleaningManagement />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Container>
    </Router>
  );
}

export default App;
