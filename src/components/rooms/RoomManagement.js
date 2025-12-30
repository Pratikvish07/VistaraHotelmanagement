import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../../firebase-config';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
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
  const [rooms, setRooms] = useState([]);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: '',
    price: '',
    paymentMethod: '',
    paymentReceived: false,
    isVacant: true,
    cleaningDone: true,
    documentUrl: '',
    documentFile: null
  });

  // 🔐 Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  // 👤 Role
  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) setUserRole(snap.data().role);
    };

    fetchRole();
  }, [user]);

  // 📥 Fetch Rooms
  const fetchRooms = async () => {
    if (!user) return;

    const q = query(
      collection(db, 'rooms'),
      where('createdBy', '==', user.uid)
    );

    const snap = await getDocs(q);
    setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  // ➕ Create Room
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
      isVacant: newRoom.isVacant,
      cleaningDone: newRoom.cleaningDone,
      status: newRoom.isVacant ? 'available' : 'occupied',
      documentUrl,
      createdBy: user.uid,
      createdAt: new Date()
    });

    await fetchRooms();
    setShowAddModal(false);

    setNewRoom({
      roomNumber: '',
      type: '',
      price: '',
      paymentMethod: '',
      paymentReceived: false,
      isVacant: true,
      cleaningDone: true,
      documentUrl: '',
      documentFile: null
    });
  };

  // ✏️ Update Status
  const updateRoomStatus = async (id, field, value) => {
    const data = { [field]: value };
    if (field === 'isVacant') {
      data.status = value ? 'available' : 'occupied';
    }
    await updateDoc(doc(db, 'rooms', id), data);
    fetchRooms();
  };

  // ✏️ Edit Room
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

    await updateDoc(doc(db, 'rooms', editingRoom.id), {
      ...editingRoom,
      price: Number(editingRoom.price),
      status: editingRoom.isVacant ? 'available' : 'occupied',
      documentUrl
    });

    setShowEditModal(false);
    setEditingRoom(null);
    fetchRooms();
  };

  const getStatusBadge = (room) => {
    if (!room.isVacant) return <Badge bg="danger">Occupied</Badge>;
    if (!room.cleaningDone) return <Badge bg="warning">Needs Cleaning</Badge>;
    return <Badge bg="success">Available</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col><h1>Room Management</h1></Col>
      </Row>

      {userRole === 'manager' && (
        <Button className="mb-3" onClick={() => setShowAddModal(true)}>
          Add Room
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
                  <th>Vacant</th>
                  <th>Cleaning</th>
                  <th>Payment</th>
                  <th>Document</th>
                  <th>Action</th>
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
                        checked={r.isVacant}
                        onChange={e =>
                          updateRoomStatus(r.id, 'isVacant', e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={r.cleaningDone}
                        onChange={e =>
                          updateRoomStatus(r.id, 'cleaningDone', e.target.checked)
                        }
                      />
                    </td>
                    <td>
                      <Form.Check
                        type="switch"
                        checked={r.paymentReceived}
                        onChange={e =>
                          updateRoomStatus(r.id, 'paymentReceived', e.target.checked)
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
                        <Button
                          size="sm"
                          onClick={() => {
                            setEditingRoom(r);
                            setShowEditModal(true);
                          }}
                        >
                          Edit
                        </Button>
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
              onChange={e => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
            />
            <Form.Select
              className="mb-2"
              value={newRoom.type}
              onChange={e => setNewRoom({ ...newRoom, type: e.target.value })}
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
              onChange={e => setNewRoom({ ...newRoom, price: e.target.value })}
            />
            <Form.Control
              type="file"
              onChange={e => setNewRoom({ ...newRoom, documentFile: e.target.files[0] })}
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
                  setEditingRoom({ ...editingRoom, roomNumber: e.target.value })
                }
              />
              <Form.Control
                type="number"
                value={editingRoom.price}
                onChange={e =>
                  setEditingRoom({ ...editingRoom, price: e.target.value })
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
