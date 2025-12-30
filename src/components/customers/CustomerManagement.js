import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase-config';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [user, setUser] = useState(null);

  const [newCustomer, setNewCustomer] = useState({
    name: '',
    aadhaar: '',
    mobile: '',
    email: ''
  });

  // 🔐 Wait for auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // 📥 Fetch customers (user-wise)
  useEffect(() => {
    if (!user) return;

    const fetchCustomers = async () => {
      const q = query(
        collection(db, 'customers'),
        where('createdBy', '==', user.uid)
      );

      const snapshot = await getDocs(q);
      setCustomers(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    };

    fetchCustomers();
  }, [user]);

  // ➕ Create customer (AUTO CREATES COLLECTION)
  const createCustomer = async () => {
    if (!user) return alert('Not authenticated');

    await addDoc(collection(db, 'customers'), {
      ...newCustomer,
      createdBy: user.uid,      // 🔑 REQUIRED
      createdAt: new Date()
    });

    // Refresh list
    const q = query(
      collection(db, 'customers'),
      where('createdBy', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    setCustomers(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })));

    // Reset form
    setNewCustomer({
      name: '',
      aadhaar: '',
      mobile: '',
      email: ''
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Customer Management</h1>

      {/* ➕ Add Customer */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Add Customer</h3>

        <input
          placeholder="Name"
          value={newCustomer.name}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, name: e.target.value })
          }
        />

        <input
          placeholder="Aadhaar Number"
          value={newCustomer.aadhaar}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, aadhaar: e.target.value })
          }
        />

        <input
          placeholder="Mobile Number"
          value={newCustomer.mobile}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, mobile: e.target.value })
          }
        />

        <input
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, email: e.target.value })
          }
        />

        <br />
        <button onClick={createCustomer}>Add Customer</button>
      </div>

      {/* 📋 Customer List */}
      <h3>Registered Customers</h3>

      {customers.length === 0 && <p>No customers found</p>}

      {customers.map((customer) => (
        <div
          key={customer.id}
          style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}
        >
          <p><strong>Name:</strong> {customer.name}</p>
          <p><strong>Aadhaar:</strong> {customer.aadhaar}</p>
          <p><strong>Mobile:</strong> {customer.mobile}</p>
          <p><strong>Email:</strong> {customer.email}</p>
        </div>
      ))}
    </div>
  );
}

export default CustomerManagement;