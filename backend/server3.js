require('dotenv').config();
const express = require('express');
const passport = require('passport');
const session = require('express-session');
const FacebookStrategy = require('passport-facebook').Strategy;
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// Facebook OAuth Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FB_APP_ID || '',
    clientSecret: process.env.FB_APP_SECRET || '',
    callbackURL: 'http://localhost:5000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails', 'picture'],
    scope: ['email', 'pages_manage_posts', 'pages_read_engagement', 'pages_show_list']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Fetch User's Managed Pages with Access Tokens
        const response = await axios.get(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`);
        const pages = response.data.data.map(page => ({
            id: page.id,
            name: page.name,
            access_token: page.access_token || null
        }));

        console.log("Fetched Pages:", pages); // Debugging output

        return done(null, { profile, accessToken, pages });
    } catch (error) {
        console.error('Error fetching pages:', error.response?.data || error.message);
        return done(error);
    }
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Authentication Routes
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email', 'pages_manage_posts', 'pages_read_engagement', 'pages_show_list'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', {
    successRedirect: 'http://localhost:3000/dashboard',
    failureRedirect: 'http://localhost:3000'
}));

app.get('/logout', (req, res) => {
    req.logout(err => {
        if (err) {
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy(() => {
            res.clearCookie('connect.sid'); // Clear session cookie
            res.json({ message: 'Logged out successfully' });
        });
    });
});

// Fetch User's Facebook Pages
app.get('/facebook/pages', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log("Retrieved Pages:", req.user.pages); // Debugging output

    res.json({ pages: req.user.pages });
});

// Fetch Facebook Profile Details
app.get('/facebook/profile', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const { profile, accessToken } = req.user;

        // Fetch profile picture
        const response = await axios.get(`https://graph.facebook.com/v18.0/me/picture?type=large&redirect=false&access_token=${accessToken}`);
        
        res.json({
            name: profile.displayName,
            profilePic: response.data.data.url
        });
    } catch (error) {
        console.error('Error fetching profile picture:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to load profile picture' });
    }
});

// Post to a Facebook Page
app.post('/facebook/post', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    const { pageId, message } = req.body;

    if (!pageId || !message) {
        return res.status(400).json({ error: 'Missing pageId or message' });
    }

    const page = req.user.pages?.find(p => p.id === pageId);

    if (!page || !page.access_token) {
        return res.status(400).json({ error: 'Invalid page ID or missing page access token' });
    }

    try {
        const response = await axios.post(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
            message: message,
            access_token: page.access_token
        });

        res.json({ success: true, postId: response.data.id, message: 'Post published successfully!' });
    } catch (error) {
        console.error('Error posting:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to post', details: error.response?.data || error.message });
    }
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
