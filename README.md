# NEXORA AI – Intelligent Document & Resume Analyzer

An AI-powered document intelligence platform built using the MERN stack. NEXORA AI helps users upload documents, interact with their content, generate summaries, and analyze resumes with actionable insights.

## 🚀 Features

- **User Authentication** – Secure registration and login using JWT authentication.
- **Document Management** – Upload, view, and delete PDF documents.
- **AI Document Assistant** – Ask questions and get answers based on uploaded documents.
- **AI Summary Generator** – Generate concise summaries of document content.
- **Resume Analyzer** – Analyze resumes based on skills, experience, and job-role relevance.
- **Resume Insights** – View resume scores, strengths, missing skills, and improvement suggestions.
- **PDF Report Generation** – Download resume analysis reports.

## 🛠️ Tech Stack

**Frontend**
- React.js
- JavaScript
- HTML5
- CSS3
- Vite

**Backend**
- Node.js
- Express.js
- REST API
- JWT Authentication
- bcryptjs

**Database**
- MongoDB
- Mongoose

## 📁 Project Structure

```text
NEXORA-AI/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
│
└── README.md
```

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Siva-varshu-28/NEXORA-AI.git
cd NEXORA-AI
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Configure your environment variables in a `.env` file according to your backend configuration.

Start the backend:

```bash
node server.js
```

Backend URL:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal:

```bash
cd NEXORA-AI/frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## 🔐 Security

- JWT-based authentication.
- Password hashing using bcryptjs.
- Environment variables for sensitive configuration.
- Protected API routes.

**Note:** Never upload `.env` files, API keys, passwords, or personal documents to GitHub.

## 🎯 Project Objective

To simplify document management and resume evaluation through AI-powered assistance, helping users understand their documents and identify opportunities for improvement.

## 👩‍💻 Developer

**Varshini M**

B.Sc. Computer Science | AI-Powered Full Stack Development (MERN)

---

⭐ If you find this project useful, consider giving it a star!
