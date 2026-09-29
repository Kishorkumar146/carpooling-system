require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');
const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'carpooling-secret-key-2026-srs-approved';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, userPayload) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }
    const user = db.findUserById(userPayload.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }
    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration (FR-5).' });
    }
    req.user = user;
    next();
  });
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Restricted to role(s): ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
}

// Status Check Endpoint
app.get('/api/db-status', (req, res) => {
  const isSupabaseActive = !!supabase;
  res.json({
    success: true,
    engine: isSupabaseActive ? 'Supabase PostgreSQL' : 'Local Fallback Storage',
    supabaseConnected: isSupabaseActive,
    message: isSupabaseActive 
      ? 'Application is connected to Supabase database.'
      : 'Running with local data store. Add SUPABASE_URL & SUPABASE_KEY in .env to connect to Supabase.'
  });
});
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, licenseNo, vehicleNo, vehicleType, bio } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'All mandatory fields (Name, Email, Phone, Password) are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    if (db.findUserByEmail(email)) {
      return res.status(400).json({ success: false, message: 'An account with this email address already exists (FR-2).' });
    }

    if (db.findUserByPhone(phone)) {
      return res.status(400).json({ success: false, message: 'An account with this phone number already exists (FR-2).' });
    }

    const newUser = await db.createUser({
      name,
      email,
      phone,
      password,
      role: role || 'PASSENGER',
      licenseNo,
      vehicleNo,
      vehicleType,
      bio
    });

    // Create welcoming notification
    await db.createNotification(
      newUser.userId, 
      'WELCOME', 
      'Welcome to Carpooling System!', 
      `Hello ${newUser.name}, your ${newUser.role.toLowerCase()} account has been created successfully.`
    );

    const token = jwt.sign({ userId: newUser.userId, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Your account has been suspended by administration (FR-5).' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password credentials.' });
    }

    const token = jwt.sign({ userId: user.userId, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  const { password: _, ...userWithoutPassword } = req.user;
  res.json({ success: true, user: userWithoutPassword });
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { name, phone, bio, avatar, licenseNo, vehicleNo, vehicleType } = req.body;
    const updated = db.updateUser(req.user.userId, {
      name: name || req.user.name,
      phone: phone || req.user.phone,
      bio: bio !== undefined ? bio : req.user.bio,
      avatar: avatar || req.user.avatar,
      licenseNo: licenseNo !== undefined ? licenseNo : req.user.licenseNo,
      vehicleNo: vehicleNo !== undefined ? vehicleNo : req.user.vehicleNo,
      vehicleType: vehicleType !== undefined ? vehicleType : req.user.vehicleType
    });

    const { password: _, ...userWithoutPassword } = updated;
    res.json({ success: true, message: 'Profile updated successfully (FR-4).', user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.put('/api/auth/change-password', authenticateToken, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
    }

    if (!bcrypt.compareSync(oldPassword, req.user.password)) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
    }

    db.updateUser(req.user.userId, { password: newPassword });
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// RIDES ENDPOINTS (FR-6 to FR-15)
// -------------------------------------------------------------
// Public / Guest / Passenger ride search
app.get('/api/rides', (req, res) => {
  try {
    const { source, destination, date, minSeats, status } = req.query;
    let rides = db.getAllRides();

    // Default to active rides unless explicitly searching all
    if (status) {
      rides = rides.filter(r => r.status === status);
    } else {
      rides = rides.filter(r => r.status === 'ACTIVE' && r.availableSeats > 0);
    }

    if (source) {
      const srcQuery = source.toLowerCase().trim();
      rides = rides.filter(r => 
        r.source.toLowerCase().includes(srcQuery) ||
        r.stops.some(stop => stop.toLowerCase().includes(srcQuery))
      );
    }

    if (destination) {
      const destQuery = destination.toLowerCase().trim();
      rides = rides.filter(r => 
        r.destination.toLowerCase().includes(destQuery) ||
        r.stops.some(stop => stop.toLowerCase().includes(destQuery))
      );
    }

    if (date) {
      rides = rides.filter(r => r.date === date);
    }

    if (minSeats) {
      rides = rides.filter(r => r.availableSeats >= Number(minSeats));
    }

    res.json({ success: true, count: rides.length, rides });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/rides/:id', (req, res) => {
  const ride = db.findRideById(req.params.id);
  if (!ride) {
    return res.status(404).json({ success: false, message: 'Ride offer not found.' });
  }

  // Get driver rating and reviews
  const driverFeedbacks = db.data.feedbacks.filter(f => f.toUserId === ride.driverId);
  const bookings = db.data.bookings.filter(b => b.rideId === ride.rideId);

  res.json({
    success: true,
    ride,
    driverFeedbacks,
    bookingsCount: bookings.filter(b => b.status === 'CONFIRMED').length
  });
});

// Post a new ride (Driver only - FR-6, FR-7, BR-2)
app.post('/api/rides', authenticateToken, requireRole('DRIVER', 'ADMINISTRATOR'), (req, res) => {
  try {
    const { source, destination, stops, date, time, totalSeats, fare, notes, features, vehicleNo, vehicleType } = req.body;

    if (!source || !destination || !date || !time || totalSeats === undefined || fare === undefined) {
      return res.status(400).json({ success: false, message: 'Source, destination, date, time, seats, and fare are mandatory (FR-6).' });
    }

    if (Number(fare) < 0) {
      return res.status(400).json({ success: false, message: 'Fare cannot be negative (FR-7).' });
    }

    if (Number(totalSeats) <= 0 || Number(totalSeats) > 10) {
      return res.status(400).json({ success: false, message: 'Available seat count must be between 1 and 10 (FR-7).' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (date < todayStr) {
      return res.status(400).json({ success: false, message: 'Ride date cannot be in the past (FR-7).' });
    }

    const newRide = db.createRide({
      source,
      destination,
      stops,
      date,
      time,
      totalSeats,
      fare,
      notes,
      features,
      vehicleNo,
      vehicleType
    }, req.user);

    db.createNotification(
      req.user.userId,
      'RIDE_POSTED',
      'Ride Offer Published',
      `Your ride from ${newRide.source} to ${newRide.destination} on ${newRide.date} is now active.`
    );

    res.status(201).json({
      success: true,
      message: 'Ride offer created successfully (FR-6).',
      ride: newRide
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update ride (Driver or Admin - FR-8, FR-9)
app.put('/api/rides/:id', authenticateToken, (req, res) => {
  try {
    const ride = db.findRideById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (req.user.role !== 'ADMINISTRATOR' && ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this ride offer.' });
    }

    const updated = db.updateRide(req.params.id, req.body);
    res.json({ success: true, message: 'Ride details updated successfully (FR-8).', ride: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Update ride status (Start / Complete / Cancel)
app.patch('/api/rides/:id/status', authenticateToken, (req, res) => {
  try {
    const { status } = req.body;
    const ride = db.findRideById(req.params.id);
    if (!ride) return res.status(404).json({ success: false, message: 'Ride not found.' });

    if (req.user.role !== 'ADMINISTRATOR' && ride.driverId !== req.user.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this ride.' });
    }

    if (!['ACTIVE', 'COMPLETED', 'CANCELLED', 'DEACTIVATED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid ride status provided.' });
    }

    ride.status = status;
    db.save();

    // If ride completed, update confirmed bookings to COMPLETED and notify passengers for feedback
    const confirmedBookings = db.data.bookings.filter(b => b.rideId === ride.rideId && b.status === 'CONFIRMED');
    
    if (status === 'COMPLETED') {
      confirmedBookings.forEach(booking => {
        booking.status = 'COMPLETED';
        db.createNotification(
          booking.passengerId,
          'RIDE_COMPLETED',
          'Trip Completed - Rating Requested',
          `Your trip from ${ride.source} to ${ride.destination} has finished. Please rate your driver ${ride.driverName}!`
        );
      });
      db.save();
    } else if (status === 'CANCELLED') {
      confirmedBookings.forEach(booking => {
        booking.status = 'CANCELLED';
        booking.statusReason = 'Cancelled by driver/system';
        db.createNotification(
          booking.passengerId,
          'RIDE_CANCELLED',
          'Ride Cancelled by Driver',
          `Important: The ride from ${ride.source} to ${ride.destination} on ${ride.date} has been cancelled.`
        );
      });
      db.save();
    }

    res.json({ success: true, message: `Ride status changed to ${status}.`, ride });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Driver's posted rides list
app.get('/api/driver/my-rides', authenticateToken, requireRole('DRIVER', 'ADMINISTRATOR'), (req, res) => {
  const driverRides = db.getAllRides().filter(r => r.driverId === req.user.userId);
  const myBookings = db.getAllBookings().filter(b => b.driverId === req.user.userId);

  const enrichedRides = driverRides.map(ride => {
    const rideBookings = myBookings.filter(b => b.rideId === ride.rideId);
    return {
      ...ride,
      bookings: rideBookings,
      confirmedSeats: rideBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((acc, b) => acc + b.seatCount, 0),
      totalEarnings: rideBookings.filter(b => b.status === 'CONFIRMED' || b.status === 'COMPLETED').reduce((acc, b) => acc + b.totalFare, 0)
    };
  });

  const totalEarningsAll = myBookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((acc, b) => acc + b.totalFare, 0);

  res.json({
    success: true,
    rides: enrichedRides,
    totalEarnings: totalEarningsAll,
    completedTrips: driverRides.filter(r => r.status === 'COMPLETED').length,
    activeTrips: driverRides.filter(r => r.status === 'ACTIVE').length
  });
});

// -------------------------------------------------------------
// BOOKINGS & RIDE ALLOCATION (FR-16 to FR-20, BR-1, BR-3, BR-4)
// -------------------------------------------------------------
// Passenger creates booking request
app.post('/api/bookings', authenticateToken, requireRole('PASSENGER', 'ADMINISTRATOR'), (req, res) => {
  try {
    const { rideId, seatCount, pickupLocation, dropLocation, notes } = req.body;

    if (!rideId || !seatCount) {
      return res.status(400).json({ success: false, message: 'Ride ID and Seat count are required.' });
    }

    const booking = db.createBooking({
      rideId,
      seatCount,
      pickupLocation,
      dropLocation,
      notes
    }, req.user);

    const ride = db.findRideById(rideId);

    // Notify driver about new request
    db.createNotification(
      booking.driverId,
      'BOOKING_REQUEST',
      'New Ride Booking Request',
      `${req.user.name} requested ${booking.seatCount} seat(s) on your ride from ${ride.source} to ${ride.destination}.`
    );

    // Notify passenger
    db.createNotification(
      req.user.userId,
      'BOOKING_SUBMITTED',
      'Booking Request Submitted',
      `Your request for ${booking.seatCount} seat(s) on ${ride.source} → ${ride.destination} is ${booking.status.toLowerCase()}.`
    );

    res.status(201).json({
      success: true,
      message: `Booking request recorded with status: ${booking.status} (FR-16).`,
      booking
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Passenger's my bookings
app.get('/api/passenger/my-bookings', authenticateToken, (req, res) => {
  const userBookings = db.getAllBookings().filter(b => b.passengerId === req.user.userId);
  const enriched = userBookings.map(b => {
    const ride = db.findRideById(b.rideId);
    return {
      ...b,
      ride
    };
  });
  res.json({ success: true, bookings: enriched });
});

// Driver responds to booking request (ACCEPT / REJECT / CANCEL)
app.patch('/api/bookings/:id/status', authenticateToken, (req, res) => {
  try {
    const { status, reason } = req.body;
    const booking = db.findBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking record not found.' });

    // Permissions check: Driver can accept/reject/cancel; Passenger can cancel their own; Admin can do all
    const isDriver = booking.driverId === req.user.userId;
    const isPassenger = booking.passengerId === req.user.userId;
    const isAdmin = req.user.role === 'ADMINISTRATOR';

    if (!isDriver && !isPassenger && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to modify this booking.' });
    }

    if (isPassenger && !['CANCELLED'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Passengers may only cancel bookings.' });
    }

    const updatedBooking = db.updateBookingStatus(booking.bookingId, status, reason);
    const ride = db.findRideById(booking.rideId);

    // Send notifications based on status
    if (status === 'CONFIRMED') {
      db.createNotification(
        booking.passengerId,
        'BOOKING_ACCEPTED',
        'Booking Confirmed!',
        `Driver ${ride ? ride.driverName : 'your driver'} approved your booking for ${booking.seatCount} seat(s).`
      );
    } else if (status === 'REJECTED') {
      db.createNotification(
        booking.passengerId,
        'BOOKING_REJECTED',
        'Booking Request Declined',
        `Driver was unable to accept your request. Reason: ${reason || 'Seat unavailable'}.`
      );
    } else if (status === 'CANCELLED') {
      const recipientId = isPassenger ? booking.driverId : booking.passengerId;
      const cancelledBy = isPassenger ? `Passenger ${booking.passengerName}` : `Driver`;
      db.createNotification(
        recipientId,
        'BOOKING_CANCELLED',
        'Booking Cancelled',
        `${cancelledBy} has cancelled the booking for ride #${booking.rideId}.`
      );
    }

    res.json({
      success: true,
      message: `Booking status updated to ${status} (FR-18, FR-19).`,
      booking: updatedBooking
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// -------------------------------------------------------------
// FEEDBACK & RATINGS (FR-25 to FR-28, BR-5)
// -------------------------------------------------------------
app.post('/api/feedback', authenticateToken, (req, res) => {
  try {
    const { rideId, toUserId, toUserName, rating, comments } = req.body;

    if (!rideId || !toUserId || !rating) {
      return res.status(400).json({ success: false, message: 'Ride ID, Target User ID, and Rating are required.' });
    }

    const newFeedback = db.createFeedback({
      rideId,
      toUserId,
      toUserName,
      rating,
      comments
    }, req.user);

    db.createNotification(
      toUserId,
      'NEW_FEEDBACK',
      'New Rating & Review Received',
      `${req.user.name} rated your ride ${newFeedback.rating} stars: "${newFeedback.comments || 'Great ride!'}"`
    );

    res.status(201).json({
      success: true,
      message: 'Rating and review submitted successfully (FR-25, FR-27).',
      feedback: newFeedback
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

app.get('/api/feedback/user/:userId', (req, res) => {
  const feedbacks = db.data.feedbacks.filter(f => f.toUserId === Number(req.params.userId));
  res.json({ success: true, feedbacks });
});

// -------------------------------------------------------------
// NOTIFICATIONS (FR-21 to FR-24)
// -------------------------------------------------------------
app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifs = db.getUserNotifications(req.user.userId);
  const unreadCount = notifs.filter(n => !n.isRead).length;
  res.json({ success: true, notifications: notifs, unreadCount });
});

app.patch('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const success = db.markNotificationAsRead(req.params.id, req.user.userId);
  res.json({ success, message: success ? 'Notification marked as read (FR-23).' : 'Notification not found.' });
});

app.patch('/api/notifications/read-all', authenticateToken, (req, res) => {
  db.markAllNotificationsRead(req.user.userId);
  res.json({ success: true, message: 'All notifications marked as read (FR-23).' });
});

// -------------------------------------------------------------
// COMPLAINTS & DISPUTES (FR-32)
// -------------------------------------------------------------
app.post('/api/complaints', authenticateToken, (req, res) => {
  try {
    const { againstUserId, againstUserName, rideId, category, subject, description } = req.body;
    if (!subject || !description) {
      return res.status(400).json({ success: false, message: 'Subject and detailed description are required.' });
    }

    const complaint = db.createComplaint({
      againstUserId,
      againstUserName,
      rideId,
      category,
      subject,
      description
    }, req.user);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully to administration.',
      complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/complaints/my', authenticateToken, (req, res) => {
  const myComplaints = db.data.complaints.filter(c => c.fromUserId === req.user.userId);
  res.json({ success: true, complaints: myComplaints });
});

// -------------------------------------------------------------
// ADMINISTRATOR DASHBOARD & CONTROLS (FR-29 to FR-34, BR-6)
// -------------------------------------------------------------
app.get('/api/admin/stats', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  const users = db.data.users;
  const rides = db.data.rides;
  const bookings = db.data.bookings;
  const complaints = db.data.complaints;

  const totalEarnings = bookings
    .filter(b => b.status === 'COMPLETED' || b.status === 'CONFIRMED')
    .reduce((sum, b) => sum + b.totalFare, 0);

  const completedRidesCount = rides.filter(r => r.status === 'COMPLETED').length;
  const activeRidesCount = rides.filter(r => r.status === 'ACTIVE').length;

  res.json({
    success: true,
    stats: {
      totalUsers: users.length,
      passengersCount: users.filter(u => u.role === 'PASSENGER').length,
      driversCount: users.filter(u => u.role === 'DRIVER').length,
      totalRides: rides.length,
      activeRides: activeRidesCount,
      completedRides: completedRidesCount,
      totalBookings: bookings.length,
      confirmedBookings: bookings.filter(b => b.status === 'CONFIRMED').length,
      completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
      totalFareVolume: totalEarnings,
      openComplaints: complaints.filter(c => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length
    }
  });
});

app.get('/api/admin/users', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  const sanitized = db.data.users.map(({ password, ...u }) => u);
  res.json({ success: true, users: sanitized });
});

app.patch('/api/admin/users/:id/status', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }
    const user = db.updateUser(req.params.id, { status });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const { password: _, ...sanitized } = user;
    res.json({ success: true, message: `User status changed to ${status} (FR-30).`, user: sanitized });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  if (Number(req.params.id) === req.user.userId) {
    return res.status(400).json({ success: false, message: 'Admin cannot delete their own account.' });
  }
  const deleted = db.deleteUser(req.params.id);
  res.json({ success: deleted, message: deleted ? 'User deleted permanently (FR-30).' : 'User not found.' });
});

app.get('/api/admin/rides', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  res.json({ success: true, rides: db.getAllRides() });
});

app.get('/api/admin/bookings', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  res.json({ success: true, bookings: db.getAllBookings() });
});

app.get('/api/admin/complaints', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  res.json({ success: true, complaints: db.data.complaints });
});

app.patch('/api/admin/complaints/:id', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  const { status, resolutionNote } = req.body;
  const complaint = db.updateComplaintStatus(req.params.id, status, resolutionNote);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  res.json({ success: true, message: 'Complaint updated (FR-32).', complaint });
});

// Database backup / export (FR-34, NFR-7)
app.get('/api/admin/database/backup', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  const backupJson = db.backup();
  res.setHeader('Content-disposition', `attachment; filename=carpooling_backup_${Date.now()}.json`);
  res.setHeader('Content-type', 'application/json');
  res.send(backupJson);
});

// Database restore (FR-34)
app.post('/api/admin/database/restore', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  try {
    const { backupData } = req.body;
    db.restore(backupData);
    res.json({ success: true, message: 'Database restored successfully from backup (FR-34).' });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Failed to restore database: ' + error.message });
  }
});

// Database reset
app.post('/api/admin/database/reset', authenticateToken, requireRole('ADMINISTRATOR'), (req, res) => {
  db.reset();
  res.json({ success: true, message: 'Database reset to default seed sample data.' });
});

// Fallback to index.html for SPA routing (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Carpooling & Ride Allocation System (SRS v1.0)`);
  console.log(`📡 Server running at http://localhost:${PORT}`);
  console.log(`=======================================================`);
  
  // Synchronize local database and Supabase tables on startup
  db.initSupabaseSync();
});
