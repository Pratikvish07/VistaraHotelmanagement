import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth, storage } from '../../firebase-config';

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc
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
  Modal,
  Badge,
  Alert,
  Table
} from 'react-bootstrap';

function RoomManagement() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const emptyRoom = {
    roomNumber: '',
    type: '',
    price: '',
    paymentMethod: '',
    paymentReceived: false,
    cleaningDone: true,
    documentFile: null
  };

  const [newRoom, setNewRoom] = useState(emptyRoom);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  /* ---------------- ROLE ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserRole(snap.data().role);
    };

    fetchRole();
  }, [user]);

  /* ---------------- FETCH ROOMS (SYNC WITH BOOKINGS) ---------------- */
  const fetchRoomsWithBookingStatus = async () => {
    if (!user) return;

    // 1️⃣ Fetch rooms
    const roomsSnap = await getDocs(
      query(collection(db, 'rooms'), where('createdBy', '==', user.uid))
    );

    const roomsData = roomsSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // 2️⃣ Fetch ACTIVE bookings
    const bookingsSnap = await getDocs(
      query(
        collection(db, 'bookings'),
        where('createdBy', '==', user.uid),
        where('status', '==', 'active')
      )
    );

    const occupiedRoomIds = bookingsSnap.docs.map(
      b => b.data().roomId
    );

    // 3️⃣ Merge booking state into rooms
    const syncedRooms = roomsData.map(room => {
      const occupied = occupiedRoomIds.includes(room.id);
      return {
        ...room,
        isVacant: !occupied,
        status: occupied ? 'occupied' : 'available'
      };
    });

    setRooms(syncedRooms);
  };

  useEffect(() => {
    fetchRoomsWithBookingStatus();
  }, [user]);

  /* ---------------- CREATE ROOM ---------------- */
  const createRoom = async () => {
    if (!user) return alert('Not authenticated');

    let documentUrl = '';

    if (newRoom.documentFile) {
      const storageRef = ref(
        storage,
        `room-documents/${user.uid}/${Date.now()}_${newRoom.documentFile.name}`
      );
      await uploadBytes(storageRef, newRoom.documentFile);
      documentUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, 'rooms'), {
      roomNumber: newRoom.roomNumber,
      type: newRoom.type,
      price: Number(newRoom.price),
      paymentMethod: newRoom.paymentMethod,
      paymentReceived: newRoom.paymentReceived,
      cleaningDone: newRoom.cleaningDone,
      status: 'available',
      isVacant: true,
      documentUrl,
      createdBy: user.uid,
      createdAt: new Date()
    });

    setShowAddModal(false);
    setNewRoom(emptyRoom);
    fetchRoomsWithBookingStatus();
  };

  /* ---------------- EDIT ROOM ---------------- */
  const editRoom = async () => {
    if (!editingRoom) return;

    let documentUrl = editingRoom.documentUrl || '';

    if (editingRoom.documentFile) {
      const storageRef = ref(
        storage,
        `room-documents/${user.uid}/${Date.now()}_${editingRoom.documentFile.name}`
      );
      await uploadBytes(storageRef, editingRoom.documentFile);
      documentUrl = await getDownloadURL(storageRef);
    }

    const { id, documentFile, ...safeData } = editingRoom;

    await updateDoc(doc(db, 'rooms', id), {
      ...safeData,
      price: Number(safeData.price),
      documentUrl,
      updatedAt: new Date()
    });

    setShowEditModal(false);
    setEditingRoom(null);
    fetchRoomsWithBookingStatus();
  };

  /* ---------------- DELETE ROOM ---------------- */
  const deleteRoom = async room => {
    if (room.status === 'occupied') {
      return alert('Cannot delete an occupied room');
    }

    if (!window.confirm(`Delete Room ${room.roomNumber}?`)) return;

    await deleteDoc(doc(db, 'rooms', room.id));
    fetchRoomsWithBookingStatus();
  };

  /* ---------------- STATUS BADGE ---------------- */
  const getStatusBadge = room => (
    <Badge bg={room.status === 'occupied' ? 'danger' : 'success'}>
      {room.status === 'occupied' ? 'Occupied' : 'Available'}
    </Badge>
  );

  /* ---------------- UI ---------------- */
  return (
    <Container fluid className="py-4">
      <Row className="mb-3">
        <Col>
          <Button
            variant="outline-secondary"
            className="mb-3"
            onClick={() => navigate('/dashboard')}
          >
            ← Back to Dashboard
          </Button>
          <h1>Room Management</h1>
          <p className="text-muted">
            Room status auto-synced from bookings
          </p>
        </Col>
      </Row>

      {userRole === 'manager' && (
        <Button className="mb-3" onClick={() => setShowAddModal(true)}>
          + Add Room
        </Button>
      )}

      <Card>
        <Card.Body>
          {rooms.length === 0 ? (
            <Alert>No rooms found</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Cleaning</th>
                  <th>Payment</th>
                  <th>Document</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.roomNumber}</td>
                    <td>{r.type}</td>
                    <td>₹{r.price}</td>
                    <td>{getStatusBadge(r)}</td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={r.cleaningDone}
                        onChange={e =>
                          updateDoc(doc(db, 'rooms', r.id), {
                            cleaningDone: e.target.checked
                          }).then(fetchRoomsWithBookingStatus)
                        }
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={r.paymentReceived}
                        onChange={e =>
                          updateDoc(doc(db, 'rooms', r.id), {
                            paymentReceived: e.target.checked
                          }).then(fetchRoomsWithBookingStatus)
                        }
                      />
                    </td>
                    <td>
                      {r.documentUrl ? (
                        <a href={r.documentUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      {userRole === 'manager' && (
                        <>
                          <Button
                            size="sm"
                            className="me-2"
                            onClick={() => {
                              setEditingRoom(r);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteRoom(r)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* ADD MODAL */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              className="mb-2"
              placeholder="Room Number"
              value={newRoom.roomNumber}
              onChange={e =>
                setNewRoom({ ...newRoom, roomNumber: e.target.value })
              }
            />
            <Form.Select
              className="mb-2"
              value={newRoom.type}
              onChange={e =>
                setNewRoom({ ...newRoom, type: e.target.value })
              }
            >
              <option value="">Select Type</option>
              <option>Single</option>
              <option>Double</option>
              <option>Suite</option>
              <option>Deluxe</option>
            </Form.Select>
            <Form.Control
              type="number"
              className="mb-2"
              placeholder="Price"
              value={newRoom.price}
              onChange={e =>
                setNewRoom({ ...newRoom, price: e.target.value })
              }
            />
            <Form.Control
              type="file"
              onChange={e =>
                setNewRoom({ ...newRoom, documentFile: e.target.files[0] })
              }
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={createRoom}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Room</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingRoom && (
            <Form>
              <Form.Control
                className="mb-2"
                value={editingRoom.roomNumber}
                onChange={e =>
                  setEditingRoom({
                    ...editingRoom,
                    roomNumber: e.target.value
                  })
                }
              />
              <Form.Control
                type="number"
                className="mb-2"
                value={editingRoom.price}
                onChange={e =>
                  setEditingRoom({
                    ...editingRoom,
                    price: e.target.value
                  })
                }
              />
              <Form.Control
                type="file"
                onChange={e =>
                  setEditingRoom({
                    ...editingRoom,
                    documentFile: e.target.files[0]
                  })
                }
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={editRoom}>Update</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default RoomManagement;
