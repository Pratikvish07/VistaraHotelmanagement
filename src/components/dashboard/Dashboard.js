import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Navbar, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase-config';
import { collection, query, where, getDocs } from 'firebase/firestore';

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roomStats, setRoomStats] = useState({
    totalRooms: 0,
    availableRooms: 0,
    potentialRevenue: 0
  });

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // 📊 Fetch Room Stats
  useEffect(() => {
    if (!user) return;

    const fetchRoomStats = async () => {
      const q = query(
        collection(db, 'rooms'),
        where('createdBy', '==', user.uid)
      );

      const snap = await getDocs(q);
      const rooms = snap.docs.map(d => d.data());

      const totalRooms = rooms.length;
      const availableRooms = rooms.filter(r => r.isVacant).length;
      const potentialRevenue = rooms
        .filter(r => r.isVacant)
        .reduce((sum, r) => sum + (r.price || 0), 0);

      setRoomStats({
        totalRooms,
        availableRooms,
        potentialRevenue
      });
    };

    fetchRoomStats();
  }, [user]);

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

        {/* Room Stats */}
        <Row className="g-4 mb-4">
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Total Rooms</Card.Title>
                <Card.Text className="h4 text-primary">{roomStats.totalRooms}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Available Rooms</Card.Title>
                <Card.Text className="h4 text-success">{roomStats.availableRooms}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <Card.Title>Potential Revenue</Card.Title>
                <Card.Text className="h4 text-warning">₹{roomStats.potentialRevenue}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          {/* 📅 Bookings */}
          <Col md={6} lg={3}>
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
          <Col md={6} lg={3}>
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
          <Col md={6} lg={3}>
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

          {/* 🧹 Cleaning */}
          <Col md={6} lg={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Cleaning</Card.Title>
                <Card.Text>
                  Manage room cleaning tasks and assignments.
                </Card.Text>
                <Link to="/cleaning">
                  <Button variant="info">Manage Cleaning</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>

          {/* 🍔 Food */}
          <Col md={6} lg={3}>
            <Card className="shadow-sm h-100">
              <Card.Body>
                <Card.Title>Food</Card.Title>
                <Card.Text>
                  Manage food items and prices for the hotel.
                </Card.Text>
                <Link to="/food">
                  <Button variant="secondary">Manage Food</Button>
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
