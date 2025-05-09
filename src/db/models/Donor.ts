import {Document, model, Model, Schema } from 'mongoose'
import bcrypt from 'bcryptjs'
import {CallRecordModel} from "./CallRecord";
import {DonationModel} from "./Donation";
import {LogModel} from "./Log";
import {PublicContactModel} from "./PublicContact";
import {ActiveDonorModel} from "./ActiveDonor";
import {TokenModel} from "./Token";
import { checkEmail } from '../../validations/validateRequest/others'
import { year2000TimeStamp } from '../../constants';
import { checkNumber, checkTimeStamp } from './validators';

export interface IDonor extends Document {
  phone: number,
  password?: string,
  studentId: string,
  bloodGroup: number,
  hall: number,
  address: string,
  roomNumber: string,
  designation?: number,
  lastDonation: number,
  name: string,
  comment: string,
  commentTime?: number,
  availableToAll: boolean,
  email?: string,
}

const donorSchema: Schema = new Schema<IDonor>({
  phone: {
    unique: true,
    type: Number,
    required: true,
    min: 8801000000000,
    max: 8801999999999,
    validate: [checkNumber('phone')]
  },
  password: {
    type: String
  },
  studentId: {
    type: String,
    required: true,
    trim: true,
    minlength: 7,
    maxlength: 7,
    validate: [{
      validator: (value: string): boolean => {
        return [0, 1, 2, 4, 5, 6, 8, 10, 11, 12, 15, 16, 17, 18].includes(parseInt(value.substr(2, 2), 10))
      },
      msg: 'DB: Please input a valid department number'
    }, {
      validator: (value: string): boolean => {
        const inputYear: number = parseInt('20' + value.substr(0, 2),10)
        return inputYear <= new Date().getFullYear() && inputYear >= 2001
      },
      msg: 'DB: Please input a valid batch between 01 and last two digits of current year'
    }]
  },
  bloodGroup: {
    type: Number,
    required: true,
    min: 0,
    max: 7,
    validate: [checkNumber('bloodGroup'), {
      validator: (value: number): boolean => {
        return [0, 1, 2, 3, 4, 5, 6, 7].includes(value)
      },
      msg: 'DB: Please input a valid blood group number'
    }]
  },
  hall: {
    type: Number,
    required: true,
    min: 0,
    max: 8,
    validate: [checkNumber('hall'), {
      validator: (value: number): boolean => {
        return [0, 1, 2, 3, 4, 5, 6, 8].includes(value)
      },
      msg: 'DB: Please input a valid hall number'
    }]
  },
  address: {
    type: String,
    trim: true,
    default: '(Unknown)',
    required: true,
    minlength: 2,
    maxlength: 500
  },
  roomNumber: {
    type: String,
    trim: true,
    default: '(Unknown)',
    required: true,
    minlength: 2,
    maxlength: 500
  },
  designation: {
    type: Number,
    default: 0,
    min: 0,
    max: 3,
    validate: [checkNumber('designation'), {
      validator: (value: number): boolean => {
        return [0, 1, 2, 3].includes(value)
      },
      msg: 'DB: Please input a valid designation'
    }],
    required: true
  },
  lastDonation: {
    type: Number,
    default: 0,
    min: 0,
    required: true,
    validate: [checkNumber('lastDonation')]
  },
  name: {
    type: String,
    trim: true,
    required: true,
    minlength: 3,
    maxlength: 100
  },
  comment: {
    type: String,
    trim: true,
    default: '(Unknown)',
    required: true,
    minlength: 2,
    maxlength: 500
  },
  commentTime: {
    type: Number,
    min: 0,
    default: year2000TimeStamp,
    required: true,
    validate: [checkNumber('commentTime'),checkTimeStamp('commentTime')],
  },

  availableToAll: {
    type: Boolean,
    required: true
  },
  email: {
    type: String,
    default: '',
    maxlength: 100,
    validate: [{
      validator: (email: string): boolean => {
        if (email === '') {
          return true
        }
        return checkEmail(email)
      },
      msg: 'DB: Email is not valid'
    }]
  }

}, { versionKey: false, id: false })

donorSchema.virtual('callRecords', {
  ref: 'CallRecords',
  localField: '_id',
  foreignField: 'calleeId'
})

donorSchema.virtual('donations', {
  ref: 'Donations',
  localField: '_id',
  foreignField: 'donorId'
})

donorSchema.virtual('donationCountOptimized', {
  ref: 'Donations',
  localField: '_id',
  foreignField: 'donorId',
  count: true
})

donorSchema.virtual('logCount', {
  ref: 'Logs',
  localField: '_id',
  foreignField: 'donorId',
  count: true
})

donorSchema.virtual('publicContacts', {
  ref: 'PublicContacts',
  localField: '_id',
  foreignField: 'donorId'
})

donorSchema.virtual('markedBy', {
  ref: 'ActiveDonors',
  localField: '_id',
  foreignField: 'donorId',
  justOne: true
})

donorSchema.set('toObject', { virtuals: true })
donorSchema.set('toJSON', { virtuals: true })

donorSchema.methods.toJSON = function (): IDonor {
  const donor: {[p: string]: any} = this
  const donorObject: IDonor = donor.toObject()

  delete donorObject.password

  return donorObject
}

// reason for definition of next function: https://github.com/Automattic/mongoose/issues/11449
donorSchema.pre<IDonor>('save', function (next: (err?: Error) => void):void{
  const donor: IDonor = this
  if (donor.isModified('password')) {
    bcrypt.genSalt(10, (err: Error, salt: string):void => {
      bcrypt.hash(donor.password!, salt, (errHash: Error, hash: string):void => {
        donor.password = hash
        next()
      })
    })
  } else {
    next()
  }
})

donorSchema.post('findOneAndDelete', async (donor: IDonor):Promise<void> => {
  await CallRecordModel.deleteMany({ callerId: donor._id })
  await CallRecordModel.deleteMany({ calleeId: donor._id })
  await DonationModel.deleteMany({ donorId: donor._id })
  await LogModel.deleteMany({ donorId: donor._id })
  await PublicContactModel.deleteMany({ donorId: donor._id })
  await TokenModel.deleteMany({ donorId: donor._id })
  await ActiveDonorModel.deleteMany({ donorId: donor._id })
  await ActiveDonorModel.deleteMany({ markerId: donor._id })
})

export const DonorModel: Model<IDonor> = model<IDonor>('Donor', donorSchema)


