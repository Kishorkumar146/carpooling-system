/**
 * Carpooling System & Ride Allocation (SRS v1.0)
 * Main Frontend Application Script
 */

const API_BASE = '/api';

class CarpoolApp {
  constructor() {
    this.currentUser = null;
    this.token = localStorage.getItem('carpool_token') || null;
    this.currentView = 'home';
    this.selectedRegisterRole = 'PASSENGER'; // 'PASSENGER' or 'DRIVER'
    this.rides = [];
    this.notifications = [];
    this.charts = {};

    this.init();
  }

  async init() {
    this.setupStarRatingEvents();
    if (this.token) {
      await this.fetchCurrentUser();
    } else {
      this.currentUser = null;
      this.updateAuthUI();
    }
    if (this.currentUser && this.currentUser.role === 'DRIVER') {
      this.navigate('driver');
    } else if (this.currentUser && this.currentUser.role === 'ADMINISTRATOR') {
      this.navigate('admin');
    } else {
      await this.loadAllRides();
    }
    this.startNotificationPoller();
  }

  // --- AUTHENTICATION & SESSION ---
  async fetchCurrentUser() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.currentUser = data.user;
        this.updateAuthUI();
        this.fetchNotifications();
      } else {
        this.logout();
      }
    } catch (e) {
      console.error('Session error:', e);
      this.logout();
    }
  }

  updateAuthUI() {
    const authActions = document.getElementById('authActions');
    const navLinks = document.getElementById('navLinks');
    const notifWrapper = document.getElementById('notifWrapper');
    const heroActions = document.getElementById('heroActions');
    const heroTag = document.getElementById('heroTag');
    const heroTitle = document.getElementById('heroTitle');

    if (!this.currentUser) {
      // Guest User View
      if (notifWrapper) notifWrapper.style.display = 'none';
      if (authActions) {
        authActions.innerHTML = `
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-outline btn-sm" onclick="app.openAuth('login')">
              <i class="fa-solid fa-right-to-bracket"></i> Sign In
            </button>
            <button class="btn btn-primary btn-sm" onclick="app.openAuth('register')">
              <i class="fa-solid fa-user-plus"></i> Join Now
            </button>
          </div>
        `;
      }

      if (navLinks) {
        navLinks.innerHTML = `
          <li><a class="nav-link ${this.currentView === 'home' ? 'active' : ''}" onclick="app.navigate('home')"><i class="fa-solid fa-magnifying-glass"></i> Browse Rides</a></li>
          <li><a class="nav-link ${this.currentView === 'login' ? 'active' : ''}" onclick="app.openAuth('login')"><i class="fa-solid fa-right-to-bracket"></i> Sign In / Register</a></li>
        `;
      }

      if (heroTag) heroTag.innerHTML = `<i class="fa-solid fa-leaf"></i> Sustainable & Affordable Commuting`;
      if (heroTitle) heroTitle.innerText = `Share Your Journey, Cut Costs, Travel Together`;
      if (heroActions) {
        heroActions.innerHTML = `
          <button class="btn btn-primary btn-lg" onclick="app.openAuth('login')">
            <i class="fa-solid fa-right-to-bracket"></i> Get Started / Sign In
          </button>
          <button class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.1);" onclick="document.getElementById('searchSection').scrollIntoView({behavior: 'smooth'})">
            <i class="fa-solid fa-magnifying-glass"></i> Browse Available Rides
          </button>
        `;
      }

      if (this.currentView !== 'home' && this.currentView !== 'login') {
        this.navigate('home');
      }
    } else {
      // Authenticated User View
      if (notifWrapper) notifWrapper.style.display = 'block';
      const role = this.currentUser.role;

      if (authActions) {
        authActions.innerHTML = `
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px; cursor: pointer;" onclick="app.openProfileModal()">
              <img src="${this.currentUser.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}" alt="Avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid var(--primary);">
              <div style="line-height: 1.2;">
                <div style="font-size: 0.85rem; font-weight: 700; color: var(--dark);">${this.currentUser.name}</div>
                <span class="badge badge-role" style="font-size: 0.65rem; padding: 1px 6px;">${role}</span>
              </div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="app.logout()" title="Logout" style="padding: 6px 10px;">
              <i class="fa-solid fa-arrow-right-from-bracket"></i>
            </button>
          </div>
        `;
      }

      // Build Navigation Links based on role
      let linksHtml = '';

      if (role === 'PASSENGER') {
        linksHtml = `
          <li><a class="nav-link ${this.currentView === 'home' ? 'active' : ''}" onclick="app.navigate('home')"><i class="fa-solid fa-magnifying-glass"></i> Browse Rides</a></li>
          <li><a class="nav-link ${this.currentView === 'passenger' ? 'active' : ''}" onclick="app.navigate('passenger')"><i class="fa-solid fa-ticket"></i> My Bookings</a></li>
        `;
        if (heroTag) heroTag.innerHTML = `<i class="fa-solid fa-user-check"></i> Logged In as Passenger (${this.currentUser.name})`;
        if (heroTitle) heroTitle.innerText = `Ready for Your Next Trip, ${this.currentUser.name.split(' ')[0]}?`;
        if (heroActions) {
          heroActions.innerHTML = `
            <button class="btn btn-primary btn-lg" onclick="app.navigate('passenger')">
              <i class="fa-solid fa-ticket"></i> View My Bookings
            </button>
            <button class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.1);" onclick="document.getElementById('searchSection').scrollIntoView({behavior: 'smooth'})">
              <i class="fa-solid fa-magnifying-glass"></i> Search Available Rides
            </button>
          `;
        }
      } else if (role === 'DRIVER') {
        linksHtml = `
          <li><a class="nav-link ${this.currentView === 'driver' ? 'active' : ''}" onclick="app.navigate('driver')"><i class="fa-solid fa-car-side"></i> My Published Rides</a></li>
          <li><a class="nav-link" onclick="app.openModal('modal-post-ride')"><i class="fa-solid fa-plus-circle"></i> Offer New Ride</a></li>
        `;
        if (heroTag) heroTag.innerHTML = `<i class="fa-solid fa-car"></i> Logged In as Driver (${this.currentUser.name})`;
        if (heroTitle) heroTitle.innerText = `Publish Rides & Manage Your Vehicle Capacity`;
        if (heroActions) {
          heroActions.innerHTML = `
            <button class="btn btn-success btn-lg" onclick="app.openModal('modal-post-ride')">
              <i class="fa-solid fa-plus-circle"></i> Offer a New Ride
            </button>
            <button class="btn btn-primary btn-lg" onclick="app.navigate('driver')">
              <i class="fa-solid fa-gauge-high"></i> Open Driver Desk
            </button>
          `;
        }
      } else if (role === 'ADMINISTRATOR') {
        linksHtml = `
          <li><a class="nav-link ${this.currentView === 'admin' ? 'active' : ''}" onclick="app.navigate('admin')"><i class="fa-solid fa-shield-halved"></i> Admin Console</a></li>
          <li><a class="nav-link ${this.currentView === 'driver' ? 'active' : ''}" onclick="app.navigate('driver')"><i class="fa-solid fa-car"></i> Driver View</a></li>
          <li><a class="nav-link ${this.currentView === 'passenger' ? 'active' : ''}" onclick="app.navigate('passenger')"><i class="fa-solid fa-ticket"></i> Passenger View</a></li>
          <li><a class="nav-link ${this.currentView === 'home' ? 'active' : ''}" onclick="app.navigate('home')"><i class="fa-solid fa-magnifying-glass"></i> Browse Rides</a></li>
        `;
        if (heroTag) heroTag.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Administrator Active Session`;
        if (heroTitle) heroTitle.innerText = `System Administration & Ride Overview`;
        if (heroActions) {
          heroActions.innerHTML = `
            <button class="btn btn-primary btn-lg" onclick="app.navigate('admin')">
              <i class="fa-solid fa-shield-halved"></i> Open Admin Console
            </button>
            <button class="btn btn-outline btn-lg" style="color: white; border-color: rgba(255,255,255,0.4); background: rgba(255,255,255,0.1);" onclick="document.getElementById('searchSection').scrollIntoView({behavior: 'smooth'})">
              <i class="fa-solid fa-magnifying-glass"></i> View Rides Below
            </button>
          `;
        }
      }

      if (navLinks) navLinks.innerHTML = linksHtml;
    }
  }

  // --- MODERN AUTHENTICATION & PORTAL LOGIC ---
  openAuth(tab = 'login', role = 'PASSENGER') {
    this.navigate('login');
    this.switchAuthTab(tab);
    if (role) {
      this.setRegisterRole(role);
    }
  }

  // Compatibility alias for existing links
  selectLoginMode(mode) {
    if (mode === 'GUEST') {
      if (this.currentUser) this.logout();
      this.navigate('home');
      this.showToast('Exploring platform as Guest User.', 'info');
      return;
    }
    if (mode === 'DRIVER') {
      this.openAuth('register', 'DRIVER');
    } else {
      this.openAuth('login', 'PASSENGER');
    }
  }

  switchAuthTab(tab) {
    const loginSection = document.getElementById('authLoginSection');
    const regSection = document.getElementById('authRegisterSection');
    const tabBtnLogin = document.getElementById('tabBtnLogin');
    const tabBtnRegister = document.getElementById('tabBtnRegister');

    if (tab === 'login') {
      if (loginSection) loginSection.style.display = 'block';
      if (regSection) regSection.style.display = 'none';
      if (tabBtnLogin) tabBtnLogin.classList.add('active');
      if (tabBtnRegister) tabBtnRegister.classList.remove('active');
    } else {
      if (loginSection) loginSection.style.display = 'none';
      if (regSection) regSection.style.display = 'block';
      if (tabBtnLogin) tabBtnLogin.classList.remove('active');
      if (tabBtnRegister) tabBtnRegister.classList.add('active');
    }
  }

  setRegisterRole(role) {
    this.selectedRegisterRole = role;
    const choicePassenger = document.getElementById('roleChoicePassenger');
    const choiceDriver = document.getElementById('roleChoiceDriver');
    const dedDriverFields = document.getElementById('dedDriverFields');

    if (role === 'DRIVER') {
      if (choicePassenger) choicePassenger.classList.remove('active');
      if (choiceDriver) choiceDriver.classList.add('active');
      if (dedDriverFields) dedDriverFields.style.display = 'block';
    } else {
      if (choicePassenger) choicePassenger.classList.add('active');
      if (choiceDriver) choiceDriver.classList.remove('active');
      if (dedDriverFields) dedDriverFields.style.display = 'none';
    }
  }

  togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    if (!input || !icon) return;

    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }

  async handleDedicatedLogin(e) {
    e.preventDefault();
    const email = document.getElementById('dedicatedLoginEmail').value.trim();
    const password = document.getElementById('dedicatedLoginPassword').value;
    const submitBtn = document.getElementById('btnLoginSubmit');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.success) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('carpool_token', data.token);
        this.updateAuthUI();

        // Redirect based on user's authorized role
        if (data.user.role === 'ADMINISTRATOR') {
          this.showToast(`Logged in as Administrator (${data.user.name})`, 'success');
          this.navigate('admin');
        } else if (data.user.role === 'DRIVER') {
          this.showToast(`Welcome back, Driver ${data.user.name}!`, 'success');
          this.navigate('driver');
        } else {
          this.showToast(`Welcome back, ${data.user.name}!`, 'success');
          this.navigate('passenger');
        }
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Login failed: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Sign In to Account</span> <i class="fa-solid fa-arrow-right"></i>';
      }
    }
  }

  async handleDedicatedRegister(e) {
    e.preventDefault();
    const name = document.getElementById('dedRegName').value.trim();
    const email = document.getElementById('dedRegEmail').value.trim();
    const phone = document.getElementById('dedRegPhone').value.trim();
    const password = document.getElementById('dedRegPassword').value;
    const role = this.selectedRegisterRole || 'PASSENGER';

    const licenseNo = document.getElementById('dedRegLicense') ? document.getElementById('dedRegLicense').value.trim() : '';
    const vehicleNo = document.getElementById('dedRegVehicleNo') ? document.getElementById('dedRegVehicleNo').value.trim() : '';
    const vehicleType = document.getElementById('dedRegVehicleType') ? document.getElementById('dedRegVehicleType').value.trim() : '';

    const submitBtn = document.getElementById('btnRegisterSubmit');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, phone, password, role, licenseNo, vehicleNo, vehicleType
        })
      });
      const data = await res.json();
      if (data.success) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('carpool_token', data.token);
        this.updateAuthUI();
        this.showToast('Account registered successfully!', 'success');

        if (data.user.role === 'DRIVER') {
          this.navigate('driver');
        } else {
          this.navigate('passenger');
        }
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Registration failed: ' + err.message, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>Create Account</span> <i class="fa-solid fa-check"></i>';
      }
    }
  }

  logout() {
    this.currentUser = null;
    this.token = null;
    localStorage.removeItem('carpool_token');
    this.updateAuthUI();
    this.navigate('home');
    this.showToast('You have been logged out.', 'info');
  }

  // --- NAVIGATION ROUTING ---
  navigate(viewName) {
    if (this.currentUser && this.currentUser.role === 'DRIVER' && (viewName === 'home' || !viewName)) {
      viewName = 'driver';
    }

    this.currentView = viewName;

    document.querySelectorAll('.app-view').forEach(view => {
      view.style.display = 'none';
    });

    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    this.updateAuthUI();

    if (viewName === 'passenger') {
      this.loadPassengerBookings();
    } else if (viewName === 'driver') {
      this.loadDriverDashboard();
    } else if (viewName === 'admin') {
      this.loadAdminData();
    } else if (viewName === 'home') {
      this.loadAllRides();
    }
  }

  handleBrandClick() {
    if (this.currentUser) {
      if (this.currentUser.role === 'DRIVER') {
        this.navigate('driver');
      } else if (this.currentUser.role === 'ADMINISTRATOR') {
        this.navigate('admin');
      } else {
        this.navigate('home');
      }
    } else {
      this.navigate('home');
    }
  }

  // --- RIDES CATALOG & SEARCH ---
  async loadAllRides(queryParams = '') {
    try {
      const res = await fetch(`${API_BASE}/rides${queryParams}`);
      const data = await res.json();
      if (data.success) {
        this.rides = data.rides;
        this.renderRides(data.rides);
      }
    } catch (e) {
      console.error('Failed to load rides:', e);
    }
  }

  async handleRideSearch(e) {
    e.preventDefault();
    const source = document.getElementById('searchSource').value.trim();
    const destination = document.getElementById('searchDestination').value.trim();
    const date = document.getElementById('searchDate').value;
    const minSeats = document.getElementById('searchSeats').value;

    const params = new URLSearchParams();
    if (source) params.append('source', source);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (minSeats) params.append('minSeats', minSeats);

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    await this.loadAllRides(queryStr);

    const count = this.rides.length;
    document.getElementById('ridesSectionTitle').innerText = count > 0 ? `Found ${count} Matching Ride(s)` : 'No Rides Found';
    document.getElementById('ridesSubtitle').innerText = count > 0 ? 'Select a ride to review details and reserve seats' : 'Try adjusting your search criteria or date filter.';
  }

  renderRides(ridesList) {
    const container = document.getElementById('ridesContainer');
    if (!container) return;

    if (!ridesList || ridesList.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px 20px; background: white; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <i class="fa-solid fa-car-tunnel" style="font-size: 3rem; color: var(--text-light); margin-bottom: 16px;"></i>
          <h3>No Available Rides Found</h3>
          <p style="color: var(--text-muted); max-width: 400px; margin: 8px auto 20px;">No driver has scheduled an active carpool matching these criteria yet.</p>
          <button class="btn btn-secondary" onclick="app.loadAllRides()">Show All Available Rides</button>
        </div>
      `;
      return;
    }

    container.innerHTML = ridesList.map(ride => {
      const isFull = ride.availableSeats <= 0;
      const features = Array.isArray(ride.features) ? ride.features : [];

      return `
        <div class="ride-card">
          <div>
            <div class="ride-card-header">
              <div class="driver-pill">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" class="driver-avatar" alt="Driver">
                <div class="driver-info">
                  <h4>${ride.driverName}</h4>
                  <div class="driver-rating">
                    <i class="fa-solid fa-star"></i> ${ride.driverRating || '5.0'}
                    <span style="color: var(--text-light); font-weight: normal; margin-left: 4px;">• ${ride.vehicleType || 'Car'}</span>
                  </div>
                </div>
              </div>
              <div class="ride-price">
                <div class="price-value">₹${ride.fare}</div>
                <div class="price-unit">per seat</div>
              </div>
            </div>

            <!-- Route Timeline -->
            <div class="route-timeline">
              <div class="route-point">
                <i class="fa-solid fa-circle-dot" style="color: var(--primary);"></i>
                <span>${ride.source}</span>
              </div>
              <div class="route-arrow">
                <i class="fa-solid fa-arrow-down-long"></i>
              </div>
              <div class="route-point">
                <i class="fa-solid fa-location-dot" style="color: var(--danger);"></i>
                <span>${ride.destination}</span>
              </div>
              ${ride.stops && ride.stops.length > 0 ? `
                <div class="route-stops">
                  <i class="fa-solid fa-route"></i> Via: ${ride.stops.join(' → ')}
                </div>
              ` : ''}
            </div>

            <div class="ride-meta-row">
              <div>
                <i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> ${ride.date}
                <span style="margin-left: 8px;"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i> ${ride.time}</span>
              </div>
              <div class="seat-indicator ${isFull ? 'full' : 'available'}">
                <i class="fa-solid fa-chair"></i>
                <span>${ride.availableSeats} of ${ride.totalSeats} seats open</span>
              </div>
            </div>

            <div class="ride-tags">
              ${features.map(f => `<span class="ride-tag"><i class="fa-solid fa-check" style="font-size: 0.65rem;"></i> ${f}</span>`).join('')}
              ${ride.vehicleNo ? `<span class="ride-tag"><i class="fa-solid fa-id-card"></i> ${ride.vehicleNo}</span>` : ''}
            </div>

            ${ride.notes ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 14px; font-style: italic;">"${ride.notes}"</p>` : ''}
          </div>

          <div style="margin-top: 14px;">
            ${isFull ? `
              <button class="btn btn-outline btn-sm" style="width: 100%; opacity: 0.6; cursor: not-allowed;" disabled>
                <i class="fa-solid fa-ban"></i> Ride Fully Booked
              </button>
            ` : (this.currentUser && this.currentUser.userId === ride.driverId) ? `
              <button class="btn btn-secondary" style="width: 100%;" onclick="app.navigate('driver')">
                <i class="fa-solid fa-car"></i> Your Ride Offer (Manage)
              </button>
            ` : `
              <button class="btn btn-primary" style="width: 100%;" onclick="app.openBookRideModal(${ride.rideId})">
                <i class="fa-solid fa-ticket"></i> Book Ride Seats
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  }

  // --- BOOKING MODAL & FLOW (PASSENGER) ---
  openBookRideModal(rideId) {
    if (!this.currentUser) {
      this.showToast('Please log in or select Passenger Mode to book a ride.', 'warning');
      this.selectLoginMode('PASSENGER');
      return;
    }

    const ride = this.rides.find(r => r.rideId === Number(rideId));
    if (!ride) return;

    if (this.currentUser.userId === ride.driverId) {
      this.showToast('You cannot book your own ride offer.', 'warning');
      return;
    }

    document.getElementById('bookRideId').value = ride.rideId;
    document.getElementById('bookRideRoute').innerText = `${ride.source} → ${ride.destination}`;
    document.getElementById('bookRideSchedule').innerText = `Date: ${ride.date} | Departure: ${ride.time} hrs`;
    document.getElementById('bookRideDriver').innerText = `Driver: ${ride.driverName} (${ride.vehicleType || 'Car'} • Reg: ${ride.vehicleNo || 'N/A'})`;
    document.getElementById('bookPickup').value = ride.source;
    document.getElementById('bookDrop').value = ride.destination;

    const seatSelect = document.getElementById('bookSeatCount');
    seatSelect.innerHTML = '';
    for (let i = 1; i <= Math.min(ride.availableSeats, 4); i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.innerText = `${i} Seat${i > 1 ? 's' : ''} (₹${ride.fare * i})`;
      seatSelect.appendChild(opt);
    }

    this.updateBookingPriceCalculation();
    this.openModal('modal-book-ride');
  }

  updateBookingPriceCalculation() {
    const rideId = document.getElementById('bookRideId').value;
    const ride = this.rides.find(r => r.rideId === Number(rideId));
    const seatCount = Number(document.getElementById('bookSeatCount').value) || 1;
    if (ride) {
      const total = ride.fare * seatCount;
      document.getElementById('bookTotalFareDisplay').innerText = `₹${total}`;
    }
  }

  async handleBookRideSubmit(e) {
    e.preventDefault();
    const rideId = Number(document.getElementById('bookRideId').value);
    const seatCount = Number(document.getElementById('bookSeatCount').value);
    const pickupLocation = document.getElementById('bookPickup').value.trim();
    const dropLocation = document.getElementById('bookDrop').value.trim();
    const notes = document.getElementById('bookNotes').value.trim();

    try {
      const res = await fetch(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          rideId,
          seatCount,
          pickupLocation,
          dropLocation,
          notes
        })
      });
      const data = await res.json();
      if (data.success) {
        this.closeModal('modal-book-ride');
        this.showToast('Booking submitted successfully! Driver has been notified.', 'success');
        await this.loadAllRides();
        this.navigate('passenger');
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Booking failed: ' + err.message, 'error');
    }
  }

  // --- PASSENGER DASHBOARD ---
  async loadPassengerBookings() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/passenger/my-bookings`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.renderPassengerBookings(data.bookings);
      }
      this.loadPassengerComplaints();
    } catch (e) {
      console.error('Error loading passenger bookings:', e);
    }
  }

  renderPassengerBookings(bookings) {
    const tbody = document.getElementById('passengerBookingsTbody');
    const countBadge = document.getElementById('passengerBookingCountBadge');
    if (!tbody) return;

    countBadge.innerText = `${bookings.length} Total Bookings`;

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 32px; color: var(--text-muted);">
            You have not booked any rides yet. <a href="#" onclick="app.navigate('home'); return false;">Explore available carpools</a>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings.map(b => {
      const ride = b.ride || {};
      const statusBadge = `<span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>`;

      return `
        <tr>
          <td><strong>#BK-${b.bookingId}</strong></td>
          <td>
            <div style="font-weight: 600;">${ride.source || 'N/A'} → ${ride.destination || 'N/A'}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);"><i class="fa-solid fa-car"></i> Driver: ${b.driverName}</div>
          </td>
          <td>
            <div>${ride.date || 'N/A'}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${ride.time || 'N/A'} hrs</div>
          </td>
          <td>
            <div>${b.seatCount} Seat(s)</div>
            <div style="font-weight: 700; color: var(--primary);">₹${b.totalFare}</div>
          </td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button class="btn btn-outline btn-sm" onclick="app.viewTicket(${b.bookingId})" title="View E-Ticket">
                <i class="fa-solid fa-receipt"></i> Ticket
              </button>
              ${b.status === 'PENDING' || b.status === 'CONFIRMED' ? `
                <button class="btn btn-danger btn-sm" onclick="app.cancelBookingPassenger(${b.bookingId})" title="Cancel Booking">
                  <i class="fa-solid fa-xmark"></i> Cancel
                </button>
              ` : ''}
              ${b.status === 'COMPLETED' ? `
                <button class="btn btn-primary btn-sm" onclick="app.openFeedbackModal(${b.rideId}, ${b.driverId}, '${b.driverName}')">
                  <i class="fa-solid fa-star"></i> Rate
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  async cancelBookingPassenger(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: 'CANCELLED', reason: 'Cancelled by passenger' })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Booking cancelled and seat released.', 'info');
        this.loadPassengerBookings();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (e) {
      this.showToast('Cancel action failed', 'error');
    }
  }

  viewTicket(bookingId) {
    fetch(`${API_BASE}/passenger/my-bookings`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    })
      .then(res => res.json())
      .then(data => {
        const booking = data.bookings.find(b => b.bookingId === Number(bookingId));
        if (!booking) return;

        const ride = booking.ride || {};
        const content = document.getElementById('ticketContent');
        content.innerHTML = `
          <div style="border: 2px dashed #cbd5e1; border-radius: var(--radius-lg); padding: 20px; background: #fafafa;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 14px;">
              <div>
                <h4 style="font-size: 1.2rem; color: var(--primary);"><i class="fa-solid fa-car"></i> CarpoolGo E-Pass</h4>
                <div style="font-size: 0.78rem; color: var(--text-muted);">Verified Travel Ticket</div>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.75rem; color: var(--text-light);">TICKET NUMBER</div>
                <div style="font-weight: 800; font-size: 1.1rem;">#BK-${booking.bookingId}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">PASSENGER NAME</div>
                <div style="font-weight: 700;">${booking.passengerName}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${booking.passengerPhone}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">DRIVER & VEHICLE</div>
                <div style="font-weight: 700;">${booking.driverName}</div>
                <div style="font-size: 0.8rem; color: var(--text-light);">${ride.vehicleType || 'Car'} (${ride.vehicleNo || 'N/A'})</div>
              </div>
            </div>

            <div style="background: white; border-radius: var(--radius-md); padding: 12px; border: 1px solid #e2e8f0; margin-bottom: 16px;">
              <div style="display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 4px;">
                <span>Route:</span>
                <span>${ride.source} → ${ride.destination}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">
                <span>Pickup Point:</span>
                <span>${booking.pickupLocation}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--text-muted);">
                <span>Date & Time:</span>
                <span>${ride.date} at ${ride.time} hrs</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #cbd5e1; padding-top: 12px;">
              <div>
                <span class="badge badge-${booking.status.toLowerCase()}">${booking.status}</span>
                <span style="font-size: 0.8rem; margin-left: 8px;">${booking.seatCount} Reserved Seat(s)</span>
              </div>
              <div style="text-align: right;">
                <div style="font-size: 0.75rem; color: var(--text-muted);">TOTAL FARE</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--primary);">₹${booking.totalFare}</div>
              </div>
            </div>
          </div>
        `;
        this.openModal('modal-ticket');
      });
  }

  // --- DRIVER DASHBOARD ---
  async loadDriverDashboard() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/driver/my-rides`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('driverTotalEarnings').innerText = `₹${data.totalEarnings || 0}`;
        document.getElementById('driverActiveRidesCount').innerText = data.activeTrips || 0;
        document.getElementById('driverCompletedTripsCount').innerText = data.completedTrips || 0;
        document.getElementById('driverRatingDisplay').innerText = `${this.currentUser.averageRating || '5.0'} ★`;
        this.renderDriverRides(data.rides);
        this.renderDriverRequests(data.rides);
      }
    } catch (e) {
      console.error('Error loading driver desk:', e);
    }
  }

  renderDriverRides(rides) {
    const tbody = document.getElementById('driverRidesTbody');
    if (!tbody) return;

    if (!rides || rides.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            You haven't posted any rides yet. Click <strong>"Offer a Ride"</strong> to list a journey.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = rides.map(r => {
      const badge = `<span class="badge badge-${r.status.toLowerCase()}">${r.status}</span>`;
      return `
        <tr>
          <td><strong>#RD-${r.rideId}</strong></td>
          <td>
            <div style="font-weight: 600;">${r.source} → ${r.destination}</div>
            ${r.stops && r.stops.length ? `<div style="font-size: 0.75rem; color: var(--text-muted);">Via: ${r.stops.join(', ')}</div>` : ''}
          </td>
          <td>
            <div>${r.date}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${r.time} hrs</div>
          </td>
          <td>
            <strong>${r.availableSeats}</strong> / ${r.totalSeats} Available
          </td>
          <td>₹${r.fare}</td>
          <td>${badge}</td>
          <td>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              ${r.status === 'ACTIVE' ? `
                <button class="btn btn-success btn-sm" onclick="app.updateRideTripStatus(${r.rideId}, 'COMPLETED')" title="Mark Trip Completed">
                  <i class="fa-solid fa-flag-checkered"></i> Complete
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.updateRideTripStatus(${r.rideId}, 'CANCELLED')" title="Cancel Ride Offer">
                  <i class="fa-solid fa-ban"></i> Cancel
                </button>
              ` : `
                <span style="font-size: 0.8rem; color: var(--text-light);">Trip Finalized</span>
              `}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  renderDriverRequests(rides) {
    const tbody = document.getElementById('driverRequestsTbody');
    if (!tbody) return;

    let allRequests = [];
    rides.forEach(r => {
      if (r.bookings && r.bookings.length) {
        r.bookings.forEach(b => {
          allRequests.push({ ...b, rideRoute: `${r.source} → ${r.destination}` });
        });
      }
    });

    if (allRequests.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 32px; color: var(--text-muted);">
            No passenger requests received yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = allRequests.map(b => {
      const badge = `<span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>`;
      return `
        <tr>
          <td><strong>#BK-${b.bookingId}</strong></td>
          <td>
            <div style="font-weight: 600;">${b.passengerName}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">${b.passengerPhone}</div>
          </td>
          <td>${b.rideRoute}</td>
          <td><strong>${b.seatCount}</strong> (₹${b.totalFare})</td>
          <td>
            <div style="font-size: 0.8rem;">Pickup: ${b.pickupLocation}</div>
            ${b.notes ? `<div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">"${b.notes}"</div>` : ''}
          </td>
          <td>${badge}</td>
          <td>
            ${b.status === 'PENDING' ? `
              <div style="display: flex; gap: 4px;">
                <button class="btn btn-success btn-sm" onclick="app.respondBookingRequest(${b.bookingId}, 'CONFIRMED')" title="Accept Passenger">
                  <i class="fa-solid fa-check"></i> Accept
                </button>
                <button class="btn btn-danger btn-sm" onclick="app.respondBookingRequest(${b.bookingId}, 'REJECTED')" title="Reject">
                  <i class="fa-solid fa-xmark"></i> Reject
                </button>
              </div>
            ` : `
              <span style="font-size: 0.8rem; color: var(--text-light);">${b.status}</span>
            `}
          </td>
        </tr>
      `;
    }).join('');
  }

  async respondBookingRequest(bookingId, newStatus) {
    let reason = '';
    if (newStatus === 'REJECTED') {
      reason = prompt('Optional rejection reason to notify passenger:') || 'Seat unavailable';
    }

    try {
      const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Booking request updated to ${newStatus}.`, 'success');
        this.loadDriverDashboard();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (e) {
      this.showToast('Request update failed', 'error');
    }
  }

  async updateRideTripStatus(rideId, status) {
    if (!confirm(`Are you sure you want to mark this ride as ${status}?`)) return;

    try {
      const res = await fetch(`${API_BASE}/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`Ride status marked as ${status}.`, 'success');
        this.loadDriverDashboard();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (e) {
      this.showToast('Status update failed', 'error');
    }
  }

  async handlePostRideSubmit(e) {
    e.preventDefault();
    const source = document.getElementById('postSource').value.trim();
    const destination = document.getElementById('postDestination').value.trim();
    const stops = document.getElementById('postStops').value.trim();
    const date = document.getElementById('postDate').value;
    const time = document.getElementById('postTime').value;
    const totalSeats = document.getElementById('postSeats').value;
    const fare = document.getElementById('postFare').value;
    const vehicleNo = document.getElementById('postVehicleNo').value.trim();
    const vehicleType = document.getElementById('postVehicleType').value.trim();
    const features = document.getElementById('postFeatures').value.trim();
    const notes = document.getElementById('postNotes').value.trim();

    try {
      const res = await fetch(`${API_BASE}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          source, destination, stops, date, time, totalSeats, fare,
          vehicleNo, vehicleType, features, notes
        })
      });
      const data = await res.json();
      if (data.success) {
        this.closeModal('modal-post-ride');
        document.getElementById('postRideForm').reset();
        this.showToast('Ride offer published successfully!', 'success');
        this.loadDriverDashboard();
        this.loadAllRides();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Failed to post ride: ' + err.message, 'error');
    }
  }

  // --- ADMINISTRATOR DASHBOARD & CONTROLS ---
  async loadAdminData() {
    if (!this.token) return;
    try {
      const statsRes = await fetch(`${API_BASE}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const statsData = await statsRes.json();
      if (statsData.success) {
        const s = statsData.stats;
        document.getElementById('adminTotalUsers').innerText = s.totalUsers;
        document.getElementById('adminActiveRides').innerText = s.activeRides;
        document.getElementById('adminTotalBookings').innerText = s.totalBookings;
        document.getElementById('adminOpenComplaints').innerText = s.openComplaints;
        this.renderAdminCharts(s);
      }

      this.loadAdminUsers();
      this.loadAdminRides();
      this.loadAdminComplaints();
    } catch (e) {
      console.error('Admin data load failed:', e);
    }
  }

  renderAdminCharts(stats) {
    const ctx1 = document.getElementById('chartUserDistribution');
    if (ctx1) {
      if (this.charts.userDist) this.charts.userDist.destroy();
      this.charts.userDist = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: ['Passengers', 'Drivers', 'Admins'],
          datasets: [{
            data: [stats.passengersCount, stats.driversCount, 1],
            backgroundColor: ['#4f46e5', '#06b6d4', '#10b981']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }

    const ctx2 = document.getElementById('chartBookingStats');
    if (ctx2) {
      if (this.charts.bookingStats) this.charts.bookingStats.destroy();
      this.charts.bookingStats = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: ['Total Rides', 'Active Rides', 'Confirmed Bookings', 'Completed Bookings'],
          datasets: [{
            label: 'System Counts',
            data: [stats.totalRides, stats.activeRides, stats.confirmedBookings, stats.completedBookings],
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6']
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }
  }

  async loadAdminUsers() {
    try {
      const res = await fetch(`${API_BASE}/admin/users`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const tbody = document.getElementById('adminUsersTbody');
        document.getElementById('adminUserCountBadge').innerText = `${data.users.length} Users`;
        tbody.innerHTML = data.users.map(u => `
          <tr>
            <td><strong>#U-${u.userId}</strong></td>
            <td>
              <div style="font-weight: 600;">${u.name}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${u.email} • ${u.phone}</div>
            </td>
            <td><span class="badge badge-role">${u.role}</span></td>
            <td>
              <div style="font-size: 0.8rem;">${u.licenseNo || '—'}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${u.vehicleNo || ''}</div>
            </td>
            <td>${u.averageRating ? `${u.averageRating} ★` : '—'}</td>
            <td><span class="badge badge-${u.status.toLowerCase()}">${u.status}</span></td>
            <td>
              <div style="display: flex; gap: 4px;">
                ${u.status === 'ACTIVE' ? `
                  <button class="btn btn-outline btn-sm" style="color: var(--danger);" onclick="app.toggleUserSuspension(${u.userId}, 'SUSPENDED')" title="Suspend User">
                    <i class="fa-solid fa-ban"></i> Suspend
                  </button>
                ` : `
                  <button class="btn btn-success btn-sm" onclick="app.toggleUserSuspension(${u.userId}, 'ACTIVE')" title="Reactivate Account">
                    <i class="fa-solid fa-check"></i> Activate
                  </button>
                `}
                <button class="btn btn-outline btn-sm" onclick="app.deleteUserAdmin(${u.userId})" title="Delete Account">
                  <i class="fa-regular fa-trash-can"></i>
                </button>
              </div>
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async toggleUserSuspension(userId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast(`User status updated to ${newStatus}.`, 'success');
        this.loadAdminUsers();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (e) {
      this.showToast('Action failed', 'error');
    }
  }

  async deleteUserAdmin(userId) {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('User account deleted.', 'info');
        this.loadAdminUsers();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (e) {
      this.showToast('Delete failed', 'error');
    }
  }

  async loadAdminRides() {
    try {
      const res = await fetch(`${API_BASE}/admin/rides`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const tbody = document.getElementById('adminRidesTbody');
        tbody.innerHTML = data.rides.map(r => `
          <tr>
            <td><strong>#RD-${r.rideId}</strong></td>
            <td>
              <div style="font-weight: 600;">${r.driverName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${r.vehicleNo || 'N/A'}</div>
            </td>
            <td>${r.source} → ${r.destination}</td>
            <td>${r.date} (${r.time})</td>
            <td>${r.availableSeats}/${r.totalSeats}</td>
            <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
            <td>
              ${r.status === 'ACTIVE' ? `
                <button class="btn btn-danger btn-sm" onclick="app.adminDeactivateRide(${r.rideId})">
                  <i class="fa-solid fa-ban"></i> Deactivate
                </button>
              ` : '—'}
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async adminDeactivateRide(rideId) {
    if (!confirm('Deactivate this ride across the platform?')) return;
    try {
      const res = await fetch(`${API_BASE}/rides/${rideId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: 'DEACTIVATED' })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Ride deactivated.', 'info');
        this.loadAdminRides();
      }
    } catch (e) {
      this.showToast('Action failed', 'error');
    }
  }

  async loadAdminComplaints() {
    try {
      const res = await fetch(`${API_BASE}/admin/complaints`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const tbody = document.getElementById('adminComplaintsTbody');
        tbody.innerHTML = data.complaints.map(c => `
          <tr>
            <td><strong>#CMP-${c.complaintId}</strong></td>
            <td>
              <div style="font-weight: 600;">${c.fromUserName}</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">${c.fromUserEmail}</div>
            </td>
            <td>${c.againstUserName || 'Platform'}</td>
            <td>
              <div style="font-weight: 600;">${c.subject}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${c.description}</div>
            </td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
            <td>
              ${c.status === 'OPEN' || c.status === 'UNDER_REVIEW' ? `
                <button class="btn btn-success btn-sm" onclick="app.resolveComplaintAdmin(${c.complaintId})">
                  <i class="fa-solid fa-check"></i> Resolve
                </button>
              ` : `
                <span style="font-size: 0.78rem; color: var(--text-muted);">${c.resolutionNote || 'Resolved'}</span>
              `}
            </td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  async resolveComplaintAdmin(complaintId) {
    const note = prompt('Enter administrative resolution note:');
    if (!note) return;

    try {
      const res = await fetch(`${API_BASE}/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNote: note })
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Dispute resolved successfully.', 'success');
        this.loadAdminComplaints();
      }
    } catch (e) {
      this.showToast('Resolution update failed', 'error');
    }
  }

  downloadDbBackup() {
    window.location.href = `${API_BASE}/admin/database/backup`;
    this.showToast('Database backup downloaded.', 'success');
  }

  async resetDbDefaults() {
    if (!confirm('Reset entire system database to initial seed dataset?')) return;
    try {
      const res = await fetch(`${API_BASE}/admin/database/reset`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.showToast('Database reset to fresh sample state.', 'success');
        this.loadAdminData();
        this.loadAllRides();
      }
    } catch (e) {
      this.showToast('Reset failed', 'error');
    }
  }

  // --- FEEDBACK & RATING ---
  setupStarRatingEvents() {
    const stars = document.querySelectorAll('#starRatingContainer .star');
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const rating = parseInt(star.getAttribute('data-rating'));
        document.getElementById('feedbackRatingValue').value = rating;
        stars.forEach(s => {
          const sRating = parseInt(s.getAttribute('data-rating'));
          if (sRating <= rating) {
            s.classList.add('filled');
          } else {
            s.classList.remove('filled');
          }
        });
      });
    });
  }

  openFeedbackModal(rideId, toUserId, toUserName) {
    document.getElementById('feedbackRideId').value = rideId;
    document.getElementById('feedbackToUserId').value = toUserId;
    document.getElementById('feedbackToUserName').value = toUserName;
    document.getElementById('feedbackTargetInfo').innerText = `Review for Driver: ${toUserName}`;
    this.openModal('modal-feedback');
  }

  async handleFeedbackSubmit(e) {
    e.preventDefault();
    const rideId = Number(document.getElementById('feedbackRideId').value);
    const toUserId = Number(document.getElementById('feedbackToUserId').value);
    const toUserName = document.getElementById('feedbackToUserName').value;
    const rating = Number(document.getElementById('feedbackRatingValue').value);
    const comments = document.getElementById('feedbackComments').value.trim();

    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ rideId, toUserId, toUserName, rating, comments })
      });
      const data = await res.json();
      if (data.success) {
        this.closeModal('modal-feedback');
        document.getElementById('feedbackForm').reset();
        this.showToast('Thank you! Rating & Review submitted.', 'success');
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Feedback error: ' + err.message, 'error');
    }
  }

  // --- DISPUTES / COMPLAINTS (PASSENGER) ---
  openComplaintModal() {
    this.openModal('modal-complaint');
  }

  async handleComplaintSubmit(e) {
    e.preventDefault();
    const category = document.getElementById('complaintCategory').value;
    const subject = document.getElementById('complaintSubject').value.trim();
    const description = document.getElementById('complaintDescription').value.trim();

    try {
      const res = await fetch(`${API_BASE}/complaints`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ category, subject, description })
      });
      const data = await res.json();
      if (data.success) {
        this.closeModal('modal-complaint');
        document.getElementById('complaintForm').reset();
        this.showToast('Dispute filed with support desk.', 'success');
        this.loadPassengerComplaints();
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Dispute filing failed', 'error');
    }
  }

  async loadPassengerComplaints() {
    try {
      const res = await fetch(`${API_BASE}/complaints/my`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        const tbody = document.getElementById('passengerComplaintsTbody');
        if (!tbody) return;
        if (data.complaints.length === 0) {
          tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 20px;">No complaints filed.</td></tr>`;
          return;
        }
        tbody.innerHTML = data.complaints.map(c => `
          <tr>
            <td>#CMP-${c.complaintId}</td>
            <td>${c.category}</td>
            <td><strong>${c.subject}</strong></td>
            <td>${new Date(c.createdAt).toLocaleDateString()}</td>
            <td><span class="badge badge-${c.status.toLowerCase()}">${c.status}</span></td>
            <td>${c.resolutionNote || 'Pending review'}</td>
          </tr>
        `).join('');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // --- NOTIFICATIONS SYSTEM ---
  async fetchNotifications() {
    if (!this.token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      const data = await res.json();
      if (data.success) {
        this.notifications = data.notifications;
        const badge = document.getElementById('notifBadge');
        if (badge) {
          if (data.unreadCount > 0) {
            badge.innerText = data.unreadCount;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }
        this.renderNotificationList();
      }
    } catch (e) {
      console.error('Notifications fetch failed:', e);
    }
  }

  renderNotificationList() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (this.notifications.length === 0) {
      list.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">No notifications yet.</div>`;
      return;
    }

    list.innerHTML = this.notifications.map(n => `
      <div class="notif-item ${!n.isRead ? 'unread' : ''}" onclick="app.markNotificationRead(${n.notificationId})">
        <div class="notif-icon">
          <i class="fa-solid fa-bell"></i>
        </div>
        <div class="notif-body">
          <h5>${n.title}</h5>
          <p>${n.message}</p>
          <div class="notif-time">${new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>
    `).join('');
  }

  toggleNotifications() {
    const dropdown = document.getElementById('notifDropdown');
    dropdown.classList.toggle('show');
  }

  async markNotificationRead(notifId) {
    try {
      await fetch(`${API_BASE}/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      this.fetchNotifications();
    } catch (e) {
      console.error(e);
    }
  }

  async markAllNotificationsRead() {
    try {
      await fetch(`${API_BASE}/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      this.fetchNotifications();
      this.showToast('All notifications marked as read.', 'info');
    } catch (e) {
      console.error(e);
    }
  }

  startNotificationPoller() {
    setInterval(() => {
      if (this.currentUser && this.token) {
        this.fetchNotifications();
      }
    }, 15000);
  }

  // --- USER PROFILE MODAL ---
  openProfileModal() {
    if (!this.currentUser) return;
    document.getElementById('profName').value = this.currentUser.name || '';
    document.getElementById('profEmail').value = this.currentUser.email || '';
    document.getElementById('profPhone').value = this.currentUser.phone || '';
    document.getElementById('profBio').value = this.currentUser.bio || '';

    const driverSection = document.getElementById('profDriverFields');
    if (this.currentUser.role === 'DRIVER') {
      driverSection.style.display = 'block';
      document.getElementById('profLicense').value = this.currentUser.licenseNo || '';
      document.getElementById('profVehicleNo').value = this.currentUser.vehicleNo || '';
      document.getElementById('profVehicleType').value = this.currentUser.vehicleType || '';
    } else {
      driverSection.style.display = 'none';
    }

    this.openModal('modal-profile');
  }

  async handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById('profName').value;
    const phone = document.getElementById('profPhone').value;
    const bio = document.getElementById('profBio').value;
    const licenseNo = document.getElementById('profLicense').value;
    const vehicleNo = document.getElementById('profVehicleNo').value;
    const vehicleType = document.getElementById('profVehicleType').value;

    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ name, phone, bio, licenseNo, vehicleNo, vehicleType })
      });
      const data = await res.json();
      if (data.success) {
        this.currentUser = data.user;
        this.updateAuthUI();
        this.closeModal('modal-profile');
        this.showToast('Profile updated successfully.', 'success');
      } else {
        this.showToast(data.message, 'error');
      }
    } catch (err) {
      this.showToast('Profile update failed', 'error');
    }
  }

  // --- UI MODAL & TAB HELPERS ---
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  }

  switchPassengerTab(tabName) {
    const tabs = ['bookings', 'complaints'];
    tabs.forEach(t => {
      document.getElementById(`passengerTab-${t}`).style.display = (t === tabName) ? 'block' : 'none';
    });
    document.querySelectorAll('#view-passenger .tab-link').forEach((btn, idx) => {
      btn.classList.toggle('active', (tabName === 'my-bookings' && idx === 0) || (tabName === 'complaints' && idx === 1));
    });
  }

  switchDriverTab(tabName) {
    document.getElementById('driverTab-rides').style.display = (tabName === 'my-rides') ? 'block' : 'none';
    document.getElementById('driverTab-requests').style.display = (tabName === 'requests') ? 'block' : 'none';
    document.querySelectorAll('#view-driver .tab-link').forEach((btn, idx) => {
      btn.classList.toggle('active', (tabName === 'my-rides' && idx === 0) || (tabName === 'requests' && idx === 1));
    });
  }

  switchAdminTab(tabName) {
    const tabs = ['users', 'rides', 'complaints', 'reports'];
    tabs.forEach(t => {
      const el = document.getElementById(`adminTab-${t}`);
      if (el) el.style.display = (t === tabName) ? 'block' : 'none';
    });
    document.querySelectorAll('#view-admin .tab-link').forEach(btn => {
      btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '<i class="fa-solid fa-circle-info" style="color: var(--primary);"></i>';
    if (type === 'success') icon = '<i class="fa-solid fa-circle-check" style="color: var(--accent);"></i>';
    if (type === 'error') icon = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--danger);"></i>';
    if (type === 'warning') icon = '<i class="fa-solid fa-circle-exclamation" style="color: var(--warning);"></i>';

    toast.innerHTML = `
      ${icon}
      <div style="flex: 1;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global App Instance
const app = new CarpoolApp();
