# MERN Codeforces Duels

## Overview
MERN Codeforces Duels is a web application that allows users to create accounts, add friends, sync their Codeforces IDs, and compete in programming duels. Users can challenge their friends to solve randomly selected unsolved Codeforces questions within a specified rating range.

## Features
- User registration and authentication
- Friend management (add/remove friends)
- Sync Codeforces ID after verification
- Create and accept duel challenges
- Fetch unsolved Codeforces problems based on user ratings

## Tech Stack
- **Frontend**: React, Axios
- **Backend**: Node.js, Express, MongoDB
- **Database**: MongoDB

## Project Structure
```
mern-codeforces-duels
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── models
│   │   ├── routes
│   │   ├── services
│   │   ├── middleware
│   │   └── app.js
│   ├── package.json
│   └── README.md
├── frontend
│   ├── public
│   │   └── index.html
│   ├── src
│   │   ├── assets
│   │   │   └── images
│   │   ├── components
│   │   │   ├── Auth
│   │   │   ├── Duels
│   │   │   ├── Friends
│   │   │   ├── Layout
│   │   │   └── Profile
│   │   ├── css
│   │   │   └── index.css
│   │   ├── pages
│   │   ├── utils
│   │   ├── App.jsx
│   │   └── index.js
│   ├── package.json
│   └── README.md
└── README.md
```

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd mern-codeforces-duels
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```
   cd frontend
   npm install
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Start the frontend application:
   ```
   cd frontend
   npm start
   ```

### Usage
- Navigate to `http://localhost:3000` to access the application.
- Register a new account or log in to an existing account.
- Add friends and sync your Codeforces ID.
- Challenge friends to duels based on unsolved problems.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License.