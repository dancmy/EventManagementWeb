const express = require("express");
const router = express.Router();

// Attendee homepage – list all published events with their own site name/description
// OWN CODE
// This route handles the attendee homepage
// It retrieves all published events from the database, including site name and description, and renders them using the attendee-home.ejs template
// This demonstrates routing, SQL database querying, and server-side templating (EJS)
router.get("/home", (req, res, next) => {
  const query = `
    SELECT 
      e.*,
      s.site_name,
      s.site_description
    FROM events e
    LEFT JOIN settings s ON e.event_id = s.event_id
    WHERE e.is_published = 1
    ORDER BY e.date ASC
  `;

  global.db.all(query, [], (err, events) => {
    if (err) return next(err);
    res.render("attendee-home.ejs", { events });
  });
});
// END OF OWN CODE

// Show event details + booking form
// OWN CODE
// This route displays the details of a single event and a booking form for attendees
// It fetches the event by ID from the database and renders the attendee-event.ejs template
// This covers routing, dynamic data retrieval, and templating
router.get("/event/:id", (req, res, next) => {
  const query = "SELECT * FROM events WHERE event_id = ?";
  global.db.get(query, [req.params.id], (err, event) => {
    if (err) return next(err);
    res.render("attendee-event.ejs", { event });
  });
});
// END OF OWN CODE

// Handle booking submission with full/concession/VIP tickets
// OWN CODE
// This route handles booking submissions for an event
// It validates ticket quantities, checks ticket availability, inserts a booking, and updates ticket counts in the database
// Demonstrates form handling, GET/POST methods, SQL operations, and data validation
router.post("/event/:id/book", (req, res, next) => {
  const eventId = req.params.id;
  const { attendee_name, full_qty, concession_qty, vip_qty } = req.body;

  const full = parseInt(full_qty) || 0;
  const concession = parseInt(concession_qty) || 0;
  const vip = parseInt(vip_qty) || 0;

  if (full + concession + vip === 0) {
    return res.send("Please book at least one ticket.");
  }

  // 1) Fetch current ticket availability
  const query = `
    SELECT full_price_tickets, concession_tickets, vip_tickets 
    FROM events WHERE event_id = ?
  `;
  global.db.get(query, [eventId], (err, row) => {
    if (err) return next(err);
    if (!row) return res.send("Event not found.");

    if (
      row.full_price_tickets < full ||
      row.concession_tickets < concession ||
      row.vip_tickets < vip
    ) {
      return res.send("😞 Not enough tickets available.");
    }

    // 2) Insert booking
    const insertBooking = `
      INSERT INTO bookings (event_id, attendee_name, full_qty, concession_qty, vip_qty)
      VALUES (?, ?, ?, ?, ?)
    `;
    global.db.run(
      insertBooking,
      [eventId, attendee_name, full, concession, vip],
      function (err2) {
        if (err2) return next(err2);

        // 3) Decrement each ticket type
        const updateTickets = `
          UPDATE events
          SET 
            full_price_tickets = full_price_tickets - ?,
            concession_tickets = concession_tickets - ?,
            vip_tickets = vip_tickets - ?
          WHERE event_id = ?
        `;
        global.db.run(
          updateTickets,
          [full, concession, vip, eventId],
          (err3) => {
            if (err3) return next(err3);
            res.redirect("/attendee/home");
          }
        );
      }
    );
  });
});
// END OF OWN CODE

module.exports = router;
