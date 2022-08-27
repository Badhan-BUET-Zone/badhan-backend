import dotenv from "../dotenv";
import mongoose, {ConnectOptions} from 'mongoose'
import myConsole from "../response/myConsole";

mongoose.Promise = global.Promise

myConsole.log('BADHAN LOG: Connecting to ' + (String(dotenv.MONGODB_URI).includes('Test') ? 'Test' : 'Production') + ' database...')

const connectToDB = async () => {
  try {
    mongoose.connect(dotenv.MONGODB_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true
    } as ConnectOptions, () => {
      myConsole.log('BADHAN LOG: You are connected to the database.')
    })
  } catch (e: any) {
    myConsole.log(e.message)
    process.exit()
  }
}

connectToDB()

process.on('SIGINT', async ()=>{
  myConsole.error('SIGINT called')
  await mongoose.disconnect()
  myConsole.error('Mongoose connection terminated')
  process.exit(0)
})

process.on('SIGTERM', async ()=>{
  myConsole.error('SIGTERM called')
  await mongoose.disconnect()
  myConsole.error('Mongoose connection terminated')
  process.exit(0)
})

module.exports = { mongoose }
