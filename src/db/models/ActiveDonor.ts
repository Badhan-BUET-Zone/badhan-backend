import {Schema, model, Model, Document} from 'mongoose'
import { year2000TimeStamp } from '../../constants';
import { checkNumber, checkTimeStamp } from './validators';

export interface IActiveDonor extends Document {
  donorId: Schema.Types.ObjectId;
  markerId: Schema.Types.ObjectId;
  time: number;
}

const activeDonorSchema: Schema = new Schema<IActiveDonor>({
  donorId: {
    type: Schema.Types.ObjectId,
    ref: 'Donor',
    required: true,
    unique: true
  },
  markerId: {
    type: Schema.Types.ObjectId,
    ref: 'Donor',
    required: true
  },
  time: {
    type: Number,
    min: 0,
    required: true,
    default: ():number => {
      return new Date().getTime()
    },
    validate: [checkNumber('time'),checkTimeStamp('time')],
  }
}, { versionKey: false, id: false })

export const ActiveDonorModel: Model<IActiveDonor> = model<IActiveDonor>('ActiveDonors', activeDonorSchema)
