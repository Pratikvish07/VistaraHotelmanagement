const { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion, onSnapshot } = require("firebase/firestore");
const firebaseConfig = require('./firebase-config.js');

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const tabs = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const aadhaarInput = document.getElementById('aadhaar');
const fetchButton = document.getElementById('fetch-details');
const guestForm = document.getElementById('guest-form');
const fullNameInput = document.getElementById('fullName');
const mobileInput = document.getElementById('mobile');
const emailInput = document.getElementById('email');
const addressInput = document.getElementById('address');
const previousStaysList = document.getElementById('previous-stays-list');
const roomContainer = document.getElementById('room-container');
const foodDrinkForm = document.getElementById('food-drink-form');
const itemNameInput = document.getElementById('item-name');
const itemPriceInput = document.getElementById('item-price');
const orderedItemsList = document.getElementById('ordered-items-list');
const housekeepingContainer = document.getElementById('housekeeping-container');
const generateInvoiceButton = document.getElementById('generate-invoice');
const invoiceContainer = document.getElementById('invoice-container');
const invoiceContent = document.getElementById('invoice-content');
const printInvoiceButton = document.getElementById('print-invoice');
const generateOccupancyReportButton = document.getElementById('generate-occupancy-report');
const reportContainer = document.getElementById('report-container');
const loadingIndicator = document.getElementById('loading-indicator');
const successIndicator = document.getElementById('success-indicator');
const errorMessage = document.getElementById('error-message');

// App State
let rooms = [];
let housekeepingTasks = [];
let orderedItems = [];
let selectedRoom = null;
let occupancyChart = null;
let revenueChart = null;

// Tabbed UI
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        tabContents.forEach(c => c.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
    });
});

// Real-time Listeners
onSnapshot(doc(db, 'hotel', 'rooms'), (doc) => {
    rooms = doc.data().rooms;
    displayRooms();
    updateDashboardCharts();
});

onSnapshot(doc(db, 'hotel', 'housekeeping'), (doc) => {
    housekeepingTasks = doc.data().tasks;
    displayHousekeepingTasks();
});

// Guest Management
fetchButton.addEventListener('click', async () => {
    // ... (same as before)
});

guestForm.addEventListener('submit', async (e) => {
    // ... (same as before)
});

// Room Management
function displayRooms() {
    roomContainer.innerHTML = '';
    rooms.forEach(room => {
        const roomDiv = document.createElement('div');
        roomDiv.className = `room ${room.status}`;
        roomDiv.innerHTML = `Room ${room.id}<br><small>${room.status}</small>`;
        roomDiv.addEventListener('click', () => handleRoomAction(room));
        roomContainer.appendChild(roomDiv);
    });
}

async function handleRoomAction(room) {
    const aadhaar = aadhaarInput.value.trim();
    if (!aadhaar && (room.status === 'vacant' || room.status === 'cleaned')) {
        showError('Please enter a guest\'s Aadhaar number to check them in.');
        return;
    }

    switch (room.status) {
        case 'vacant':
        case 'cleaned':
            // Check-in
            room.status = 'occupied';
            room.guestAadhaar = aadhaar;
            await updateRooms();
            showSuccess(`Guest checked into Room ${room.id}`);
            break;
        case 'occupied':
            if (room.guestAadhaar === aadhaar) {
                // Check-out
                room.status = 'pending'; // Housekeeping status
                delete room.guestAadhaar;
                await updateRooms();
                await createHousekeepingTask(room.id);
                showSuccess(`Guest checked out from Room ${room.id}. Cleaning task created.`);
            } else {
                showError('This room is occupied by another guest.');
            }
            break;
    }
}

async function updateRooms() {
    await setDoc(doc(db, 'hotel', 'rooms'), { rooms });
}

// Housekeeping
function displayHousekeepingTasks() {
    housekeepingContainer.innerHTML = '';
    housekeepingTasks.forEach(task => {
        const taskDiv = document.createElement('div');
        taskDiv.className = `housekeeping-task ${task.status}`;
        taskDiv.innerHTML = `Room ${task.roomId}<br><small>${task.status}</small>`;
        taskDiv.addEventListener('click', () => handleHousekeepingAction(task));
        housekeepingContainer.appendChild(taskDiv);
    });
}

async function handleHousekeepingAction(task) {
    switch (task.status) {
        case 'pending':
            task.status = 'in-progress';
            await updateHousekeepingTasks();
            showSuccess(`Room ${task.roomId} cleaning is in progress.`);
            break;
        case 'in-progress':
            task.status = 'cleaned';
            await updateHousekeepingTasks();

            const room = rooms.find(r => r.id === task.roomId);
            if (room) {
                room.status = 'vacant';
                await updateRooms();
                showSuccess(`Room ${task.roomId} is now clean and vacant.`);
            }
            break;
        case 'cleaned':
            showSuccess(`Room ${task.roomId} is already clean.`);
            break;
    }
}

async function createHousekeepingTask(roomId) {
    const taskExists = housekeepingTasks.some(t => t.roomId === roomId && t.status !== 'cleaned');
    if (!taskExists) {
        housekeepingTasks.push({ roomId, status: 'pending' });
        await updateHousekeepingTasks();
    }
}

async function updateHousekeepingTasks() {
    await setDoc(doc(db, 'hotel', 'housekeeping'), { tasks: housekeepingTasks });
}

// Dashboard
function initializeDashboard() {
    const occupancyCtx = document.getElementById('occupancy-chart').getContext('2d');
    occupancyChart = new Chart(occupancyCtx, {
        type: 'pie',
        data: { labels: [], datasets: [{ data: [] }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Room Occupancy' } } }
    });

    const revenueCtx = document.getElementById('revenue-chart').getContext('2d');
    revenueChart = new Chart(revenueCtx, {
        type: 'bar',
        data: { labels: [], datasets: [{ label: 'Monthly Revenue', data: [] }] },
        options: { responsive: true, plugins: { title: { display: true, text: 'Revenue' } } }
    });

    updateDashboardCharts();
}

function updateDashboardCharts() {
    // Occupancy Chart
    const occupancyData = rooms.reduce((acc, room) => {
        acc[room.status] = (acc[room.status] || 0) + 1;
        return acc;
    }, {});
    occupancyChart.data.labels = Object.keys(occupancyData);
    occupancyChart.data.datasets[0].data = Object.values(occupancyData);
    occupancyChart.update();

    // Dummy Revenue Chart Data
    const revenueData = [50000, 75000, 60000, 90000, 120000, 110000];
    const revenueLabels = ['January', 'February', 'March', 'April', 'May', 'June'];
    revenueChart.data.labels = revenueLabels;
    revenueChart.data.datasets[0].data = revenueData;
    revenueChart.update();
}


// Reporting
generateOccupancyReportButton.addEventListener('click', () => {
    reportContainer.innerHTML = '<h3>Occupancy Report</h3>';
    const table = document.createElement('table');
    table.innerHTML = `
        <thead>
            <tr>
                <th>Room ID</th>
                <th>Status</th>
                <th>Guest Aadhaar</th>
            </tr>
        </thead>
        <tbody>
            ${rooms.map(room => `
                <tr>
                    <td>${room.id}</td>
                    <td>${room.status}</td>
                    <td>${room.guestAadhaar || 'N/A'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    reportContainer.appendChild(table);
});


// Utility Functions (showLoading, showSuccess, showError)
// ... (same as before)

// Initial Load
function initializeApp() {
    initializeDashboard();
    // Other initializations can go here
}

initializeApp();