PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Recreate the users table with hashed passwords
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    password_hash TEXT NOT NULL
);

-- Create an events table
CREATE TABLE IF NOT EXISTS events (
  event_id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  full_price_tickets INTEGER,
  full_price REAL,
  concession_tickets INTEGER,
  concession_price REAL,
  vip_tickets INTEGER,
  vip_price REAL,
  is_published INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  published_at TEXT,
  last_modified TEXT,
  organiser_name TEXT
);

-- Create a bookings table
CREATE TABLE IF NOT EXISTS bookings (
  booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  attendee_name TEXT NOT NULL,
  full_qty INTEGER DEFAULT 0,
  concession_qty INTEGER DEFAULT 0,
  vip_qty INTEGER DEFAULT 0,
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Create a settings table
CREATE TABLE IF NOT EXISTS settings (
  setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER,
  site_name TEXT,
  site_description TEXT,
  FOREIGN KEY (event_id) REFERENCES events(event_id)
);

-- Insert real users with bcrypt-hashed passwords
INSERT INTO users (user_name, password_hash) VALUES 
  ('john', '$2b$10$/xSw5iUzjYn4tFUBBpAwBOjyNyzvx0c8PsTLcsePQ/xiy5.LzjzES'), -- john1
  ('alice', '$2b$10$YQg7k8NCE1pJvU7AXMf2lOzng61JM9bTK.d0P6vHi0xKLhOhFBR2m'), -- alice2
  ('tom', '$2b$10$0qW1zSrsMNXRSNnPu9x7/.XzK/GylRylL4r7e7FMetwLueu8x9m/m');   -- tom3

COMMIT;
