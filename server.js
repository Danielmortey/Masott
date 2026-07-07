const express = require('express');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure directories and JSON file exist
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const dataFile = path.join(dataDir, 'designs.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

// Helper to read/write JSON
const getDesigns = () => JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
const saveDesigns = (data) => fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));

// Auth Middleware
const checkAuth = (req, res, next) => {
    if (req.cookies.adminAuth === 'true') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// --- API ROUTES ---

// Config Route (to send WhatsApp number to frontend)
app.get('/api/config', (req, res) => {
    res.json({ whatsappNumber: process.env.WHATSAPP_NUMBER });
});

// Admin Login
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
        res.cookie('adminAuth', 'true', { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }); // 1 day
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Incorrect password' });
    }
});

// Admin Logout
app.post('/api/logout', (req, res) => {
    res.clearCookie('adminAuth');
    res.json({ success: true });
});

// Get all designs
app.get('/api/designs', (req, res) => {
    res.json(getDesigns());
});

// Upload new design (Admin)
app.post('/api/designs', checkAuth, upload.array('photos', 4), (req, res) => {
    const { name } = req.body;
    const files = req.files;

    if (!files || files.length < 2 || files.length > 4) {
        // Delete uploaded files if validation fails
        if (files) files.forEach(f => fs.unlinkSync(f.path));
        return res.status(400).json({ error: 'Please upload between 2 and 4 photos.' });
    }

    const designs = getDesigns();
    const newDesign = {
        id: uuidv4(),
        name: name,
        photos: files.map(f => `/uploads/${f.filename}`)
    };

    designs.push(newDesign);
    saveDesigns(designs);
    res.json({ success: true, design: newDesign });
});

// Delete a design (Admin)
app.delete('/api/designs/:id', checkAuth, (req, res) => {
    let designs = getDesigns();
    const designIndex = designs.findIndex(d => d.id === req.params.id);

    if (designIndex > -1) {
        const design = designs[designIndex];
        // Delete files from file system
        design.photos.forEach(photoPath => {
            const fullPath = path.join(__dirname, 'public', photoPath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
        
        // Remove from DB
        designs.splice(designIndex, 1);
        saveDesigns(designs);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Design not found' });
    }
});

// Fallback routing for HTML pages
app.get('/gallery', (req, res) => res.sendFile(path.join(__dirname, 'public', 'gallery.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));


// --- ADD THIS NEW ROUTE TO server.js ---

// Update design name (Admin)
app.put('/api/designs/:id', checkAuth, (req, res) => {
    const { name } = req.body;
    let designs = getDesigns();
    const designIndex = designs.findIndex(d => d.id === req.params.id);

    if (designIndex > -1) {
        designs[designIndex].name = name;
        saveDesigns(designs);
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Design not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});