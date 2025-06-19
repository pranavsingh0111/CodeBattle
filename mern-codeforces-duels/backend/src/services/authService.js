const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    async register(username, password) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        const savedUser = await newUser.save();
        
        console.log('User registered successfully:', savedUser.username);
        return savedUser;
    }

    async login(username, password) {
        console.log('Login attempt for username:', username);
        
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            throw new Error('User not found');
        }

        console.log('User found, checking password...');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log('Invalid password for user:', username);
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        console.log('Login successful for user:', username);
        return { token, user };
    }
}

module.exports = new AuthService();
