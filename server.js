const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Property = require('./models/Property');
const connectDB = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

connectDB();

app.use(express.json());

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization').split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret');
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// User registration endpoint
app.post('/api/register', async (req, res) => {
  const { firstName, lastName, email, phoneNumber, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      role
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// User login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      'your_jwt_secret',
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: payload.user });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Public endpoint to get all properties
app.get('/api/properties', verifyToken, async (req, res) => {
    try {
      const properties = await Property.find({ userId: req.user.id });
      res.json(properties);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

// Protected routes for managing properties
app.post('/api/properties', verifyToken, async (req, res) => {
    const { place, area, bedrooms, bathrooms, hospitalsNearby, collegesNearby } = req.body;
    try {
      console.log('User ID:', req.user.id); // Debugging line
  
      const newProperty = new Property({
        place,
        area,
        bedrooms,
        bathrooms,
        hospitalsNearby,
        collegesNearby,
        userId: req.user.id // Link property to user ID
      });
  
      await newProperty.save();
      res.json(newProperty);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });
  

app.delete('/api/properties/:id', verifyToken, async (req, res) => {
  try {
    await Property.findByIdAndDelete(req.params.id);
    res.json({ message: 'Property deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/api/buyer/properties', async (req, res) => {
    try {
      const properties = await Property.find(); // Fetch all properties
      res.json(properties);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  });

app.put('/api/properties/:id', verifyToken, async (req, res) => {
  try {
    const property = await Property.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(property);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
