const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DEFAULT_PASSWORD_HASH = bcrypt.hashSync('password123', 10);

function getInitialData() {
  return {
    users: [
      {
        userId: 1,
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 98765 43210',
        password: DEFAULT_PASSWORD_HASH,
        role: 'PASSENGER',
        status: 'ACTIVE',
        bio: 'Tech professional commuting daily. Enjoys quiet and punctual rides.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-09-01T08:00:00.000Z'
      },
      {
        userId: 2,
        name: 'Rahul Verma',
        email: 'rahul@example.com',
        phone: '+91 98123 45678',
        password: DEFAULT_PASSWORD_HASH,
        role: 'DRIVER',
        status: 'ACTIVE',
        licenseNo: 'DL-04-2021-009876',
        vehicleNo: 'KA-01-MJ-5521',
        vehicleType: 'Sedan (Honda City)',
        averageRating: 4.9,
        totalRatingsCount: 14,
        bio: 'Safe driver with 6+ years experience. AC on, good music, verified profile.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        verified: true,
        createdAt: '2026-08-15T09:30:00.000Z'
      },
      {
        userId: 3,
        name: 'Arun Sundaram',
        email: 'arun@example.com',
        phone: '+91 97890 12345',
        password: DEFAULT_PASSWORD_HASH,
        role: 'DRIVER',
        status: 'ACTIVE',
        licenseNo: 'TN-07-2019-112233',
        vehicleNo: 'TN-09-CB-4490',
        vehicleType: 'SUV (Hyundai Creta)',
        averageRating: 4.8,
        totalRatingsCount: 9,
        bio: 'Weekend highway traveler. Punctual, non-smoker, spacious luggage boot.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        verified: true,
        createdAt: '2026-08-20T11:00:00.000Z'
      },
      {
        userId: 4,
        name: 'Administrator',
        email: 'admin@carpool.com',
        phone: '+91 99000 11223',
        password: DEFAULT_PASSWORD_HASH,
        role: 'ADMINISTRATOR',
        status: 'ACTIVE',
        permissions: ['ALL_ACCESS', 'USER_MODERATION', 'RIDE_MANAGEMENT', 'COMPLAINTS_RESOLVE', 'SYSTEM_MAINTENANCE'],
        bio: 'Platform System Administrator & Safety Controller',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-01-01T00:00:00.000Z'
      },
      {
        userId: 5,
        name: 'Kavita Nair',
        email: 'kavita@example.com',
        phone: '+91 98450 99887',
        password: DEFAULT_PASSWORD_HASH,
        role: 'PASSENGER',
        status: 'ACTIVE',
        bio: 'Student at university commuting for internships and weekend trips.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        createdAt: '2026-09-10T14:20:00.000Z'
      }
    ],
    rides: [
      {
        rideId: 101,
        driverId: 2,
        driverName: 'Rahul Verma',
        driverPhone: '+91 98123 45678',
        driverRating: 4.9,
        vehicleNo: 'KA-01-MJ-5521',
        vehicleType: 'Sedan (Honda City)',
        source: 'Bangalore (Electronic City)',
        destination: 'Chennai (Guindy)',
        stops: ['Hosur', 'Krishnagiri', 'Vellore', 'Sriperumbudur'],
        date: '2026-10-02',
        time: '06:30',
        totalSeats: 4,
        availableSeats: 3,
        fare: 650,
        status: 'ACTIVE',
        notes: 'AC car, smooth highway drive. 1 medium bag per passenger. Non-smoking.',
        features: ['AC', 'Luggage space', 'Music', 'No Smoking'],
        createdAt: '2026-09-25T10:00:00.000Z'
      },
      {
        rideId: 102,
        driverId: 3,
        driverName: 'Arun Sundaram',
        driverPhone: '+91 97890 12345',
        driverRating: 4.8,
        vehicleNo: 'TN-09-CB-4490',
        vehicleType: 'SUV (Hyundai Creta)',
        source: 'Chennai (Anna Nagar)',
        destination: 'Coimbatore (Gandhipuram)',
        stops: ['Villupuram', 'Salem', 'Erode'],
        date: '2026-10-03',
        time: '05:00',
        totalSeats: 5,
        availableSeats: 4,
        fare: 750,
        status: 'ACTIVE',
        notes: 'Early morning start. Comfortable SUV, coffee stops on bypass.',
        features: ['AC', 'Spacious', 'Music Allowed', 'Pets Allowed'],
        createdAt: '2026-09-26T12:30:00.000Z'
      },
      {
        rideId: 103,
        driverId: 2,
        driverName: 'Rahul Verma',
        driverPhone: '+91 98123 45678',
        driverRating: 4.9,
        vehicleNo: 'KA-01-MJ-5521',
        vehicleType: 'Sedan (Honda City)',
        source: 'Bangalore (Koramangala)',
        destination: 'Mysore (Suburban Bus Stand)',
        stops: ['Kengeri', 'Bidadi', 'Mandya'],
        date: '2026-09-29',
        time: '17:30',
        totalSeats: 3,
        availableSeats: 1,
        fare: 350,
        status: 'ACTIVE',
        notes: 'Evening commute via Expressway. Fast FASTag toll travel.',
        features: ['AC', 'Expressway Route', 'No Smoking'],
        createdAt: '2026-09-27T08:15:00.000Z'
      },
      {
        rideId: 104,
        driverId: 3,
        driverName: 'Arun Sundaram',
        driverPhone: '+91 97890 12345',
        driverRating: 4.8,
        vehicleNo: 'TN-09-CB-4490',
        vehicleType: 'SUV (Hyundai Creta)',
        source: 'Chennai (Koyambedu)',
        destination: 'Pondicherry (White Town)',
        stops: ['Mahabalipuram', 'Kalpakkam', 'Marakkanam'],
        date: '2026-09-20',
        time: '07:00',
        totalSeats: 4,
        availableSeats: 0,
        fare: 400,
        status: 'COMPLETED',
        notes: 'Scenic ECR drive with breakfast stop at Mahabalipuram.',
        features: ['AC', 'Scenic Route', 'Music'],
        createdAt: '2026-09-18T09:00:00.000Z'
      }
    ],
    bookings: [
      {
        bookingId: 1001,
        rideId: 101,
        passengerId: 1,
        passengerName: 'Priya Sharma',
        passengerPhone: '+91 98765 43210',
        driverId: 2,
        driverName: 'Rahul Verma',
        seatCount: 1,
        totalFare: 650,
        status: 'CONFIRMED',
        bookingDate: '2026-09-26T14:10:00.000Z',
        pickupLocation: 'Electronic City Toll Gate',
        dropLocation: 'Guindy Metro Station',
        notes: 'Will have one cabin-sized suitcase.'
      },
      {
        bookingId: 1002,
        rideId: 103,
        passengerId: 5,
        passengerName: 'Kavita Nair',
        passengerPhone: '+91 98450 99887',
        driverId: 2,
        driverName: 'Rahul Verma',
        seatCount: 2,
        totalFare: 700,
        status: 'CONFIRMED',
        bookingDate: '2026-09-27T10:00:00.000Z',
        pickupLocation: 'Koramangala 4th Block',
        dropLocation: 'Mandya Highway Exit',
        notes: 'Traveling with my cousin.'
      },
      {
        bookingId: 1003,
        rideId: 104,
        passengerId: 1,
        passengerName: 'Priya Sharma',
        passengerPhone: '+91 98765 43210',
        driverId: 3,
        driverName: 'Arun Sundaram',
        seatCount: 2,
        totalFare: 800,
        status: 'COMPLETED',
        bookingDate: '2026-09-18T16:00:00.000Z',
        pickupLocation: 'Koyambedu CMBT',
        dropLocation: 'Pondicherry Promenade',
        notes: 'Trip completed successfully.'
      }
    ],
    feedbacks: [
      {
        feedbackId: 1,
        rideId: 104,
        fromUserId: 1,
        fromUserName: 'Priya Sharma',
        fromUserRole: 'PASSENGER',
        toUserId: 3,
        toUserName: 'Arun Sundaram',
        rating: 5,
        comments: 'Excellent trip! Arun drove very safely on the ECR route and was right on time.',
        createdAt: '2026-09-20T16:30:00.000Z'
      },
      {
        feedbackId: 2,
        rideId: 104,
        fromUserId: 3,
        fromUserName: 'Arun Sundaram',
        fromUserRole: 'DRIVER',
        toUserId: 1,
        toUserName: 'Priya Sharma',
        rating: 5,
        comments: 'Great passenger, very polite and reached the pickup spot punctually.',
        createdAt: '2026-09-20T17:00:00.000Z'
      }
    ],
    notifications: [
      {
        notificationId: 1,
        userId: 1,
        type: 'BOOKING_CONFIRMED',
        title: 'Ride Booking Confirmed!',
        message: 'Your booking for Bangalore to Chennai on 2026-10-02 has been confirmed by driver Rahul Verma.',
        isRead: false,
        createdAt: '2026-09-26T15:00:00.000Z'
      },
      {
        notificationId: 2,
        userId: 2,
        type: 'NEW_BOOKING_REQUEST',
        title: 'New Passenger Confirmed',
        message: 'Priya Sharma booked 1 seat on your Bangalore to Chennai ride.',
        isRead: true,
        createdAt: '2026-09-26T14:10:00.000Z'
      },
      {
        notificationId: 3,
        userId: 1,
        type: 'RIDE_COMPLETED',
        title: 'Trip Completed - Leave Feedback',
        message: 'Your trip with Arun Sundaram to Pondicherry has completed. Please share your rating.',
        isRead: true,
        createdAt: '2026-09-20T16:00:00.000Z'
      }
    ],
    complaints: [
      {
        complaintId: 1,
        fromUserId: 5,
        fromUserName: 'Kavita Nair',
        fromUserEmail: 'kavita@example.com',
        againstUserId: 2,
        againstUserName: 'Rahul Verma',
        rideId: 103,
        category: 'RIDE_SCHEDULE',
        subject: '15 Minute Departure Delay Query',
        description: 'Driver communicated a 15 min delay due to rain. Just checking updated pickup time.',
        status: 'RESOLVED',
        assignedTo: 'Admin Team',
        resolutionNote: 'Driver and passenger coordinated via phone; trip pickup updated accordingly.',
        createdAt: '2026-09-27T11:00:00.000Z',
        resolvedAt: '2026-09-27T11:30:00.000Z'
      }
    ],
    systemSettings: {
      platformName: 'Carpooling System & Ride Allocation',
      version: '1.0.0',
      currencySymbol: '₹',
      maxSeatsPerRide: 8,
      minAdvanceBookingHours: 0,
      autoApproveBookings: false,
      smsNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      maintenanceMode: false
    }
  };
}

// Mapper Functions between Supabase (snake_case) & App Memory (camelCase)
function userToSupabase(u) {
  return {
    user_id: u.userId,
    name: u.name,
    email: u.email,
    phone: u.phone,
    password: u.password,
    role: u.role || 'PASSENGER',
    status: u.status || 'ACTIVE',
    bio: u.bio || '',
    avatar: u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    license_no: u.licenseNo || '',
    vehicle_no: u.vehicleNo || '',
    vehicle_type: u.vehicleType || '',
    average_rating: u.averageRating || 5.0,
    total_ratings_count: u.totalRatingsCount || 0,
    verified: Boolean(u.verified),
    created_at: u.createdAt || new Date().toISOString()
  };
}

function userFromSupabase(row) {
  return {
    userId: Number(row.user_id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    password: row.password,
    role: row.role,
    status: row.status,
    bio: row.bio || '',
    avatar: row.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    licenseNo: row.license_no || '',
    vehicleNo: row.vehicle_no || '',
    vehicleType: row.vehicle_type || '',
    averageRating: Number(row.average_rating) || 5.0,
    totalRatingsCount: Number(row.total_ratings_count) || 0,
    verified: Boolean(row.verified),
    createdAt: row.created_at
  };
}

function rideToSupabase(r) {
  return {
    ride_id: r.rideId,
    driver_id: r.driverId,
    driver_name: r.driverName,
    driver_phone: r.driverPhone || '',
    driver_rating: r.driverRating || 5.0,
    vehicle_no: r.vehicleNo || '',
    vehicle_type: r.vehicleType || '',
    source: r.source,
    destination: r.destination,
    stops: Array.isArray(r.stops) ? r.stops : [],
    date: r.date,
    time: r.time,
    total_seats: r.totalSeats,
    available_seats: r.availableSeats,
    fare: r.fare,
    status: r.status || 'ACTIVE',
    notes: r.notes || '',
    features: Array.isArray(r.features) ? r.features : ['AC', 'Music'],
    created_at: r.createdAt || new Date().toISOString()
  };
}

function rideFromSupabase(row) {
  return {
    rideId: Number(row.ride_id),
    driverId: Number(row.driver_id),
    driverName: row.driver_name,
    driverPhone: row.driver_phone,
    driverRating: Number(row.driver_rating) || 5.0,
    vehicleNo: row.vehicle_no,
    vehicleType: row.vehicle_type,
    source: row.source,
    destination: row.destination,
    stops: Array.isArray(row.stops) ? row.stops : [],
    date: typeof row.date === 'string' ? row.date.split('T')[0] : row.date,
    time: row.time,
    totalSeats: Number(row.total_seats),
    availableSeats: Number(row.available_seats),
    fare: Number(row.fare),
    status: row.status,
    notes: row.notes || '',
    features: Array.isArray(row.features) ? row.features : ['AC', 'Music'],
    createdAt: row.created_at
  };
}

function bookingToSupabase(b) {
  return {
    booking_id: b.bookingId,
    ride_id: b.rideId,
    passenger_id: b.passengerId,
    passenger_name: b.passengerName,
    passenger_phone: b.passengerPhone || '',
    driver_id: b.driverId,
    driver_name: b.driverName,
    seat_count: b.seatCount,
    total_fare: b.totalFare,
    status: b.status,
    status_reason: b.statusReason || '',
    booking_date: b.bookingDate || new Date().toISOString(),
    pickup_location: b.pickupLocation,
    drop_location: b.dropLocation,
    notes: b.notes || ''
  };
}

function bookingFromSupabase(row) {
  return {
    bookingId: Number(row.booking_id),
    rideId: Number(row.ride_id),
    passengerId: Number(row.passenger_id),
    passengerName: row.passenger_name,
    passengerPhone: row.passenger_phone,
    driverId: Number(row.driver_id),
    driverName: row.driver_name,
    seatCount: Number(row.seat_count),
    totalFare: Number(row.total_fare),
    status: row.status,
    statusReason: row.status_reason || '',
    bookingDate: row.booking_date,
    pickupLocation: row.pickup_location,
    dropLocation: row.drop_location,
    notes: row.notes || ''
  };
}

function feedbackToSupabase(f) {
  return {
    feedback_id: f.feedbackId,
    ride_id: f.rideId,
    from_user_id: f.fromUserId,
    from_user_name: f.fromUserName,
    from_user_role: f.fromUserRole,
    to_user_id: f.toUserId,
    to_user_name: f.toUserName,
    rating: f.rating,
    comments: f.comments,
    created_at: f.createdAt || new Date().toISOString()
  };
}

function feedbackFromSupabase(row) {
  return {
    feedbackId: Number(row.feedback_id),
    rideId: Number(row.ride_id),
    fromUserId: Number(row.from_user_id),
    fromUserName: row.from_user_name,
    fromUserRole: row.from_user_role,
    toUserId: Number(row.to_user_id),
    toUserName: row.to_user_name,
    rating: Number(row.rating),
    comments: row.comments,
    createdAt: row.created_at
  };
}

function notificationToSupabase(n) {
  return {
    notification_id: n.notificationId,
    user_id: n.userId,
    type: n.type,
    title: n.title,
    message: n.message,
    is_read: Boolean(n.isRead),
    created_at: n.createdAt || new Date().toISOString()
  };
}

function notificationFromSupabase(row) {
  return {
    notificationId: Number(row.notification_id),
    userId: Number(row.user_id),
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at
  };
}

function complaintToSupabase(c) {
  return {
    complaint_id: c.complaintId,
    from_user_id: c.fromUserId,
    from_user_name: c.fromUserName,
    from_user_email: c.fromUserEmail,
    against_user_id: c.againstUserId || null,
    against_user_name: c.againstUserName || 'N/A',
    ride_id: c.rideId || null,
    category: c.category,
    subject: c.subject,
    description: c.description,
    status: c.status,
    assigned_to: c.assignedTo || 'Admin Team',
    resolution_note: c.resolutionNote || '',
    created_at: c.createdAt || new Date().toISOString(),
    resolved_at: c.resolvedAt || null
  };
}

function complaintFromSupabase(row) {
  return {
    complaintId: Number(row.complaint_id),
    fromUserId: Number(row.from_user_id),
    fromUserName: row.from_user_name,
    fromUserEmail: row.from_user_email,
    againstUserId: row.against_user_id ? Number(row.against_user_id) : null,
    againstUserName: row.against_user_name || 'N/A',
    rideId: row.ride_id ? Number(row.ride_id) : null,
    category: row.category,
    subject: row.subject,
    description: row.description,
    status: row.status,
    assignedTo: row.assigned_to,
    resolutionNote: row.resolution_note || '',
    createdAt: row.created_at,
    resolvedAt: row.resolved_at
  };
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(fileContent);
      } else {
        this.data = getInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error reading database file, loading initial defaults:', e);
      this.data = getInitialData();
      this.save();
    }
  }

  async initSupabaseSync() {
    if (!supabase) return;
    try {
      console.log('🔄 [Supabase] Synchronizing database state with Supabase...');
      
      const [uRes, rRes, bRes, fRes, nRes, cRes] = await Promise.all([
        supabase.from('users').select('*').order('user_id', { ascending: true }),
        supabase.from('rides').select('*').order('ride_id', { ascending: true }),
        supabase.from('bookings').select('*').order('booking_id', { ascending: true }),
        supabase.from('feedbacks').select('*').order('feedback_id', { ascending: true }),
        supabase.from('notifications').select('*').order('notification_id', { ascending: true }),
        supabase.from('complaints').select('*').order('complaint_id', { ascending: true })
      ]);

      let remoteUsers = (uRes.data || []).map(userFromSupabase);
      let remoteRides = (rRes.data || []).map(rideFromSupabase);
      let remoteBookings = (bRes.data || []).map(bookingFromSupabase);
      let remoteFeedbacks = (fRes.data || []).map(feedbackFromSupabase);
      let remoteNotifications = (nRes.data || []).map(notificationFromSupabase);
      let remoteComplaints = (cRes.data || []).map(complaintFromSupabase);

      // Check if local database has records that Supabase doesn't have yet (e.g. recently registered users)
      const existingEmails = new Set(remoteUsers.map(u => u.email.toLowerCase()));
      const missingLocalUsers = this.data.users.filter(u => !existingEmails.has(u.email.toLowerCase()));

      if (missingLocalUsers.length > 0) {
        console.log(`📤 [Supabase] Uploading ${missingLocalUsers.length} local user(s) to Supabase...`);
        for (const u of missingLocalUsers) {
          const payload = userToSupabase(u);
          const { error } = await supabase.from('users').upsert([payload]);
          if (error) {
            console.error(`❌ [Supabase] Failed to sync user ${u.email}:`, error.message);
          } else {
            console.log(`✅ [Supabase] Synced user ${u.name} (${u.email}) to Supabase`);
          }
        }
        const refetched = await supabase.from('users').select('*').order('user_id', { ascending: true });
        if (refetched.data) remoteUsers = refetched.data.map(userFromSupabase);
      }

      // Sync rides if needed
      const existingRideIds = new Set(remoteRides.map(r => r.rideId));
      const missingLocalRides = this.data.rides.filter(r => !existingRideIds.has(r.rideId));
      if (missingLocalRides.length > 0) {
        for (const r of missingLocalRides) {
          await supabase.from('rides').upsert([rideToSupabase(r)]);
        }
        const refetched = await supabase.from('rides').select('*').order('ride_id', { ascending: true });
        if (refetched.data) remoteRides = refetched.data.map(rideFromSupabase);
      }

      if (remoteUsers.length > 0) this.data.users = remoteUsers;
      if (remoteRides.length > 0) this.data.rides = remoteRides;
      if (remoteBookings.length > 0) this.data.bookings = remoteBookings;
      if (remoteFeedbacks.length > 0) this.data.feedbacks = remoteFeedbacks;
      if (remoteNotifications.length > 0) this.data.notifications = remoteNotifications;
      if (remoteComplaints.length > 0) this.data.complaints = remoteComplaints;

      this.save();
      console.log(`✅ [Supabase] Synchronization complete. Loaded ${this.data.users.length} users, ${this.data.rides.length} rides.`);
    } catch (err) {
      console.error('❌ [Supabase] Sync initialization failed:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
      return true;
    } catch (e) {
      console.error('Database write error:', e);
      return false;
    }
  }

  reset() {
    this.data = getInitialData();
    this.save();
    return this.data;
  }

  backup() {
    return JSON.stringify(this.data, null, 2);
  }

  restore(jsonData) {
    if (typeof jsonData === 'string') {
      this.data = JSON.parse(jsonData);
    } else {
      this.data = jsonData;
    }
    this.save();
    return true;
  }

  // --- Users ---
  findUserById(userId) {
    return this.data.users.find(u => u.userId === Number(userId));
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  findUserByPhone(phone) {
    if (!phone) return null;
    return this.data.users.find(u => u.phone.replace(/\s+/g, '') === phone.replace(/\s+/g, ''));
  }

  async createUser(userData) {
    const nextId = this.data.users.length ? Math.max(...this.data.users.map(u => u.userId)) + 1 : 1;
    const newUser = {
      userId: nextId,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone,
      password: bcrypt.hashSync(userData.password, 10),
      role: userData.role || 'PASSENGER',
      status: 'ACTIVE',
      bio: userData.bio || '',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      licenseNo: userData.licenseNo || '',
      vehicleNo: userData.vehicleNo || '',
      vehicleType: userData.vehicleType || '',
      averageRating: 5.0,
      totalRatingsCount: 0,
      verified: userData.role === 'DRIVER' ? true : false,
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();

    // Direct persistence to Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase.from('users').insert([userToSupabase(newUser)]).select();
        if (error) {
          console.error('❌ [Supabase] Error inserting new user:', error.message);
        } else if (data && data[0]) {
          console.log(`⚡ [Supabase] User registered & inserted into Supabase (user_id: ${data[0].user_id})`);
          if (data[0].user_id !== newUser.userId) {
            newUser.userId = Number(data[0].user_id);
            this.save();
          }
        }
      } catch (err) {
        console.error('❌ [Supabase] User insert exception:', err.message);
      }
    }

    return newUser;
  }

  updateUser(userId, updateData) {
    const user = this.findUserById(userId);
    if (!user) return null;

    Object.keys(updateData).forEach(key => {
      if (key === 'password') {
        user.password = bcrypt.hashSync(updateData.password, 10);
      } else if (key !== 'userId' && key !== 'createdAt') {
        user[key] = updateData[key];
      }
    });

    this.save();

    if (supabase) {
      supabase.from('users').update(userToSupabase(user)).eq('user_id', user.userId)
        .then(({ error }) => {
          if (error) console.error('❌ [Supabase] Update user error:', error.message);
          else console.log(`⚡ [Supabase] User ${user.userId} updated in Supabase`);
        })
        .catch(err => console.error('❌ [Supabase] Update user exception:', err.message));
    }

    return user;
  }

  deleteUser(userId) {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.userId !== Number(userId));
    if (this.data.users.length !== initialLen) {
      this.save();
      if (supabase) {
        supabase.from('users').delete().eq('user_id', Number(userId))
          .then(({ error }) => {
            if (error) console.error('❌ [Supabase] Delete user error:', error.message);
            else console.log(`⚡ [Supabase] User ${userId} deleted from Supabase`);
          })
          .catch(err => console.error('❌ [Supabase] Delete user exception:', err.message));
      }
      return true;
    }
    return false;
  }

  // --- Rides ---
  getAllRides() {
    return this.data.rides;
  }

  findRideById(rideId) {
    return this.data.rides.find(r => r.rideId === Number(rideId));
  }

  createRide(rideData, driver) {
    const nextId = this.data.rides.length ? Math.max(...this.data.rides.map(r => r.rideId)) + 1 : 101;
    const newRide = {
      rideId: nextId,
      driverId: driver.userId,
      driverName: driver.name,
      driverPhone: driver.phone,
      driverRating: driver.averageRating || 5.0,
      vehicleNo: rideData.vehicleNo || driver.vehicleNo || 'TN-01-AB-1234',
      vehicleType: rideData.vehicleType || driver.vehicleType || 'Car',
      source: rideData.source.trim(),
      destination: rideData.destination.trim(),
      stops: Array.isArray(rideData.stops) ? rideData.stops : (rideData.stops ? rideData.stops.split(',').map(s => s.trim()).filter(Boolean) : []),
      date: rideData.date,
      time: rideData.time,
      totalSeats: Number(rideData.totalSeats),
      availableSeats: Number(rideData.totalSeats),
      fare: Number(rideData.fare),
      status: 'ACTIVE',
      notes: rideData.notes || '',
      features: Array.isArray(rideData.features) ? rideData.features : (rideData.features ? rideData.features.split(',').map(f => f.trim()).filter(Boolean) : ['AC', 'Music']),
      createdAt: new Date().toISOString()
    };
    this.data.rides.unshift(newRide);
    this.save();

    if (supabase) {
      supabase.from('rides').insert([rideToSupabase(newRide)])
        .select()
        .then(({ data, error }) => {
          if (error) {
            console.error('❌ [Supabase] Insert ride error:', error.message);
          } else if (data && data[0]) {
            console.log(`⚡ [Supabase] Ride created in Supabase (ride_id: ${data[0].ride_id})`);
            if (data[0].ride_id !== newRide.rideId) {
              newRide.rideId = Number(data[0].ride_id);
              this.save();
            }
          }
        })
        .catch(err => console.error('❌ [Supabase] Ride insert exception:', err.message));
    }

    return newRide;
  }

  updateRide(rideId, updateData) {
    const ride = this.findRideById(rideId);
    if (!ride) return null;

    const confirmedBookings = this.data.bookings.filter(b => b.rideId === Number(rideId) && b.status === 'CONFIRMED');
    const bookedSeats = confirmedBookings.reduce((sum, b) => sum + (b.seatCount || 1), 0);

    if (updateData.totalSeats !== undefined && Number(updateData.totalSeats) < bookedSeats) {
      throw new Error(`Cannot reduce seats below confirmed bookings (${bookedSeats} seats booked).`);
    }

    if (updateData.totalSeats !== undefined) {
      const seatDiff = Number(updateData.totalSeats) - ride.totalSeats;
      ride.totalSeats = Number(updateData.totalSeats);
      ride.availableSeats = Math.max(0, ride.availableSeats + seatDiff);
    }

    ['source', 'destination', 'stops', 'date', 'time', 'fare', 'status', 'notes', 'features', 'vehicleNo', 'vehicleType'].forEach(field => {
      if (updateData[field] !== undefined) {
        if (field === 'stops' && typeof updateData.stops === 'string') {
          ride.stops = updateData.stops.split(',').map(s => s.trim()).filter(Boolean);
        } else if (field === 'fare') {
          ride.fare = Number(updateData.fare);
        } else {
          ride[field] = updateData[field];
        }
      }
    });

    this.save();

    if (supabase) {
      supabase.from('rides').update(rideToSupabase(ride)).eq('ride_id', ride.rideId)
        .then(({ error }) => {
          if (error) console.error('❌ [Supabase] Update ride error:', error.message);
          else console.log(`⚡ [Supabase] Ride ${ride.rideId} updated in Supabase`);
        })
        .catch(err => console.error('❌ [Supabase] Update ride exception:', err.message));
    }

    return ride;
  }

  // --- Bookings ---
  getAllBookings() {
    return this.data.bookings;
  }

  findBookingById(bookingId) {
    return this.data.bookings.find(b => b.bookingId === Number(bookingId));
  }

  createBooking(bookingData, passenger) {
    const ride = this.findRideById(bookingData.rideId);
    if (!ride) throw new Error('Ride offer not found.');
    if (ride.status !== 'ACTIVE') throw new Error('Ride is not currently active for booking.');
    
    const requestedSeats = Number(bookingData.seatCount) || 1;
    if (requestedSeats <= 0) throw new Error('Requested seats must be greater than zero.');
    if (requestedSeats > ride.availableSeats) {
      throw new Error(`Insufficient seats available. Only ${ride.availableSeats} seat(s) remaining.`);
    }

    const activeBooking = this.data.bookings.find(b => 
      b.passengerId === passenger.userId && 
      b.rideId === ride.rideId && 
      (b.status === 'CONFIRMED' || b.status === 'PENDING')
    );
    if (activeBooking) {
      throw new Error('You already have an active or pending booking for this ride.');
    }

    const nextId = this.data.bookings.length ? Math.max(...this.data.bookings.map(b => b.bookingId)) + 1 : 1001;
    const isAutoApprove = this.data.systemSettings.autoApproveBookings;

    const newBooking = {
      bookingId: nextId,
      rideId: ride.rideId,
      passengerId: passenger.userId,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,
      driverId: ride.driverId,
      driverName: ride.driverName,
      seatCount: requestedSeats,
      totalFare: ride.fare * requestedSeats,
      status: isAutoApprove ? 'CONFIRMED' : 'PENDING',
      bookingDate: new Date().toISOString(),
      pickupLocation: bookingData.pickupLocation || ride.source,
      dropLocation: bookingData.dropLocation || ride.destination,
      notes: bookingData.notes || ''
    };

    if (isAutoApprove) {
      ride.availableSeats -= requestedSeats;
    }

    this.data.bookings.unshift(newBooking);
    this.save();

    if (supabase) {
      supabase.from('bookings').insert([bookingToSupabase(newBooking)])
        .select()
        .then(({ data, error }) => {
          if (error) console.error('❌ [Supabase] Insert booking error:', error.message);
          else if (data && data[0]) {
            console.log(`⚡ [Supabase] Booking registered in Supabase (booking_id: ${data[0].booking_id})`);
            if (data[0].booking_id !== newBooking.bookingId) {
              newBooking.bookingId = Number(data[0].booking_id);
              this.save();
            }
          }
        })
        .catch(err => console.error('❌ [Supabase] Insert booking exception:', err.message));

      if (isAutoApprove) {
        supabase.from('rides').update({ available_seats: ride.availableSeats }).eq('ride_id', ride.rideId)
          .then(({ error }) => { if (error) console.error('❌ [Supabase] Update seat count error:', error.message); })
          .catch(err => console.error(err));
      }
    }

    return newBooking;
  }

  updateBookingStatus(bookingId, newStatus, reason = '') {
    const booking = this.findBookingById(bookingId);
    if (!booking) throw new Error('Booking not found.');

    const ride = this.findRideById(booking.rideId);
    const oldStatus = booking.status;

    if (oldStatus === newStatus) return booking;

    if (newStatus === 'CONFIRMED') {
      if (!ride || ride.availableSeats < booking.seatCount) {
        throw new Error('Cannot confirm booking: Not enough seats remaining on this ride.');
      }
      if (oldStatus !== 'CONFIRMED') {
        ride.availableSeats -= booking.seatCount;
      }
    } else if (newStatus === 'CANCELLED' || newStatus === 'REJECTED') {
      if (oldStatus === 'CONFIRMED' && ride) {
        ride.availableSeats = Math.min(ride.totalSeats, ride.availableSeats + booking.seatCount);
      }
    }

    booking.status = newStatus;
    if (reason) booking.statusReason = reason;
    this.save();

    if (supabase) {
      supabase.from('bookings').update({ status: newStatus, status_reason: reason || '' }).eq('booking_id', booking.bookingId)
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Update booking error:', error.message); })
        .catch(err => console.error('❌ [Supabase] Update booking status exception:', err.message));

      if (ride) {
        supabase.from('rides').update({ available_seats: ride.availableSeats }).eq('ride_id', ride.rideId)
          .then(({ error }) => { if (error) console.error('❌ [Supabase] Update seat count error:', error.message); })
          .catch(err => console.error(err));
      }
    }

    return booking;
  }

  // --- Feedback ---
  createFeedback(feedbackData, fromUser) {
    const ride = this.findRideById(feedbackData.rideId);
    if (!ride) throw new Error('Ride not found.');
    if (ride.status !== 'COMPLETED') {
      throw new Error('Feedback and ratings can only be submitted for completed rides (FR-25).');
    }

    const ratingVal = Number(feedbackData.rating);
    if (isNaN(ratingVal) || ratingVal < 1 || ratingVal > 5) {
      throw new Error('Rating must be between 1 and 5 stars.');
    }

    const nextId = this.data.feedbacks.length ? Math.max(...this.data.feedbacks.map(f => f.feedbackId)) + 1 : 1;
    const newFeedback = {
      feedbackId: nextId,
      rideId: ride.rideId,
      fromUserId: fromUser.userId,
      fromUserName: fromUser.name,
      fromUserRole: fromUser.role,
      toUserId: Number(feedbackData.toUserId),
      toUserName: feedbackData.toUserName || '',
      rating: ratingVal,
      comments: feedbackData.comments || '',
      createdAt: new Date().toISOString()
    };

    this.data.feedbacks.unshift(newFeedback);

    const targetUser = this.findUserById(newFeedback.toUserId);
    if (targetUser) {
      const userFeedbacks = this.data.feedbacks.filter(f => f.toUserId === targetUser.userId);
      const totalScore = userFeedbacks.reduce((sum, f) => sum + f.rating, 0);
      targetUser.totalRatingsCount = userFeedbacks.length;
      targetUser.averageRating = Number((totalScore / userFeedbacks.length).toFixed(1));
    }

    this.save();

    if (supabase) {
      supabase.from('feedbacks').insert([feedbackToSupabase(newFeedback)])
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Insert feedback error:', error.message); })
        .catch(err => console.error('❌ [Supabase] Insert feedback exception:', err.message));

      if (targetUser) {
        supabase.from('users').update({
          average_rating: targetUser.averageRating,
          total_ratings_count: targetUser.totalRatingsCount
        }).eq('user_id', targetUser.userId)
          .then(({ error }) => { if (error) console.error('❌ [Supabase] Update user rating error:', error.message); })
          .catch(err => console.error(err));
      }
    }

    return newFeedback;
  }

  // --- Notifications ---
  createNotification(userId, type, title, message) {
    const nextId = this.data.notifications.length ? Math.max(...this.data.notifications.map(n => n.notificationId)) + 1 : 1;
    const notif = {
      notificationId: nextId,
      userId: Number(userId),
      type,
      title,
      message,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.unshift(notif);
    this.save();

    if (supabase) {
      supabase.from('notifications').insert([notificationToSupabase(notif)])
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Insert notification error:', error.message); })
        .catch(err => console.error('❌ [Supabase] Insert notification exception:', err.message));
    }

    return notif;
  }

  getUserNotifications(userId) {
    return this.data.notifications.filter(n => n.userId === Number(userId));
  }

  markNotificationAsRead(notifId, userId) {
    const notif = this.data.notifications.find(n => n.notificationId === Number(notifId) && n.userId === Number(userId));
    if (notif) {
      notif.isRead = true;
      this.save();

      if (supabase) {
        supabase.from('notifications').update({ is_read: true }).eq('notification_id', Number(notifId))
          .then(({ error }) => { if (error) console.error('❌ [Supabase] Mark notification read error:', error.message); })
          .catch(err => console.error(err));
      }

      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId) {
    this.data.notifications.forEach(n => {
      if (n.userId === Number(userId)) {
        n.isRead = true;
      }
    });
    this.save();

    if (supabase) {
      supabase.from('notifications').update({ is_read: true }).eq('user_id', Number(userId))
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Mark all notifications read error:', error.message); })
        .catch(err => console.error(err));
    }

    return true;
  }

  // --- Complaints ---
  createComplaint(complaintData, fromUser) {
    const nextId = this.data.complaints.length ? Math.max(...this.data.complaints.map(c => c.complaintId)) + 1 : 1;
    const newComplaint = {
      complaintId: nextId,
      fromUserId: fromUser.userId,
      fromUserName: fromUser.name,
      fromUserEmail: fromUser.email,
      againstUserId: complaintData.againstUserId ? Number(complaintData.againstUserId) : null,
      againstUserName: complaintData.againstUserName || 'N/A',
      rideId: complaintData.rideId ? Number(complaintData.rideId) : null,
      category: complaintData.category || 'GENERAL_ISSUE',
      subject: complaintData.subject,
      description: complaintData.description,
      status: 'OPEN',
      assignedTo: 'Admin Team',
      resolutionNote: '',
      createdAt: new Date().toISOString()
    };
    this.data.complaints.unshift(newComplaint);
    this.save();

    if (supabase) {
      supabase.from('complaints').insert([complaintToSupabase(newComplaint)])
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Insert complaint error:', error.message); })
        .catch(err => console.error('❌ [Supabase] Insert complaint exception:', err.message));
    }

    return newComplaint;
  }

  updateComplaintStatus(complaintId, status, resolutionNote = '') {
    const complaint = this.data.complaints.find(c => c.complaintId === Number(complaintId));
    if (!complaint) return null;
    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      complaint.resolvedAt = new Date().toISOString();
    }
    this.save();

    if (supabase) {
      supabase.from('complaints').update({
        status: complaint.status,
        resolution_note: complaint.resolutionNote,
        resolved_at: complaint.resolvedAt
      }).eq('complaint_id', complaint.complaintId)
        .then(({ error }) => { if (error) console.error('❌ [Supabase] Update complaint error:', error.message); })
        .catch(err => console.error('❌ [Supabase] Update complaint exception:', err.message));
    }

    return complaint;
  }
}

const db = new Database();
module.exports = db;
