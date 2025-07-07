// Add this to your main server file (e.g., server.js or app.js)

// Import the custom forms routes
const customFormsRoutes = require('./routes/customForms');

// Add the routes to your Express app
app.use('/api/custom-forms', customFormsRoutes);

// Example of complete server setup:
/*
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const diaryRoutes = require('./routes/diary');
const customFormsRoutes = require('./routes/customForms'); // Add this line
const notificationRoutes = require('./routes/notifications');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/custom-forms', customFormsRoutes); // Add this line
app.use('/api/notifications', notificationRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
*/ 