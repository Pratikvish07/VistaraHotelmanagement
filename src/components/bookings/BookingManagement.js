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

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [user, setUser] = useState(null);

  const [newBooking, setNewBooking] = useState({
    guestAadhaar: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: ''
  });

  // 🔐 Wait for Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // 📥 Fetch bookings (user-wise)
  useEffect(() => {
    if (!user) return;

    const getBookings = async () => {
      const q = query(
        collection(db, 'bookings'),
        where('createdBy', '==', user.uid)
      );

      const data = await getDocs(q);
      setBookings(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };

    getBookings();
  }, [user]);

  // ➕ Create booking (AUTO CREATES COLLECTION)
  const createBooking = async () => {
    if (!user) return alert('Not authenticated');

    await addDoc(collection(db, 'bookings'), {
      ...newBooking,
      createdBy: user.uid,          // 🔑 REQUIRED
      createdAt: new Date()
    });

    // refresh list
    const q = query(
      collection(db, 'bookings'),
      where('createdBy', '==', user.uid)
    );

    const data = await getDocs(q);
    setBookings(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));

    // reset form
    setNewBooking({
      guestAadhaar: '',
      roomNumber: '',
      checkInDate: '',
      checkOutDate: ''
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Booking Management</h1>

      {/* ➕ Create Booking */}
      <div style={{ marginBottom: '30px' }}>
        <h3>Create Booking</h3>

        <input
          placeholder="Guest Aadhaar"
          value={newBooking.guestAadhaar}
          onChange={(e) =>
            setNewBooking({ ...newBooking, guestAadhaar: e.target.value })
          }
        />

        <input
          placeholder="Room Number"
          value={newBooking.roomNumber}
          onChange={(e) =>
            setNewBooking({ ...newBooking, roomNumber: e.target.value })
          }
        />

        <input
          type="date"
          value={newBooking.checkInDate}
          onChange={(e) =>
            setNewBooking({ ...newBooking, checkInDate: e.target.value })
          }
        />

        <input
          type="date"
          value={newBooking.checkOutDate}
          onChange={(e) =>
            setNewBooking({ ...newBooking, checkOutDate: e.target.value })
          }
        />

        <br />
        <button onClick={createBooking}>Create Booking</button>
      </div>

      {/* 📋 Booking List */}
      <h3>Current Bookings</h3>

      {bookings.length === 0 && <p>No bookings found</p>}

      {bookings.map((booking) => (
        <div key={booking.id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
          <p><strong>Aadhaar:</strong> {booking.guestAadhaar}</p>
          <p><strong>Room:</strong> {booking.roomNumber}</p>
          <p><strong>Check-in:</strong> {booking.checkInDate}</p>
          <p><strong>Check-out:</strong> {booking.checkOutDate}</p>
        </div>
      ))}
    </div>
  );
}

export default BookingManagement;
