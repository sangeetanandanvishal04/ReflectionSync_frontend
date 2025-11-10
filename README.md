# ReflectionSync — Frontend (Floor Plan Management System)

**ReflectionSync** is a web-based **Floor Plan Management System** built using **React + TypeScript + Vite**.
It allows users to **upload building floorplans**, **draw rooms and seats**, **manage overlays**, and **create bookings** — all from a modern, responsive interface.

---

## 🚀 Features

### 🔐 Authentication

* User **Signup, Login, Logout** using JWT authentication.
* Complete **password reset flow** with OTP verification.
* Token-based access control for protected routes.
* Role-based navigation (user/admin ready).

### 🗺️ Floor Plan Management

* Upload and view **floorplans** (image/PDF).
* Interactive **Fabric.js-based editor** for creating and managing:

  * Rooms
  * Seats / Desks
* Edit, move, and resize overlays directly on the canvas.
* Save overlays to backend and reload on revisit.

### 📅 Room Bookings

* Search and view **available rooms** for a given time period and capacity.
* Book rooms and manage upcoming bookings.
* Integrated conflict-checking with backend logic.
* Clean and modern UI for seamless scheduling and visualization.

### 🧠 Additional Highlights

* Responsive and minimal UI design (pure CSS, no external frameworks).
* Modular folder structure for scalability.
* Centralized Axios configuration with JWT interceptor.
* Type-safe implementation using TypeScript.

---

## 🧩 Tech Stack

| Layer                  | Technology                           |
| :--------------------- | :----------------------------------- |
| **Frontend Framework** | React (with Vite + TypeScript)       |
| **State Management**   | React Context (AuthProvider)         |
| **UI Styling**         | Custom CSS (no Tailwind)             |
| **Canvas Editor**      | Fabric.js                            |
| **HTTP Client**        | Axios with interceptors              |
| **Routing**            | React Router v6                      |
| **Backend (API)**      | FastAPI (Python) *(for integration)* |

---

## ⚙️ Setup & Run

### Prerequisites

* **Node.js 18+**
* **npm 10+**

### Installation

```bash
# Clone repo and install dependencies
npm install
```

### Start development server

```bash
npm run dev
```

Visit the app at **[http://localhost:5173](http://localhost:5173)**

### Build for production

```bash
npm run build
npm run preview
```

---

## 🔧 Environment Variables

Create a `.env` file in the project root:

```
VITE_API_BASE=http://localhost:8000
```

This defines the backend base URL for API requests.
If not set, the app defaults to `http://localhost:8000`.

---

## 🖊️ Floorplan Editor Notes (Fabric.js)

* The editor supports:

  * Adding and editing **rectangular overlays** for rooms or seats.
  * Scaling and moving objects directly on the canvas.
  * Saving overlays to backend via `/floorplans/{id}/save`.
  * Each shape displays a visible label for easy identification.

* Technical Notes:

  * Canvas element id: `fp-canvas`.
  * Background image auto-scales to fit container.
  * TypeScript is configured to allow flexible Fabric.js usage (`any` typing where necessary).

---

## 📆 Bookings Page Overview

* **Search Available Rooms** by start time, end time, and minimum capacity.
* **Book Room** with start and end times (connected to backend `/bookings` APIs).
* **View Your Bookings** — upcoming or recent bookings listed with details.
* Clean interface with responsive layout for easy demonstration.

---

## 🔐 Authentication Flow

1. **Signup:** `POST /auth/signup`
2. **Login:** `POST /auth/login` → stores JWT token
3. **Forgot Password:** `POST /auth/forgot-password/{email}`
4. **OTP Verification:** `POST /auth/otp-verification`
5. **Reset Password:** `POST /auth/reset-password`
6. **Protected Routes:** Token is validated from local storage before navigation.

---

## 💡 Future Improvements

* Add floorplan versioning and history tracking.
* Support polygonal / custom-shaped overlays.
* Implement live collaboration (real-time updates).
* Add analytics dashboard for room utilization.
* Enhance booking calendar view (weekly/monthly).
* Add notifications and approval workflows.

---

## ⚙️ Backend API Summary

| Endpoint                        | Method   | Description               |
| ------------------------------- | -------- | ------------------------- |
| `/auth/signup`                  | POST     | Create new user           |
| `/auth/login`                   | POST     | Login and get JWT         |
| `/auth/forgot-password/{email}` | POST     | Send OTP                  |
| `/auth/otp-verification`        | POST     | Verify OTP                |
| `/auth/reset-password`          | POST     | Reset password            |
| `/floorplans`                   | GET/POST | List or upload floorplans |
| `/floorplans/{id}/save`         | PUT      | Save overlays             |
| `/bookings/available`           | GET      | Get available rooms       |
| `/bookings`                     | POST     | Create booking            |
| `/bookings/{id}`                | GET      | Fetch booking by ID       |

---

## 🧰 Troubleshooting

* **White screen after login:** Ensure backend CORS allows `http://localhost:5173`.
* **Fabric.js types:** Use `npm i --save-dev @types/fabric` or rely on included type declarations.
* **Token issues:** Clear localStorage or re-login to refresh expired JWT.