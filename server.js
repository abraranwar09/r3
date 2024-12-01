const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const connectDB = require('./utils/db'); // Import the database connection function
require('dotenv').config();
require('./utils/passport-setup'); // Import the passport setup
const authRoutes = require('./routes/auth'); // Import the auth routes
const aiRoutes = require('./routes/ai'); // Import the ai routes
const googleRoutes = require('./routes/google'); // Import the google routes

const app = express();
const port = process.env.PORT || 3000;

// Use CORS middleware
app.use(cors());

// Add this line to parse JSON bodies
app.use(express.json());


// Use session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the "public" directory
app.use(express.static('public'));

// Use the auth routes
app.use('/auth', authRoutes);
// Use the ai routes
app.use('/ai', aiRoutes);
// Use the google routes
app.use('/google', googleRoutes);

// Function to start the server
const startServer = async () => {
  try {
    // Connect to the database
    await connectDB();

    // Start the server only after a successful database connection
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to the database:', err);
    process.exit(1); // Exit process with failure
  }
};

startServer();
