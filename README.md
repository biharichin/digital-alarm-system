<<<<<<< HEAD
# 🚨 Digital Alarm System

A comprehensive digital alarm system with user authentication, multiple alarms, sound notifications, and cross-device synchronization.

## 🌟 Features

- **Multiple Alarms**: Set, edit, and delete multiple alarms
- **Sound Notifications**: Custom alarm sounds with fallback options
- **User Authentication**: Secure login/signup system with age verification
- **Cross-Device Sync**: Alarms sync across all devices via backend
- **Snooze Function**: Snooze alarms for 5 minutes
- **Mobile Optimized**: Responsive design for all devices
- **Local Storage**: Persistent alarm data
- **Admin Dashboard**: User management and statistics (private)

## 🏗️ Architecture

### Frontend (Public)
- **HTML/CSS/JavaScript**: Pure frontend implementation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Local Storage**: Client-side data persistence
- **Sound API**: Web Audio API for alarm sounds

### Backend (Private)
- **Node.js/Express**: RESTful API server
- **User Management**: Registration, login, and session handling
- **Data Storage**: JSON file-based database
- **CORS Support**: Cross-origin resource sharing
- **Password Hashing**: Secure password storage with bcrypt

## 📁 Project Structure

```
digital-alarm-system/
├── alarm-system/          # Frontend files (public)
│   ├── index.html         # Login/Signup page
│   ├── dashboard.html     # Main alarm dashboard
│   ├── script.js          # Alarm system logic
│   ├── styles.css         # Main styling
│   ├── auth.js            # Authentication logic
│   ├── auth-styles.css    # Auth page styling
│   ├── auth-check.js      # Session checking
│   ├── quick-share.html   # Quick sharing feature
│   ├── test-integration.html # API testing tool
│   ├── README.md          # Frontend documentation
│   └── deploy-instructions.md # Deployment guide
└── README.md              # Main documentation
```

## 🚀 Quick Start

### Frontend Only (Public Use)
1. **Download** the `alarm-system/` folder
2. **Open** `alarm-system/index.html` in your browser
3. **Register** a new user account
4. **Start** setting alarms!

### Full System with Backend (Advanced Setup)
For cross-device synchronization, you'll need to set up the backend server:

1. **Clone** this repository
2. **Create** a `backend/` folder with Node.js/Express server
3. **Install** dependencies: `npm install express bcrypt cors`
4. **Start** backend server on port 3000
5. **Open** `alarm-system/index.html` in your browser
6. **Register** and login to sync across devices

## 🔧 Setup Instructions

### Frontend Setup (Public)
Simply open `alarm-system/index.html` in any modern browser.

### Backend Setup (Advanced)
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm install express bcrypt cors

# Create server.js with Express server
# Start server: npm run dev
```

## 📱 Usage

### Registration
1. Open the application
2. Click "Sign Up"
3. Enter username, email, password, and age (18+)
4. Click "Create Account"

### Login
1. Enter your email and password
2. Click "Login"
3. Access your alarm dashboard

### Setting Alarms
1. Click "Add Alarm"
2. Set time and date
3. Choose sound (optional)
4. Click "Save Alarm"

### Managing Alarms
- **Edit**: Click the edit icon
- **Delete**: Click the delete icon
- **Toggle**: Click the alarm to enable/disable
- **Snooze**: Click "Snooze" when alarm rings

## 🔒 Security Features

- **Password Hashing**: Bcrypt encryption
- **Age Verification**: 18+ requirement
- **Session Management**: Secure login sessions
- **Input Validation**: Form validation and sanitization
- **CORS Protection**: Cross-origin security

## 🎵 Sound Features

- **Multiple Formats**: MP3, WAV, OGG support
- **Fallback System**: Automatic format detection
- **Volume Control**: Adjustable alarm volume
- **Test Function**: Preview sounds before setting
- **Mobile Optimized**: Touch-friendly controls

## 🌐 Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design

## 🔧 Technical Details

### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox/Grid
- **JavaScript ES6+**: Modern JavaScript features
- **Web Audio API**: Sound playback
- **Local Storage API**: Data persistence

### Backend Technologies (Advanced Setup)
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **bcrypt**: Password hashing
- **CORS**: Cross-origin support
- **JSON**: Data storage format

## 📝 License

This project is for educational and personal use. Please respect privacy and security guidelines.

## 🤝 Contributing

For private use only. Keep backend files secure and never expose user data.

## 📞 Support

For issues and questions, please check the documentation or contact the developer.

## 🔐 Privacy Notice

=======
# 🚨 Digital Alarm System

A comprehensive digital alarm system with user authentication, multiple alarms, sound notifications, and cross-device synchronization.

## 🌟 Features

- **Multiple Alarms**: Set, edit, and delete multiple alarms
- **Sound Notifications**: Custom alarm sounds with fallback options
- **User Authentication**: Secure login/signup system with age verification
- **Cross-Device Sync**: Alarms sync across all devices via backend
- **Snooze Function**: Snooze alarms for 5 minutes
- **Mobile Optimized**: Responsive design for all devices
- **Local Storage**: Persistent alarm data
- **Admin Dashboard**: User management and statistics (private)

## 🏗️ Architecture

### Frontend (Public)
- **HTML/CSS/JavaScript**: Pure frontend implementation
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Local Storage**: Client-side data persistence
- **Sound API**: Web Audio API for alarm sounds

### Backend (Private)
- **Node.js/Express**: RESTful API server
- **User Management**: Registration, login, and session handling
- **Data Storage**: JSON file-based database
- **CORS Support**: Cross-origin resource sharing
- **Password Hashing**: Secure password storage with bcrypt

## 📁 Project Structure

```
digital-alarm-system/
├── alarm-system/          # Frontend files (public)
│   ├── index.html         # Login/Signup page
│   ├── dashboard.html     # Main alarm dashboard
│   ├── script.js          # Alarm system logic
│   ├── styles.css         # Main styling
│   ├── auth.js            # Authentication logic
│   ├── auth-styles.css    # Auth page styling
│   ├── auth-check.js      # Session checking
│   ├── quick-share.html   # Quick sharing feature
│   ├── test-integration.html # API testing tool
│   ├── README.md          # Frontend documentation
│   └── deploy-instructions.md # Deployment guide
└── README.md              # Main documentation
```

## 🚀 Quick Start

### Frontend Only (Public Use)
1. **Download** the `alarm-system/` folder
2. **Open** `alarm-system/index.html` in your browser
3. **Register** a new user account
4. **Start** setting alarms!

### Full System with Backend (Advanced Setup)
For cross-device synchronization, you'll need to set up the backend server:

1. **Clone** this repository
2. **Create** a `backend/` folder with Node.js/Express server
3. **Install** dependencies: `npm install express bcrypt cors`
4. **Start** backend server on port 3000
5. **Open** `alarm-system/index.html` in your browser
6. **Register** and login to sync across devices

## 🔧 Setup Instructions

### Frontend Setup (Public)
Simply open `alarm-system/index.html` in any modern browser.

### Backend Setup (Advanced)
```bash
# Create backend folder
mkdir backend
cd backend

# Initialize package.json
npm init -y

# Install dependencies
npm install express bcrypt cors

# Create server.js with Express server
# Start server: npm run dev
```

## 📱 Usage

### Registration
1. Open the application
2. Click "Sign Up"
3. Enter username, email, password, and age (18+)
4. Click "Create Account"

### Login
1. Enter your email and password
2. Click "Login"
3. Access your alarm dashboard

### Setting Alarms
1. Click "Add Alarm"
2. Set time and date
3. Choose sound (optional)
4. Click "Save Alarm"

### Managing Alarms
- **Edit**: Click the edit icon
- **Delete**: Click the delete icon
- **Toggle**: Click the alarm to enable/disable
- **Snooze**: Click "Snooze" when alarm rings

## 🔒 Security Features

- **Password Hashing**: Bcrypt encryption
- **Age Verification**: 18+ requirement
- **Session Management**: Secure login sessions
- **Input Validation**: Form validation and sanitization
- **CORS Protection**: Cross-origin security

## 🎵 Sound Features

- **Multiple Formats**: MP3, WAV, OGG support
- **Fallback System**: Automatic format detection
- **Volume Control**: Adjustable alarm volume
- **Test Function**: Preview sounds before setting
- **Mobile Optimized**: Touch-friendly controls

## 🌐 Browser Support

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Responsive design

## 🔧 Technical Details

### Frontend Technologies
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox/Grid
- **JavaScript ES6+**: Modern JavaScript features
- **Web Audio API**: Sound playback
- **Local Storage API**: Data persistence

### Backend Technologies (Advanced Setup)
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **bcrypt**: Password hashing
- **CORS**: Cross-origin support
- **JSON**: Data storage format

## 📝 License

This project is for educational and personal use. Please respect privacy and security guidelines.

## 🤝 Contributing

For private use only. Keep backend files secure and never expose user data.

## 📞 Support

For issues and questions, please check the documentation or contact the developer.

## 🔐 Privacy Notice

>>>>>>> bf947e2cac09ec7cff2d7df34e20b630dc4d4196
This application stores user data locally by default. For cross-device synchronization, a backend server is required. Backend implementation is not included in this public repository for security reasons. 