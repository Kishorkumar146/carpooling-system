-- ====================================================================
-- CARPOOLING SYSTEM AND RIDE ALLOCATION (SRS v1.0)
-- SUPABASE POSTGRESQL DATABASE SCHEMA & SEED DATA
-- ====================================================================

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS complaints CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS feedbacks CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rides CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE USERS TABLE (FR-1 to FR-5)
CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'PASSENGER', -- 'PASSENGER', 'DRIVER', 'ADMINISTRATOR'
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',  -- 'ACTIVE', 'SUSPENDED'
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    license_no VARCHAR(100) DEFAULT '',
    vehicle_no VARCHAR(50) DEFAULT '',
    vehicle_type VARCHAR(100) DEFAULT '',
    average_rating NUMERIC(3, 1) DEFAULT 5.0,
    total_ratings_count INT DEFAULT 0,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE RIDES TABLE (FR-6 to FR-10)
CREATE TABLE rides (
    ride_id BIGSERIAL PRIMARY KEY,
    driver_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    driver_name VARCHAR(150) NOT NULL,
    driver_phone VARCHAR(50),
    driver_rating NUMERIC(3, 1) DEFAULT 5.0,
    vehicle_no VARCHAR(50),
    vehicle_type VARCHAR(100),
    source VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    stops JSONB DEFAULT '[]'::jsonb,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    total_seats INT NOT NULL CHECK (total_seats > 0),
    available_seats INT NOT NULL CHECK (available_seats >= 0),
    fare NUMERIC(10, 2) NOT NULL CHECK (fare >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'CANCELLED', 'DEACTIVATED'
    notes TEXT DEFAULT '',
    features JSONB DEFAULT '["AC", "Music"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE BOOKINGS TABLE (FR-16 to FR-20)
CREATE TABLE bookings (
    booking_id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES rides(ride_id) ON DELETE CASCADE,
    passenger_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    passenger_name VARCHAR(150) NOT NULL,
    passenger_phone VARCHAR(50),
    driver_id BIGINT REFERENCES users(user_id),
    driver_name VARCHAR(150) NOT NULL,
    seat_count INT NOT NULL DEFAULT 1 CHECK (seat_count > 0),
    total_fare NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'REJECTED'
    status_reason TEXT DEFAULT '',
    booking_date TIMESTAMPTZ DEFAULT NOW(),
    pickup_location VARCHAR(255) NOT NULL,
    drop_location VARCHAR(255) NOT NULL,
    notes TEXT DEFAULT ''
);

-- 5. CREATE FEEDBACKS TABLE (FR-25 to FR-28)
CREATE TABLE feedbacks (
    feedback_id BIGSERIAL PRIMARY KEY,
    ride_id BIGINT REFERENCES rides(ride_id) ON DELETE CASCADE,
    from_user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    from_user_name VARCHAR(150) NOT NULL,
    from_user_role VARCHAR(30) NOT NULL,
    to_user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    to_user_name VARCHAR(150) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE NOTIFICATIONS TABLE (FR-21 to FR-24)
CREATE TABLE notifications (
    notification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE COMPLAINTS TABLE (FR-32)
CREATE TABLE complaints (
    complaint_id BIGSERIAL PRIMARY KEY,
    from_user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
    from_user_name VARCHAR(150) NOT NULL,
    from_user_email VARCHAR(255) NOT NULL,
    against_user_id BIGINT,
    against_user_name VARCHAR(150) DEFAULT 'N/A',
    ride_id BIGINT,
    category VARCHAR(100) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'
    assigned_to VARCHAR(100) DEFAULT 'Admin Team',
    resolution_note TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 8. INDEXES FOR PERFORMANCE (NFR-3)
CREATE INDEX idx_rides_source_dest ON rides (source, destination, date);
CREATE INDEX idx_bookings_user ON bookings (passenger_id, ride_id);
CREATE INDEX idx_notifs_user ON notifications (user_id, is_read);

-- 9. INITIAL SEED SAMPLE DATA (Default password for all sample users: 'password123')
-- BCrypt hash for 'password123': $2a$10$fG6T6iI3zW9aC2h7qB9Uye9qG3f8yH.vj3z5d8O3K2J8hF6bX4g1a
INSERT INTO users (user_id, name, email, phone, password, role, status, bio, avatar, license_no, vehicle_no, vehicle_type, average_rating, total_ratings_count, verified)
VALUES
(1, 'Priya Sharma', 'priya@example.com', '+91 98765 43210', '$2a$10$wE1UjUv0H1hQhU6qIbg23uG0b6qIhgH3mJ9Oq.qFfCgN.Vj5j9cPe', 'PASSENGER', 'ACTIVE', 'Tech professional commuting daily. Enjoys quiet and punctual rides.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', '', '', '', 5.0, 0, false),
(2, 'Rahul Verma', 'rahul@example.com', '+91 98123 45678', '$2a$10$wE1UjUv0H1hQhU6qIbg23uG0b6qIhgH3mJ9Oq.qFfCgN.Vj5j9cPe', 'DRIVER', 'ACTIVE', 'Safe driver with 6+ years experience. AC on, good music, verified profile.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'DL-04-2021-009876', 'KA-01-MJ-5521', 'Sedan (Honda City)', 4.9, 14, true),
(3, 'Arun Sundaram', 'arun@example.com', '+91 97890 12345', '$2a$10$wE1UjUv0H1hQhU6qIbg23uG0b6qIhgH3mJ9Oq.qFfCgN.Vj5j9cPe', 'DRIVER', 'ACTIVE', 'Weekend highway traveler. Punctual, non-smoker, spacious luggage boot.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'TN-07-2019-112233', 'TN-09-CB-4490', 'SUV (Hyundai Creta)', 4.8, 9, true),
(4, 'Administrator', 'admin@carpool.com', '+91 99000 11223', '$2a$10$wE1UjUv0H1hQhU6qIbg23uG0b6qIhgH3mJ9Oq.qFfCgN.Vj5j9cPe', 'ADMINISTRATOR', 'ACTIVE', 'Platform System Administrator & Safety Controller', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', '', '', '', 5.0, 0, true)
ON CONFLICT (user_id) DO NOTHING;

-- Reset sequence generator to match highest user_id
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

INSERT INTO rides (ride_id, driver_id, driver_name, driver_phone, driver_rating, vehicle_no, vehicle_type, source, destination, stops, date, time, total_seats, available_seats, fare, status, notes, features)
VALUES
(101, 2, 'Rahul Verma', '+91 98123 45678', 4.9, 'KA-01-MJ-5521', 'Sedan (Honda City)', 'Bangalore (Electronic City)', 'Chennai (Guindy)', '["Hosur", "Krishnagiri", "Vellore", "Sriperumbudur"]'::jsonb, '2026-10-02', '06:30', 4, 3, 650.00, 'ACTIVE', 'AC car, smooth highway drive. 1 medium bag per passenger. Non-smoking.', '["AC", "Luggage space", "Music", "No Smoking"]'::jsonb),
(102, 3, 'Arun Sundaram', '+91 97890 12345', 4.8, 'TN-09-CB-4490', 'SUV (Hyundai Creta)', 'Chennai (Anna Nagar)', 'Coimbatore (Gandhipuram)', '["Villupuram", "Salem", "Erode"]'::jsonb, '2026-10-03', '05:00', 5, 4, 750.00, 'ACTIVE', 'Early morning start. Comfortable SUV, coffee stops on bypass.', '["AC", "Spacious", "Music Allowed", "Pets Allowed"]'::jsonb),
(103, 2, 'Rahul Verma', '+91 98123 45678', 4.9, 'KA-01-MJ-5521', 'Sedan (Honda City)', 'Bangalore (Koramangala)', 'Mysore (Suburban Bus Stand)', '["Kengeri", "Bidadi", "Mandya"]'::jsonb, '2026-09-29', '17:30', 3, 1, 350.00, 'ACTIVE', 'Evening commute via Expressway. Fast FASTag toll travel.', '["AC", "Expressway Route", "No Smoking"]'::jsonb)
ON CONFLICT (ride_id) DO NOTHING;

SELECT setval('rides_ride_id_seq', (SELECT MAX(ride_id) FROM rides));

INSERT INTO bookings (booking_id, ride_id, passenger_id, passenger_name, passenger_phone, driver_id, driver_name, seat_count, total_fare, status, pickup_location, drop_location, notes)
VALUES
(1001, 101, 1, 'Priya Sharma', '+91 98765 43210', 2, 'Rahul Verma', 1, 650.00, 'CONFIRMED', 'Electronic City Toll Gate', 'Guindy Metro Station', 'Will have one cabin-sized suitcase.')
ON CONFLICT (booking_id) DO NOTHING;

SELECT setval('bookings_booking_id_seq', (SELECT MAX(booking_id) FROM bookings));
