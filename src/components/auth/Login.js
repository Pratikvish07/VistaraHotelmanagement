import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // ✅ FIX
import { auth, db } from '../../firebase-config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function Login() {
  const navigate = useNavigate(); // ✅ FIX

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        const ref = doc(db, 'users', currentUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const role = snap.data().role;
          if (role === 'manager') navigate('/dashboard');
          else navigate('/home');
        }
      }
    });

    return () => unsub();
  }, [navigate]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister) {
        const res = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password.trim()
        );

        await setDoc(doc(db, 'users', res.user.uid), {
          email,
          role: 'employee',
          createdAt: new Date()
        });
      } else {
        await signInWithEmailAndPassword(
          auth,
          email.trim(),
          password.trim()
        );
      }
    } catch (err) {
      console.error(err);
      setError(err.code);
    }
  };

  return (
    <Container fluid className="min-vh-100 d-flex align-items-center bg-light">
      <Row className="w-100 justify-content-center">
        <Col md={4}>
          <Card className="shadow">
            <Card.Body>
              <h4 className="text-center mb-3">
                {isRegister ? 'Create Account' : 'Login'}
              </h4>

              {error && <Alert variant="danger">{error}</Alert>}

              <Form onSubmit={handleAuth}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                <Button type="submit" className="w-100">
                  {isRegister ? 'Register' : 'Login'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Login;
