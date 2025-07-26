var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');
var Account = require('../models/account.model');
const accountModel = require('../models/account.model');
const authToken = require('../middleware/authToken')

router.get('/findLoginUser', authToken, async (req, res) => {
    try {
        const userID = req.user.id;
        const user = await accountModel.findById(userID).select('-password');
        if (!user) {
            return res.status(404).send('User not found')
        }
        return res.status(200).json({ message: 'Account retrieved succesfully', user })
    } catch (err) {
        console.error('Fail to fetch account', err)
    }
})

router.post('/register', async (req, res) => {
    const { email, phone, password } = req.body;
    try {
        const existingAccount = await Account.findOne({ email });
        if (existingAccount) {
            return res.status(400).send('Email already exists');
        }

        const verify_token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const newAccount = new Account({
            email,
            phone,
            password,
            verify_token
        });
        await newAccount.save();

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const activationLink = `${req.protocol}://${req.get('host')}/api/account/v1/activate?token=${verify_token}`;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Account Activation',
            html: `<h3>Welcome to Our Service</h3>
                   <p>Please click the link below to activate your account:</p>
                   <a href="${activationLink}">Activate Account</a>
                   <p>If you did not create this account, please ignore this email.</p>`
        };

        await transporter.sendMail(mailOptions);
        res.status(201).send('Account created successfully. Please check your email to activate your account.');
    } catch (error) {
        console.error('❌ Error during registration:', error.message);
        if (error.errors) console.error('🧨 Validation Errors:', error.errors);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

router.get('/activate', async (req, res) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const account = await Account.findOne({ email: decoded.email });
        if (!account) {
            return res.status(404).send('Account not found or token invalid');
        }
        if (account.active) {
            return res.status(400).send('Account already activated');
        }
        account.active = true;
        account.verify_token = null;
        await account.save();
        res.status(200).send('Account activated successfully');
    } catch (error) {
        console.error('Error during account activation:', error);
        return res.status(500).send('Internal Server Error');
    }
});

router.get('/login', (req, res) => {
    res.render('account/login', { title: 'Login Account' });
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const account = await Account.findOne({ email });
        if (!account) {
            return res.status(404).send('Account not found');
        }
        if (!account.active) {
            return res.status(403).send('Account is not activated');
        }
        const isMatch = await bcrypt.compare(password, account.password);
        if (!isMatch) {
            return res.status(401).send('Invalid password or email');
        }
        const token = jwt.sign({ id: account._id, email: account.email }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.status(200).json({ token, msg: 'Login successful' });
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).send('Internal Server Error');
    }
});

module.exports = router;