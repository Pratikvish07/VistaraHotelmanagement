import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../firebase-config';

import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy
} from 'firebase/firestore';

import { onAuthStateChanged } from 'firebase/auth';

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

function CleaningManagement() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  const [rooms, setRooms] = useState([]);
  const [cleaningTasks, setCleaningTasks] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const emptyTask = {
    roomId: '',
    roomNumber: '',
    taskType: 'Standard Clean',
    status: 'pending',
    assignedTo: '',
    priority: 'medium',
    notes: ''
  };

  const [taskForm, setTaskForm] = useState(emptyTask);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  /* ---------------- USER ROLE ---------------- */
  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        setUserRole(snap.data().role); // admin | manager | staff
      }
    };

    fetchRole();
  }, [user]);

  /* ---------------- FETCH ROOMS (ROLE-BASED) ---------------- */
  useEffect(() => {
    if (!user || !userRole) return;

    const fetchRooms = async () => {
      try {
        // ⚠️ DO NOT filter by createdBy (rules are role-based)
        const q = query(
          collection(db, 'rooms'),
          orderBy('roomNumber', 'asc')
        );

        const snap = await getDocs(q);
        setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error('Fetch rooms error:', error);
        alert(error.message);
      }
    };

    fetchRooms();
  }, [user, userRole]);

  /* ---------------- FETCH CLEANING TASKS ---------------- */
  const fetchCleaningTasks = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'cleaningTasks'),
        orderBy('createdAt', 'desc')
      );

      const snap = await getDocs(q);

      // Optional: owner-only visibility
      const tasks = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(t => t.createdBy === user.uid || userRole !== 'manager');

      setCleaningTasks(tasks);
    } catch (error) {
      console.error('Fetch tasks error:', error);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (user && userRole) fetchCleaningTasks();
  }, [user, userRole]);

  /* ---------------- SAVE TASK ---------------- */
  const saveTask = async () => {
    if (!user) return alert('Not authenticated');

    try {
      if (editingTask) {
        const updateData = {
          ...taskForm,
          updatedAt: new Date()
        };

        if (
          taskForm.status === 'completed' &&
          editingTask.status !== 'completed'
        ) {
          updateData.completedAt = new Date();

          // Mark room as cleaned
          await updateDoc(doc(db, 'rooms', taskForm.roomId), {
            cleaningDone: true
          });
        }

        await updateDoc(
          doc(db, 'cleaningTasks', editingTask.id),
          updateData
        );
      } else {
        await addDoc(collection(db, 'cleaningTasks'), {
          ...taskForm,
          createdBy: user.uid,
          createdAt: new Date()
        });
      }

      setShowModal(false);
      setEditingTask(null);
      setTaskForm(emptyTask);
      fetchCleaningTasks();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ---------------- DELETE TASK ---------------- */
  const deleteTask = async task => {
    if (userRole === 'manager' || userRole === 'staff') {
      return alert('Staff cannot delete tasks');
    }

    if (!window.confirm(`Delete cleaning task for room ${task.roomNumber}?`))
      return;

    try {
      await deleteDoc(doc(db, 'cleaningTasks', task.id));
      fetchCleaningTasks();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ---------------- BADGES ---------------- */
  const getStatusBadge = status => {
    const variants = {
      pending: 'warning',
      'in-progress': 'info',
      completed: 'success'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  const getPriorityBadge = priority => {
    const variants = {
      low: 'success',
      medium: 'warning',
      high: 'danger'
    };
    return <Badge bg={variants[priority]}>{priority}</Badge>;
  };

  /* ---------------- FILTER ---------------- */
  const filteredTasks = cleaningTasks.filter(task =>
    filterStatus === 'all' ? true : task.status === filterStatus
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
          <h1>Cleaning Management</h1>
          <p className="text-muted">
            Manage room cleaning tasks and assignments
          </p>
        </Col>

        {(userRole === 'admin' || userRole === 'manager') && (
          <Col className="text-end">
            <Button onClick={() => setShowModal(true)}>
              + Create Task
            </Button>
          </Col>
        )}
      </Row>

      {/* FILTER */}
      <Row className="mb-3">
        <Col md={3}>
          <Form.Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </Form.Select>
        </Col>
      </Row>

      <Card>
        <Card.Body>
          {filteredTasks.length === 0 ? (
            <Alert>No cleaning tasks found</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map(task => (
                  <tr key={task.id}>
                    <td>{task.roomNumber}</td>
                    <td>{task.taskType}</td>
                    <td>{getStatusBadge(task.status)}</td>
                    <td>{getPriorityBadge(task.priority)}</td>
                    <td>{task.assignedTo || '—'}</td>
                    <td>
                      {task.createdAt?.toDate?.().toLocaleDateString() || '—'}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setEditingTask(task);
                          setTaskForm(task);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </Button>

                      {(userRole === 'admin' || userRole === 'manager') && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => deleteTask(task)}
                        >
                          Delete
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

      {/* MODAL */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingTask ? 'Edit Cleaning Task' : 'Create Cleaning Task'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Room</Form.Label>
                <Form.Select
                  value={taskForm.roomNumber}
                  onChange={e => {
                    const r = rooms.find(
                      room => room.roomNumber === e.target.value
                    );
                    setTaskForm({
                      ...taskForm,
                      roomNumber: e.target.value,
                      roomId: r?.id || ''
                    });
                  }}
                >
                  <option value="">Select Room</option>
                  {rooms.map(r => (
                    <option key={r.id} value={r.roomNumber}>
                      {r.roomNumber} - {r.type}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Task Type</Form.Label>
                <Form.Select
                  value={taskForm.taskType}
                  onChange={e =>
                    setTaskForm({ ...taskForm, taskType: e.target.value })
                  }
                >
                  <option>Standard Clean</option>
                  <option>Deep Clean</option>
                  <option>Quick Touch-up</option>
                  <option>Post-Checkout Clean</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Priority</Form.Label>
                <Form.Select
                  value={taskForm.priority}
                  onChange={e =>
                    setTaskForm({ ...taskForm, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={taskForm.status}
                  onChange={e =>
                    setTaskForm({ ...taskForm, status: e.target.value })
                  }
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Assigned To</Form.Label>
                <Form.Control
                  placeholder="Staff name"
                  value={taskForm.assignedTo}
                  onChange={e =>
                    setTaskForm({ ...taskForm, assignedTo: e.target.value })
                  }
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={taskForm.notes}
                  onChange={e =>
                    setTaskForm({ ...taskForm, notes: e.target.value })
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
          <Button onClick={saveTask}>
            {editingTask ? 'Update' : 'Create'} Task
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default CleaningManagement;
