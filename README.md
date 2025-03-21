# Near To You

![Near To You Banner](#) 

**Near To You** is a real-time bus tracking application designed to eliminate commuter uncertainty by providing live bus locations and route-based searching. Say goodbye to missed buses and hello to smoother rides!

## 🚀 Problem We’re Solving

Commuters face delays and frustration guessing bus arrival times. We’re here to cut wait times, boost efficiency, and make commuting a breeze for **daily riders, students, transit crews, and tourists**.

## 🔥 Features

- **Live Bus Tracking:** See bus locations on an interactive map in real-time.
- **Route Search:** Filter buses by "from" and "to" locations.
- **Easy Reset:** Clear filters to view all online buses instantly.
- **Responsive Design:** Works seamlessly on desktop and mobile.

---

## 🛠 Technology Stack

### **Frontend**
- ⚛️ React: Dynamic UI
- 🛠 TypeScript: Type-safe code
- 🎨 Tailwind CSS: Responsive styling
- 🗺 Leaflet (react-leaflet): Bus mapping

### **Backend**
- 🐍 Django: Server and data handling
- ⚙️ Python: Backend logic

### **Real-Time**
- 🔗 WebSocket: Live updates (via Django Channels)

### **Database**
- 🗄 PostgreSQL: Bus data storage (SQLite for demo)

### **Tools**
- ⚡ Vite: Fast builds
- ✨ Lucide React: Icons
- 🔔 Sonner: Notifications
- ⏳ date-fns: Time formatting

---

## 📌 Prerequisites

- **Node.js**: v16+ (for frontend)
- **Python**: 3.8+ (for backend)
- **PostgreSQL**: (or SQLite for local demo)
- **Git**: For cloning the repo

---

## ⚡ Setup Instructions

### **1️⃣ Clone the Repository**
```sh
git clone https://github.com/drkTwoTwo/NearToYou.git
cd NearToYou
```

### **2️⃣ Backend Setup**
```sh
# Navigate to backend directory (assuming it’s in /backend)
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up database (update settings.py if using PostgreSQL)
python manage.py migrate

# Run the Django server
python manage.py runserver
```

### **3️⃣ Frontend Setup**
```sh
# Navigate to frontend directory (assuming it’s in /frontend)
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### **4️⃣ WebSocket Configuration**
- Ensure **Django Channels** is configured in `settings.py`, and routing is set up for WebSocket connections.
- Frontend connects via `useWebSocketBuses` hook to `ws://localhost:8000/ws/buses/`.

---

## 🎯 Usage

1. **Open the App** → Visit `http://localhost:5173` (default Vite port).
2. **Track Buses** → View live bus locations on the map and list.
3. **Search Routes** → Enter "From" and "To" locations, hit "Search Routes."
4. **Reset** → Click "Clear" to see all online buses again.

---

## 📂 Project Structure
```
/NearToYou
├── /backend        # Django backend
│   ├── manage.py
│   ├── /app        # Django app (models, views, consumers)
│   └── requirements.txt
├── /frontend       # React frontend
│   ├── /src
│   │   ├── /components  # BusMap, BusList, etc.
│   │   ├── /hooks       # useWebSocketBuses
│   │   └── index.tsx    # Main app
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 👥 Team

- **[Member 1]**: Frontend Wizard - UI & Maps
- **[Member 2]**: Backend Boss - Django & WebSocket
- **[Member 3]**: Design Dynamo - Tailwind & UX
- **[Member 4]**: Data Driver - Database & Tests  
- **Team Name**: BusTrack Innovators  
- **University**: [Your University], Dept. of Computer Science  

---

## 📜 License

This project uses the following open-source licenses:

- **MIT**: React, TypeScript, Tailwind CSS, react-leaflet, Sonner, date-fns, Vite
- **BSD**: Django, Leaflet, Django Channels
- **ISC**: Lucide React

Licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

For a demo project, contributions are limited to the team.  
Feedback is welcome—**open an issue** or **reach out**!

🚀 *Happy Tracking!* 🚍
