# Smart Flashcard 🧠

Smart Flashcard is an ultra-premium, AI-powered study tool that helps you instantly turn long paragraphs of text, definitions, and articles into study-ready, interactive flashcard decks. 

Designed with a sleek dark-themed UI, it features a robust natural language processing (NLP) engine on the backend to dynamically parse notes and generate highly relevant questions.

---

## Key Features

- **Double-Strategy NLP Engine**: 
  - **Definition Extraction**: Automatically detects formal definitions (e.g. phrases containing *is defined as*, *means*, *refers to*) to create precise term-definition cards.
  - **Cloze Deletion (Fill-in-the-blank)**: Extracts key noun phrases from complex sentences and blanks them out to test your factual recall.
- **Dynamic Randomization**: Generates fresh questions and varies the blanked-out key terms even when pasting the same text notes multiple times.
- **Sleek 3D Card Reviewer**: Study your decks with smooth 3D flipping animation cards and rate your recall ("Known" vs. "Not Known").
- **Real-Time Dashboard & Retention Tracking**: Tracks your study progress, total reviewed cards, active streaks, and individual deck retention rates in real-time.
- **Deck & Card Customization**: Delete unwanted individual cards during generation or review, and delete entire sets directly from the dashboard.

---

## Technology Stack

- **Frontend**: React (TypeScript), Vite, Tailwind CSS / Vanilla CSS, Framer Motion (for animations), Lucide React (icons), Axios.
- **Backend**: Flask (Python 3.14 compatible, no Rust/C compiled extensions required), NLTK (Natural Language Toolkit for POS tagging and parsing), PyMongo.
- **Database**: MongoDB (Atlas or Local).

---

## Getting Started

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- MongoDB Atlas cluster or a local MongoDB database

---

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend/` directory with the following variables:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key
   ```
5. Run the Flask development server:
   ```bash
   python3 main.py
   ```
   *The backend will run on `http://localhost:8000`.*

---

### 3. Frontend Setup
1. Navigate to the root directory.
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173` and automatically proxy API requests to the Flask server.*

---

## Project Structure

```
├── backend/
│   ├── main.py            # Flask server & NLP pipeline (tokenizer, parser, stats, routes)
│   ├── requirements.txt   # Python dependencies (Flask, PyMongo, NLTK, PyJWT, Passlib)
│   └── .env               # Backend environment secrets (MongoDB URI, JWT Secret)
├── src/
│   ├── app/
│   │   └── App.tsx        # Monolithic React UI (Dashboard, Generator, Review UI, Stats)
│   ├── lib/
│   │   └── api.ts         # Axios client configuration with JWT middleware
│   └── styles/
│       └── index.css      # Custom styling tokens and global rules
├── index.html             # Application entry point & title setup
└── package.json           # Frontend scripts and dependencies
```