const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

const users = {
  john: "$2b$10$/xSw5iUzjYn4tFUBBpAwBOjyNyzvx0c8PsTLcsePQ/xiy5.LzjzES", // "john1"
  alice: "$2b$10$YQg7k8NCE1pJvU7AXMf2lOzng61JM9bTK.d0P6vHi0xKLhOhFBR2m", // "alice2"
  tom: "$2b$10$0qW1zSrsMNXRSNnPu9x7/.XzK/GylRylL4r7e7FMetwLueu8x9m/m"   // "tom3"
};

// OWN CODE
// This route renders the organiser login page
// Demonstrates routing and templating
router.get("/login", (req, res) => {
  res.render("organiser-login.ejs", { error: null });
});
// END OF OWN CODE

// OWN CODE
// This route handles organiser login form submission
// It checks credentials, sets session variables, and redirects on success
// Demonstrates form handling, POST method, session management, and authentication
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const hashed = users[username];
  if (!hashed) return res.render("organiser-login.ejs", { error: "Username not found." });
  const match = await bcrypt.compare(password, hashed);
  if (match) {
    req.session.isOrganiser = true;
    req.session.organiserName = username;
    res.redirect("/organiser/home");
  } else {
    res.render("organiser-login.ejs", { error: "Incorrect password." });
  }
});
// END OF OWN CODE

// OWN CODE
// Middleware to require organiser login for protected routes
// Demonstrates middleware and separation of concerns
function requireLogin(req, res, next) {
  if (req.session && req.session.isOrganiser) next();
  else res.redirect("/organiser/login");
}
// END OF OWN CODE

// OWN CODE
// Middleware to protect organiser routes except login/logout
// Demonstrates routing and middleware
router.use((req, res, next) => {
  const openRoutes = ["/login", "/logout"];
  if (openRoutes.includes(req.path) || (req.method === "POST" && req.path === "/login")) {
    return next();
  }
  return requireLogin(req, res, next);
});
// END OF OWN CODE

// OWN CODE
// This route handles organiser logout and session destruction
// Demonstrates session management and routing 
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.send("Logout failed.");
    res.clearCookie("connect.sid", { path: "/" });
    res.redirect("/"); // Redirect to home.ejs instead of organiser-login.ejs
  });
});
// END OF OWN CODE

// OWN CODE
// This route renders the organiser home page with all events for the organiser
// Demonstrates routing, SQL querying, and templating
router.get("/home", (req, res, next) => {
  const username = req.session.organiserName;
  global.db.all("SELECT * FROM events WHERE organiser_name = ?", [username], (err, events) => {
    if (err) return next(err);
    res.render("organiser-home.ejs", { events, organiserName: username });
  });
});
// END OF OWN CODE

// OWN CODE
// This route renders the event creation page for organisers
// Demonstrates routing and templating
router.get("/create", (req, res) => {
  res.render("organiser-create.ejs", { organiserName: req.session.organiserName });
});
// END OF OWN CODE

// OWN CODE
// This route handles event creation form submission
// Demonstrates form handling, POST method, SQL insert, and data validation
router.post("/create", (req, res, next) => {
  const {
    title, description, date,
    full_price_tickets, full_price,
    concession_tickets, concession_price,
    vip_tickets, vip_price
  } = req.body;

  const query = `
    INSERT INTO events 
    (title, description, date, 
     full_price_tickets, full_price,
     concession_tickets, concession_price,
     vip_tickets, vip_price,
     organiser_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    title, description, date,
    full_price_tickets, full_price,
    concession_tickets, concession_price,
    vip_tickets, vip_price,
    req.session.organiserName
  ];

  global.db.run(query, params, function (err) {
    if (err) return next(err);
    res.redirect("/organiser/home");
  });
});
// END OF OWN CODE

// OWN CODE
// This route renders the event edit page for organisers
// Demonstrates routing, SQL querying, and templating 
router.get("/edit/:id", (req, res, next) => {
  const query = "SELECT * FROM events WHERE event_id = ? AND organiser_name = ?";
  global.db.get(query, [req.params.id, req.session.organiserName], (err, row) => {
    if (err) return next(err);
    if (!row) return res.send("Unauthorized or event not found.");
    res.render("organiser-edit.ejs", { event: row, organiserName: req.session.organiserName });
  });
});
// END OF OWN CODE

// OWN CODE
// This route handles event edit form submission
// Demonstrates form handling, POST method, SQL update, and data validation
router.post("/edit/:id", (req, res, next) => {
  const eventId = req.params.id;
  const username = req.session.organiserName;

  global.db.get("SELECT * FROM events WHERE event_id = ? AND organiser_name = ?", [eventId, username], (err, event) => {
    if (err || !event) return res.send("Unauthorized update.");

    const {
      title, description, date,
      full_price_tickets, full_price,
      concession_tickets, concession_price,
      vip_tickets, vip_price
    } = req.body;

    const query = `
      UPDATE events
      SET title = ?, description = ?, date = ?, 
          full_price_tickets = ?, full_price = ?, 
          concession_tickets = ?, concession_price = ?, 
          vip_tickets = ?, vip_price = ?, last_modified = datetime('now')
      WHERE event_id = ?
    `;

    const params = [
      title, description, date,
      full_price_tickets, full_price,
      concession_tickets, concession_price,
      vip_tickets, vip_price,
      eventId
    ];

    global.db.run(query, params, function (err2) {
      if (err2) return next(err2);
      res.redirect("/organiser/home");
    });
  });
});
// END OF OWN CODE

// OWN CODE
// This route handles event publishing
// Demonstrates form handling, POST method, SQL update, and data validation
router.post("/publish/:id", (req, res, next) => {
  const eventId = req.params.id;
  const username = req.session.organiserName;

  global.db.get("SELECT * FROM events WHERE event_id = ? AND organiser_name = ?", [eventId, username], (err, event) => {
    if (err || !event) return res.send("Unauthorized publish.");

    const query = `
      UPDATE events 
      SET is_published = 1, published_at = datetime('now')
      WHERE event_id = ?
    `;
    global.db.run(query, [eventId], (err2) => {
      if (err2) return next(err2);
      res.redirect("/organiser/home");
    });
  });
});
// END OF OWN CODE

// OWN CODE
// This route renders the organiser settings page
// Demonstrates routing, SQL querying, and templating
router.get("/settings", (req, res, next) => {
  const username = req.session.organiserName;

  global.db.all("SELECT event_id, title FROM events WHERE organiser_name = ?", [username], (err, events) => {
    if (err) return next(err);

    const eventId = req.query.event_id;
    if (eventId) {
      global.db.get("SELECT * FROM settings WHERE event_id = ?", [eventId], (err2, settings) => {
        if (err2) return next(err2);
        res.render("organiser-settings.ejs", {
          events,
          selectedEventId: eventId,
          settings: settings || {},
          organiserName: username
        });
      });
    } else {
      res.render("organiser-settings.ejs", {
        events,
        selectedEventId: null,
        settings: {},
        organiserName: username
      });
    }
  });
});
// END OF OWN CODE

// OWN CODE
// This route handles settings form submission for organisers
// Demonstrates form handling, POST method, SQL update, and data validation
router.post("/settings", (req, res, next) => {
  const { event_id, site_name, site_description } = req.body;

  global.db.run(
    "UPDATE settings SET site_name = ?, site_description = ? WHERE event_id = ?",
    [site_name, site_description, event_id],
    function (err) {
      if (err) return next(err);

      if (this.changes === 0) {
        global.db.run(
          "INSERT INTO settings (event_id, site_name, site_description) VALUES (?, ?, ?)",
          [event_id, site_name, site_description],
          (err2) => {
            if (err2) return next(err2);
            res.redirect("/organiser/settings");
          }
        );
      } else {
        res.redirect("/organiser/settings");
      }
    }
  );
});
// END OF OWN CODE

// OWN CODE
// This route displays all bookings for a specific event
// Demonstrates routing, SQL querying, and templating
router.get("/bookings/:id", (req, res, next) => {
  const eventId = req.params.id;
  const username = req.session.organiserName;

  global.db.get("SELECT * FROM events WHERE event_id = ? AND organiser_name = ?", [eventId, username], (err, event) => {
    if (err || !event) return res.send("Unauthorized view.");

    global.db.all("SELECT * FROM bookings WHERE event_id = ?", [eventId], (err2, bookings) => {
      if (err2) return next(err2);
      res.render("organiser-bookings.ejs", { event, bookings, organiserName: username });
    });
  });
});
// END OF OWN CODE

// OWN CODE
// This route handles event deletion by the organiser
// Demonstrates form handling, POST method, SQL delete, and data validation
router.post("/delete/:id", (req, res, next) => {
  const eventId = req.params.id;
  const username = req.session.organiserName;

  global.db.get("SELECT * FROM events WHERE event_id = ? AND organiser_name = ?", [eventId, username], (err, event) => {
    if (err || !event) return res.send("Unauthorized delete.");

    global.db.run("DELETE FROM bookings WHERE event_id = ?", [eventId], (err) => {
      if (err) return next(err);
      global.db.run("DELETE FROM settings WHERE event_id = ?", [eventId], () => {
        global.db.run("DELETE FROM events WHERE event_id = ?", [eventId], function (err2) {
          if (err2) return next(err2);
          res.redirect("/organiser/home");
        });
      });
    });
  });
});
// END OF OWN CODE

// OWN CODE
// This route handles deletion of a specific booking
// Demonstrates form handling, POST method, SQL delete, and data validation
router.post("/bookings/:booking_id/delete", (req, res, next) => {
  const bookingId = req.params.booking_id;

  global.db.get("SELECT * FROM bookings WHERE booking_id = ?", [bookingId], (err, booking) => {
    if (err || !booking) return next(err || new Error("Booking not found"));

    global.db.get("SELECT organiser_name FROM events WHERE event_id = ?", [booking.event_id], (err2, row) => {
      if (err2 || row.organiser_name !== req.session.organiserName) return res.send("Unauthorized booking delete.");

      global.db.run("DELETE FROM bookings WHERE booking_id = ?", [bookingId], (err3) => {
        if (err3) return next(err3);

        const updateQuery = `
          UPDATE events
          SET 
            full_price_tickets = full_price_tickets + ?,
            concession_tickets = concession_tickets + ?,
            vip_tickets = vip_tickets + ?
          WHERE event_id = ?
        `;
        const params = [
          booking.full_qty || 0,
          booking.concession_qty || 0,
          booking.vip_qty || 0,
          booking.event_id
        ];

        global.db.run(updateQuery, params, (err4) => {
          if (err4) return next(err4);
          res.redirect(`/organiser/bookings/${booking.event_id}`);
        });
      });
    });
  });
});
// END OF OWN CODE

// OWN CODE
// This route displays all bookings across events for the organiser
// Demonstrates routing, SQL querying, and templating
router.get("/bookings-all", (req, res, next) => {
  const username = req.session.organiserName;

  const query = `
    SELECT 
      b.booking_id,
      b.attendee_name,
      b.full_qty,
      b.concession_qty,
      b.vip_qty,
      e.title AS event_title,
      e.date AS event_date
    FROM bookings b
    JOIN events e ON b.event_id = e.event_id
    WHERE e.organiser_name = ?
    ORDER BY e.date ASC
  `;

  global.db.all(query, [username], (err, bookings) => {
    if (err) return next(err);
    res.render("organiser-bookings-all.ejs", { bookings, organiserName: username });
  });
});
// END OF OWN CODE

module.exports = router;
