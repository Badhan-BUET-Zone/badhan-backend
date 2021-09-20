const mongoose = require('mongoose');
var cachegoose = require('cachegoose');

cachegoose(mongoose, {});
const cacheExpiryTime = 10*60//seconds;

mongoose.Promise = global.Promise;

console.log("Connecting to "+(String(process.env.MONGODB_URI).includes('Test')?"Test":"Production")+" database...")

mongoose.connect(process.env.MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('You are connected to the database.');
}).catch(err => {
    console.log(err.message);
    process.exit();
});

module.exports = {mongoose,cacheExpiryTime};
