import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    aadhaar: '',
    mobile: '',
    email: ''
  });

  const customersCollectionRef = collection(db, 'customers');

  const createCustomer = async () => {
    await addDoc(customersCollectionRef, newCustomer);
    // Refresh customers list
    const data = await getDocs(customersCollectionRef);
    setCustomers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    const getCustomers = async () => {
      const data = await getDocs(customersCollectionRef);
      setCustomers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };

    getCustomers();
  }, [customersCollectionRef]);

  return (
    <div>
      <h1>Customer Management</h1>

      <div>
        <h2>Add Customer</h2>
        <input
          placeholder="Name"
          onChange={(event) => {
            setNewCustomer({ ...newCustomer, name: event.target.value });
          }}
        />
        <input
          placeholder="Aadhaar Number"
          onChange={(event) => {
            setNewCustomer({ ...newCustomer, aadhaar: event.target.value });
          }}
        />
        <input
          placeholder="Mobile Number"
          onChange={(event) => {
            setNewCustomer({ ...newCustomer, mobile: event.target.value });
          }}
        />
        <input
          placeholder="Email"
          onChange={(event) => {
            setNewCustomer({ ...newCustomer, email: event.target.value });
          }}
        />
        <button onClick={createCustomer}>Add Customer</button>
      </div>

      <div>
        <h2>Registered Customers</h2>
        {customers.map((customer) => {
          return (
            <div key={customer.id}>
              <h3>{customer.name}</h3>
              <p>Aadhaar: {customer.aadhaar}</p>
              <p>Mobile: {customer.mobile}</p>
              <p>Email: {customer.email}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CustomerManagement;
