import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function BookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [newBooking, setNewBooking] = useState({
    guestAadhaar: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: ''
  });

  const bookingsCollectionRef = collection(db, 'bookings');

  const createBooking = async () => {
    await addDoc(bookingsCollectionRef, newBooking);
    // Refresh bookings list
    const data = await getDocs(bookingsCollectionRef);
    setBookings(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    const getBookings = async () => {
      const data = await getDocs(bookingsCollectionRef);
      setBookings(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };

    getBookings();
  }, [bookingsCollectionRef]);

  return (
    <div>
      <h1>Booking Management</h1>

      <div>
        <h2>Create Booking</h2>
        <input
          placeholder="Guest Aadhaar"
          onChange={(event) => {
            setNewBooking({ ...newBooking, guestAadhaar: event.target.value });
          }}
        />
        <input
          placeholder="Room Number"
          onChange={(event) => {
            setNewBooking({ ...newBooking, roomNumber: event.target.value });
          }}
        />
        <input
          type="date"
          placeholder="Check-in Date"
          onChange={(event) => {
            setNewBooking({ ...newBooking, checkInDate: event.target.value });
          }}
        />
        <input
          type="date"
          placeholder="Check-out Date"
          onChange={(event) => {
            setNewBooking({ ...newBooking, checkOutDate: event.target.value });
          }}
        />
        <button onClick={createBooking}>Create Booking</button>
      </div>

      <div>
        <h2>Current Bookings</h2>
        {bookings.map((booking) => {
          return (
            <div key={booking.id}>
              <h3>Guest Aadhaar: {booking.guestAadhaar}</h3>
              <p>Room Number: {booking.roomNumber}</p>
              <p>Check-in: {booking.checkInDate}</p>
              <p>Check-out: {booking.checkOutDate}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BookingManagement;
