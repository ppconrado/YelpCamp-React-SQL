const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
// USER MODEL SCHEMA - mongoose
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
// AUTHENTICATION MODEL SCHEMA - (username & password) - mongoose
UserSchema.plugin(passportLocalMongoose);

// INDEXES para performance
UserSchema.index({ email: 1 }); // buscar por email
UserSchema.index({ username: 1 }); // buscar por username (já único pelo passport)

module.exports = mongoose.model('User', UserSchema);
