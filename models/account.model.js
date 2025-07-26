const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const accountSchema = new mongoose.Schema({
  email: { type: String, required: true },
  phone: { type: String, required: true },
  image: { type: String },
  active: { type: Boolean, default: false },
  verify_token: { type: String, default: null },
  role: { type: String, default: 'user' },
  password: { type: String, required: true },
});

accountSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);