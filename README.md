# Event Manager Web App

## Setup Instructions

1. **Install dependencies:**
   ```
   npm install
   ```
2. **Build the database:**
   - On **Windows**:
     ```
     npm run build-db-win
     ```
   - On **Mac/Linux**:
     ```
     npm run build-db
     ```
3. **Start the application:**
   ```
   npm start
   ```
4. **Access the app:**
   Open your browser and go to [http://localhost:3000](http://localhost:3000)

## Additional Libraries Used
- **bcrypt** (for password hashing)
- **express-session** (for session management)
- **ejs** (for server-side templating)
- **sqlite3** (for SQLite database access)
- **express** (web server framework)

## Notes
- To delete the database and start fresh:
  - On **Windows**: `npm run clean-db-win`
  - On **Mac/Linux**: `npm run clean-db`
- Do **not** include the `database.db` file in your submission. It will be generated from `db_schema.sql`.

---
