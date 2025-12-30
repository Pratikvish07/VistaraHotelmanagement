import React from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase-config';

function Dashboard() {
  const navigate = useNavigate();

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <>
      {/* 🔝 Top Navbar */}
      <Navbar bg="dark" variant="dark" expand="lg" className="px-4">
        <Navbar.Brand>Hotel Management</Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse className="justify-content-end">
          <Nav>
            <Button variant="outline-light" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* 📊 Dashboard Content */}
      <Container className="mt-4">
        <h3 className="mb-4">Dashboard</h3>

        <Row className="g-4">
          {/* 📅 Bookings */}
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Bookings</Card.Title>
                <Card.Text>
                  Manage hotel bookings, reservations, and check-ins.
                </Card.Text>
                <Link to="/bookings">
                  <Button variant="primary">Manage Bookings</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* 👥 Customers */}
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Customers</Card.Title>
                <Card.Text>
                  View and manage guest details and history.
                </Card.Text>
                <Link to="/customers">
                  <Button variant="success">Manage Customers</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* 🛏 Rooms */}
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Rooms</Card.Title>
                <Card.Text>
                  Manage room availability and room types.
                </Card.Text>
                <Link to="/rooms">
                  <Button variant="warning">Manage Rooms</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default Dashboard;
