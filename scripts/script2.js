const dotenv = require('dotenv')

dotenv.config( { path : './config/config.env'} )
const { mongoose } = require('../db/mongoose');
const {Donor} = require('../db/models/Donor');
const {Donation} = require('../db/models/Donation');
const util = require('util')

const test = async()=>{
    let donors = await Donor.aggregate([
        {$group: {
                _id: {name: "$phone"},
                uniqueIds: {$addToSet: "$_id"},
                count: {$sum: 1}
            }
        },
        {$match: {
                count: {"$gt": 1}
            }
        },
        {$sort: {
                count: -1
            }
        }
    ]);
    console.log(donors.length)
    // for(let i = 0 ; i < donors.length; i++){
        // console.log(typeof donors[i].studentId);
        // donors[i].studentId = donors[i].studentId.toString();

        // console.log(donors[i].studentId);
        // await donors[i].save();
    // }
    await mongoose.disconnect();
}
test();