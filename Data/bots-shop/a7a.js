const mongoose = require('mongoose');

const autoSchema = new mongoose.Schema({
  question: String,
  guildId: { type: String, required: true },
});

module.exports = mongoose.model('Auto', autoSchema);