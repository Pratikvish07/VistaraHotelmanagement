import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { auth } from '../../firebase-config';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

function Login() {
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  auth.onAuthStateChanged(setUser);

  const register = useCallback(async () => {
    try {
      setError("");
      const user = await createUserWithEmailAndPassword(
        auth,
        registerEmail,
        registerPassword
      );
      console.log(user);
    } catch (error) {
      setError(error.message);
    }
  }, [registerEmail, registerPassword]);

  const login = useCallback(async () => {
    try {
      setError("");
      const user = await signInWithEmailAndPassword(
        auth,
        loginEmail,
        loginPassword
      );
      console.log(user);
    } catch (error) {
      setError(error.message);
    }
  }, [loginEmail, loginPassword]);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          {user ? (
            <Card>
              <Card.Body className="text-center">
                <Card.Title>Welcome, {user.email}</Card.Title>
                <Button variant="danger" onClick={logout}>Sign Out</Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              <Row>
                <Col md={6}>
                  <Card className="mb-4">
                    <Card.Header>
                      <Card.Title>Register User</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Email..."
                            value={registerEmail}
                            onChange={(e) => setRegisterEmail(e.target.value)}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Password..."
                            value={registerPassword}
                            onChange={(e) => setRegisterPassword(e.target.value)}
                          />
                        </Form.Group>
                        <Button variant="primary" onClick={register} className="w-100">
                          Create User
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <Card.Title>Login</Card.Title>
                    </Card.Header>
                    <Card.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="Email..."
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            placeholder="Password..."
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                          />
                        </Form.Group>
                        <Button variant="success" onClick={login} className="w-100">
                          Login
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
