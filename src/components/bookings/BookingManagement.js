import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../firebase-config';

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  query,
  where
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  Alert,
  Table,
  Modal,
  Badge,
  InputGroup
} from 'react-bootstrap';

function BookingManagement() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  const emptyBooking = {
    guestName: '',
    guestAadhaar: '',
    guestMobile: '',
    additionalGuests: 0,
    roomId: '',
    roomNumber: '',
    roomPrice: 0,
    checkInDate: '',
    checkOutDate: '',
    aadhaarFile: null
  };

  const [bookingForm, setBookingForm] = useState(emptyBooking);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ---------------- FETCH ROOMS ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchRooms = async () => {
      const q = query(
        collection(db, 'rooms'),
        where('createdBy', '==', user.uid)
      );
      const snap = await getDocs(q);
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    fetchRooms();
  }, [user]);

  /* ---------------- FETCH BOOKINGS ---------------- */
  const fetchBookings = async () => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('createdBy', '==', user.uid)
    );
    const snap = await getDocs(q);
    setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  /* ---------------- ROOM OCCUPANCY ---------------- */
  const occupyRoom = async roomId => {
    if (!roomId) return;
    await updateDoc(doc(db, 'rooms', roomId), {
      isVacant: false,
      status: 'occupied'
    });
  };

  /* ---------------- SAVE BOOKING ---------------- */
  const saveBooking = async () => {
    if (!user) return alert('Not authenticated');

    let aadhaarUrl = '';

    if (bookingForm.aadhaarFile) {
      const storageRef = ref(
        storage,
        `booking-aadhaar/${user.uid}/${Date.now()}_${bookingForm.aadhaarFile.name}`
      );
      await uploadBytes(storageRef, bookingForm.aadhaarFile);
      aadhaarUrl = await getDownloadURL(storageRef);
    }

    if (editingBooking) {
      await updateDoc(doc(db, 'bookings', editingBooking.id), {
        ...bookingForm,
        additionalGuests: Number(bookingForm.additionalGuests),
        aadhaarUrl: aadhaarUrl || editingBooking.aadhaarUrl,
        updatedAt: new Date()
      });
    } else {
      await addDoc(collection(db, 'bookings'), {
        ...bookingForm,
        additionalGuests: Number(bookingForm.additionalGuests),
        aadhaarUrl,
        status: 'active',
        createdBy: user.uid,
        createdAt: new Date()
      });
    }

    await occupyRoom(bookingForm.roomId);

    setShowModal(false);
    setEditingBooking(null);
    setBookingForm(emptyBooking);
    fetchBookings();
  };

  /* ---------------- UI ---------------- */
  return (
    <Container fluid className="py-4">
      <Row className="mb-3">
        <Col>
          <Button
            variant="outline-secondary"
            className="mb-2"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <h2>Booking Management</h2>
          <p className="text-muted">
            Booking-driven room occupancy & guest control
          </p>
        </Col>
        <Col className="text-end">
          <Button onClick={() => setShowModal(true)}>
            + Create Booking
          </Button>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {bookings.length === 0 ? (
            <Alert>No bookings found</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Total Guests</th>
                  <th>Price</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td>{b.guestName}</td>
                    <td>{b.roomNumber}</td>
                    <td>{1 + Number(b.additionalGuests)}</td>
                    <td>₹{b.roomPrice}</td>
                    <td>{b.checkInDate}</td>
                    <td>{b.checkOutDate}</td>
                    <td>
                      <Badge bg="success">{b.status}</Badge>
                    </td>
                    <td>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEditingBooking(b);
                          setBookingForm(b);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingBooking ? 'Modify Booking' : 'Create Booking'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Guest Name</Form.Label>
                <Form.Control
                  value={bookingForm.guestName}
                  onChange={e =>
                    setBookingForm({ ...bookingForm, guestName: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Additional Guests</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={bookingForm.additionalGuests}
                  onChange={e =>
                    setBookingForm({
                      ...bookingForm,
                      additionalGuests: e.target.value
                    })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Aadhaar Upload</Form.Label>
                <Form.Control
                  type="file"
                  onChange={e =>
                    setBookingForm({
                      ...bookingForm,
                      aadhaarFile: e.target.files[0]
                    })
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label>Room</Form.Label>
                <Form.Select
                  value={bookingForm.roomNumber}
                  onChange={e => {
                    const r = rooms.find(
                      room => room.roomNumber === e.target.value
                    );
                    setBookingForm({
                      ...bookingForm,
                      roomNumber: e.target.value,
                      roomId: r?.id || '',
                      roomPrice: r?.price || 0
                    });
                  }}
                >
                  <option value="">Select Room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      {r.roomNumber} - {r.type} - ₹{r.price}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <InputGroup className="mb-2">
                <InputGroup.Text>₹</InputGroup.Text>
                <Form.Control value={bookingForm.roomPrice} disabled />
              </InputGroup>

              <Form.Group className="mb-2">
                <Form.Label>Check-In</Form.Label>
                <Form.Control
                  type="date"
                  value={bookingForm.checkInDate}
                  onChange={e =>
                    setBookingForm({
                      ...bookingForm,
                      checkInDate: e.target.value
                    })
                  }
                />
              </Form.Group>

              <Form.Group>
                <Form.Label>Check-Out</Form.Label>
                <Form.Control
                  type="date"
                  value={bookingForm.checkOutDate}
                  onChange={e =>
                    setBookingForm({
                      ...bookingForm,
                      checkOutDate: e.target.value
                    })
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button onClick={saveBooking}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default BookingManagement;
