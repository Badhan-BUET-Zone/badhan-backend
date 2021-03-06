const mongoose = require('mongoose')

const donationSchema = new mongoose.Schema({
  phone: {
    type: Number,
    required: true,
    maxlength: 13,
    minlength: 13
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  date: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    validate: [{
      validator: (value) => {
        return Number.isInteger(value)
      },
      msg: 'DB: lastDonation must be an integer'
    }]
  }
}, { versionKey: false, id: false })

const Donation = mongoose.model('Donations', donationSchema)

module.exports = { Donation }
