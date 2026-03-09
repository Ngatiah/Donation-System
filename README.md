# **AI-Driven AI-DRIVEN FOOD SURPLUS DONATION SYSTEM**

## 🌟 Project Purpose

Developed as a core Third Year Collaborative Project at Moi University, FoodBridge addresses the logistical gap in food security. This 2-woman project provides a secure, real-time bridge between businesses with surplus food and charitable organizations, utilizing a decoupled architecture to ensure scalability and data integrity.

---

## 🚀 Technical Achievements

### **1. Secure Token-Based Authentication (Knox)**

Instead of basic session-based login, we implemented **Django Knox**. This provides:

* **Token Hashing:** Storing tokens securely in the database to prevent plain-text leaks.
* **Expiry Management:** Automatic token invalidation for enhanced security.
* **Multi-device Support:** Allowing a user to stay logged in on different platforms simultaneously.

### **2. Decoupled Full-Stack Architecture**

The project is built as a **"Headless" System**:

* **Backend:** A robust REST API built with **Django REST Framework (DRF)**.
* **Frontend:** A high-performance Single Page Application (SPA) built with **React and Vite**.
* **Styling:** Moving beyond Bootstrap, we utilized **Tailwind CSS** for custom, lightweight, and responsive design components.

### **3. Collaborative Logic & Workflow**

* **Git Version Control:** Managed through a collaborative GitHub workflow (Branching, Pull Requests, and Merge resolution).
* **Role-Based Workflows:** Distinct logical paths for Donors and Charities developed through modular component design.

---

## 🏗️ System Workflow

1. **Auth:** User logs in $\rightarrow$ Knox generates a unique hashed token $\rightarrow$ Token is stored in React state.
2. **Submission:** Donor posts a JSON object via a `POST` request to the DRF endpoint.
3. **Discovery:** Charities fetch available donations via a `GET` request, filtered by the backend logic.
4. **Transaction:** A charity "claims" a donation, triggering an atomic database update in PostgreSQL.

---

## 👥 Collaborators

This project was designed and developed by a dedicated 2-woman engineering team:

**Ngatia** ([@Ngatiah](https://www.google.com/search?q=https://github.com/Ngatiah)) — *Backend Architecture, Token Security (Knox), and Database Management.*
**Thuku** ([@peristhuku](https://www.google.com/search?q=https://github.com/peristhuku)) — *Frontend UI/UX Design (React/Tailwind), State Management, and API Integration.*

---

## 🛠️ Installation & Setup

```bash
# 1. Clone the repo
git clone https://github.com/Ngatiah/Donation-System.git

# 2. Backend (Django)
cd server
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 3. Frontend (React/Vite)
cd client
npm install
npm run dev

```
