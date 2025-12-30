import React, { useState, useEffect } from 'react';
import { db } from '../../firebase-config';
import { collection, getDocs, addDoc } from 'firebase/firestore';

function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    type: '',
    price: 0
  });

  const roomsCollectionRef = collection(db, 'rooms');

  const createRoom = async () => {
    await addDoc(roomsCollectionRef, newRoom);
    // Refresh rooms list
    const data = await getDocs(roomsCollectionRef);
    setRooms(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    const getRooms = async () => {
      const data = await getDocs(roomsCollectionRef);
      setRooms(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
    };

    getRooms();
  }, [roomsCollectionRef]);

  return (
    <div>
      <h1>Room Management</h1>

      <div>
        <h2>Add Room</h2>
        <input
          placeholder="Room Number"
          onChange={(event) => {
            setNewRoom({ ...newRoom, roomNumber: event.target.value });
          }}
        />
        <input
          placeholder="Type (e.g., Single, Double, Suite)"
          onChange={(event) => {
            setNewRoom({ ...newRoom, type: event.target.value });
          }}
        />
        <input
          type="number"
          placeholder="Price per night"
          onChange={(event) => {
            setNewRoom({ ...newRoom, price: Number(event.target.value) });
          }}
        />
        <button onClick={createRoom}>Add Room</button>
      </div>

      <div>
        <h2>Available Rooms</h2>
        {rooms.map((room) => {
          return (
            <div key={room.id}>
              <h3>Room {room.roomNumber}</h3>
              <p>Type: {room.type}</p>
              <p>Price: ${room.price}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RoomManagement;
