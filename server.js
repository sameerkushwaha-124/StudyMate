const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
console.log('Attempting to connect to MongoDB Atlas...');
console.log('Connection string:', process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local MongoDB');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/study-material', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully to Atlas!');
  console.log('Database:', mongoose.connection.name);
})
.catch(err => {
  console.log('❌ MongoDB connection error:', err.message);
  console.log('Please check:');
  console.log('1. Username and password are correct');
  console.log('2. IP address is whitelisted in MongoDB Atlas');
  console.log('3. Database user has proper permissions');
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/content', require('./routes/content'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));
app.use('/api/progress', require('./routes/progress'));

// Serve static files from React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
