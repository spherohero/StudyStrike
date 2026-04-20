# StudyStrike
CEN3031 Spring 2026 Team Project

Team: The Commits

- Fiona Chen
- Kalea Thompson
- Parth Patel
- Nicholas Reyes

## Local Setup Instructions

To set up and run the StudyStrike application locally, follow these steps:

### Prerequisites
- Ensure you have Node.js and npm (Node Package Manager) installed on your system.
- You will also need access to the remote PostgreSQL database on AWS.

### 1. Clone the Repository
Clone the StudyStrike repository to your local machine.

### 2. Backend Setup (Server)
1. Open a terminal and navigate to the `server` directory.
2. Run `npm install` to install all necessary backend dependencies (Express, pg, bcryptjs, jsonwebtoken, cookie-parser, dotenv).
3. Create a `.env` file in the `server` directory based on the `.env.example` file.

### 3. Frontend Setup (Client)
1. Open a new terminal and navigate to the `client` directory.
2. Run `npm install` to install all frontend dependencies (React, Vite, Tailwind CSS, React Router).

### 4. Running the Application
1. In the `server` terminal, run `npm run dev` to start the backend server using nodemon for automatic restarts on file changes. The server typically runs on port 3000.
2. In the `client` terminal, run `npm run dev` to start the Vite development server for the frontend.
3. You can verify the database connection by navigating to `http://localhost:3000/api/db-test` in your browser.
4. Set up either a student or teacher account. Done!


Happy Studying!

