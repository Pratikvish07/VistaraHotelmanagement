import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
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
  Modal,
  Alert,
  Table,
  Badge
} from 'react-bootstrap';

import { db, auth, storage } from '../../firebase-config';

function FoodManagement() {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [user, setUser] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);

  const emptyFood = {
    name: '',
    price: '',
    description: '',
    category: '',
    imageFile: null
  };

  const [newFood, setNewFood] = useState(emptyFood);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  /* ---------------- FETCH FOODS ---------------- */
  const fetchFoods = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'foods'),
        where('createdBy', '==', user.uid)
      );
      const snap = await getDocs(q);
      setFoods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Fetch foods error:', error);
      alert(error.message);
    }
  };

  useEffect(() => {
    if (user) fetchFoods();
  }, [user]);

  /* ---------------- CREATE FOOD ---------------- */
  const createFood = async () => {
    if (!user) return alert('Not authenticated');

    try {
      let imageUrl = '';

      if (newFood.imageFile) {
        const storageRef = ref(
          storage,
          `food-images/${user.uid}/${Date.now()}_${newFood.imageFile.name}`
        );
        await uploadBytes(storageRef, newFood.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'foods'), {
        name: newFood.name,
        price: Number(newFood.price),
        description: newFood.description,
        category: newFood.category,
        imageUrl,
        createdBy: user.uid,
        createdAt: new Date()
      });

      setShowAddModal(false);
      setNewFood(emptyFood);
      fetchFoods();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ---------------- EDIT FOOD ---------------- */
  const editFood = async () => {
    if (!editingFood || !user) return;

    try {
      let imageUrl = editingFood.imageUrl || '';

      if (editingFood.imageFile) {
        const storageRef = ref(
          storage,
          `food-images/${user.uid}/${Date.now()}_${editingFood.imageFile.name}`
        );
        await uploadBytes(storageRef, editingFood.imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const { id, imageFile, ...safeData } = editingFood;

      await updateDoc(doc(db, 'foods', id), {
        ...safeData,
        price: Number(safeData.price),
        imageUrl,
        updatedAt: new Date()
      });

      setShowEditModal(false);
      setEditingFood(null);
      fetchFoods();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

  /* ---------------- DELETE FOOD ---------------- */
  const deleteFood = async food => {
    if (!window.confirm(`Delete ${food.name}?`)) return;

    try {
      await deleteDoc(doc(db, 'foods', food.id));
      fetchFoods();
    } catch (error) {
      console.error(error);
      alert(error.message);
    }
  };

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
          <h1>Food Management</h1>
          <p className="text-muted">Manage food items for your hotel</p>
        </Col>
      </Row>

      <Button className="mb-3" onClick={() => setShowAddModal(true)}>
        + Add Food Item
      </Button>

      <Card>
        <Card.Body>
          {foods.length === 0 ? (
            <Alert>No food items found</Alert>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Description</th>
                  <th>Image</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {foods.map(f => (
                  <tr key={f.id}>
                    <td>{f.name}</td>
                    <td>
                      <Badge bg="secondary">{f.category}</Badge>
                    </td>
                    <td>₹{f.price}</td>
                    <td>{f.description}</td>
                    <td>
                      {f.imageUrl ? (
                        <a href={f.imageUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        className="me-2"
                        onClick={() => {
                          setEditingFood(f);
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteFood(f)}
                      >
                        Delete
                      </Button>
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
          <Modal.Title>Add Food Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Control
              className="mb-2"
              placeholder="Food Name"
              value={newFood.name}
              onChange={e =>
                setNewFood({ ...newFood, name: e.target.value })
              }
            />
            <Form.Select
              className="mb-2"
              value={newFood.category}
              onChange={e =>
                setNewFood({ ...newFood, category: e.target.value })
              }
            >
              <option value="">Select Category</option>
              <option>Appetizer</option>
              <option>Main Course</option>
              <option>Dessert</option>
              <option>Beverage</option>
              <option>Snack</option>
            </Form.Select>
            <Form.Control
              type="number"
              className="mb-2"
              placeholder="Price"
              value={newFood.price}
              onChange={e =>
                setNewFood({ ...newFood, price: e.target.value })
              }
            />
            <Form.Control
              as="textarea"
              className="mb-2"
              placeholder="Description"
              value={newFood.description}
              onChange={e =>
                setNewFood({ ...newFood, description: e.target.value })
              }
            />
            <Form.Control
              type="file"
              accept="image/*"
              onChange={e =>
                setNewFood({ ...newFood, imageFile: e.target.files[0] })
              }
            />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={createFood}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* EDIT MODAL */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Food Item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingFood && (
            <Form>
              <Form.Control
                className="mb-2"
                value={editingFood.name}
                onChange={e =>
                  setEditingFood({
                    ...editingFood,
                    name: e.target.value
                  })
                }
              />
              <Form.Select
                className="mb-2"
                value={editingFood.category}
                onChange={e =>
                  setEditingFood({
                    ...editingFood,
                    category: e.target.value
                  })
                }
              >
                <option value="">Select Category</option>
                <option>Appetizer</option>
                <option>Main Course</option>
                <option>Dessert</option>
                <option>Beverage</option>
                <option>Snack</option>
              </Form.Select>
              <Form.Control
                type="number"
                className="mb-2"
                value={editingFood.price}
                onChange={e =>
                  setEditingFood({
                    ...editingFood,
                    price: e.target.value
                  })
                }
              />
              <Form.Control
                as="textarea"
                className="mb-2"
                value={editingFood.description}
                onChange={e =>
                  setEditingFood({
                    ...editingFood,
                    description: e.target.value
                  })
                }
              />
              <Form.Control
                type="file"
                accept="image/*"
                onChange={e =>
                  setEditingFood({
                    ...editingFood,
                    imageFile: e.target.files[0]
                  })
                }
              />
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={editFood}>Update</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default FoodManagement;
