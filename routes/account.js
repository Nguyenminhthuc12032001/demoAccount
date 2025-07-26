var express = require('express');
var router = express.Router();
const AccountModel = require('../models/account.model');
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 512000 },
});

router.get('/', async (req, res, next) => {
  try {
    const accounts = await AccountModel.find();
    res.render('account/index', { title: 'Account List', accounts });
  } catch (error) {
    next(error);
  }
});

router.get('/create', (req, res) => {
  res.render('account/create', { title: 'Create Account' });
});

router.post('/create', 
  [
    upload.single('image'),
    body('email').isEmail().withMessage('Invalid email format').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6, max: 20 }).withMessage('Password must be between 6 and 20 characters'),
    body('confirmPassword').custom((value, { req }) => value === req.body.password).withMessage('Passwords do not match'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('account/create', { 
        title: 'Create Account', 
        errors: errors.array() 
      });
    }
  try {
    let account = new AccountModel({
      id: req.body.id,
      email: req.body.email,
      phone: req.body.phone,
      image: req.body.image
    });
    const img = req.file ? req.file.filename : 'default.png';
    account.image = img;
    await account.save();
    res.redirect('/account');
  } catch (error) {
    console.log(error);
    res.status(500).render('account/create', { error: 'Error creating account' });
  }
});

// Xu ly search email
router.get('/search', async (req, res, next) => {
  try {
    const { searchEmail } = req.query;
    const accounts = await AccountModel.find({ email: new RegExp(searchEmail, 'i') });
    res.render('account/index', { title: 'Account List', accounts });
  } catch (error) {
    next(error);
  }
});

router.get('/v1/register', (req, res) => {
  res.render('account/register', { title: 'Register Account' });
});

module.exports = router;
