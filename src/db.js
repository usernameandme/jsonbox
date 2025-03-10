/**
 * A singleton implemetaion for the database
 */

const mongoose = require('mongoose')
const config = require('./config')

module.exports = (() => {
  let instance
  let db = mongoose.connection

  const connectToDb = () => {
    let options = {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
    if (config.MONGO_CERT_FILE) {
      options = {
        ...options,
        ssl: true,
        sslCA: config.MONGO_CERT_FILE
      }
    }
    mongoose.connect(config.MONGO_URL, options)
  }

  const createInstance = () => {
    db.on('error', error => {
      console.error('Error in MongoDb connection: ' + error)
      mongoose.disconnect() // Trigger disconnect on any error
    })
    db.on('connected', () => console.log('Data Db connected'))
    db.on('disconnected', () => {
      console.log('MongoDB disconnected!')
      connectToDb()
    })

    connectToDb()
    const Schema = mongoose.Schema

    // Data Schema
    const dataSchema = new Schema({
      _box: { type: String, index: true, select: false }, // box to which the record belongs
      _collection: { type: String, index: true }, // Any collection if user passes in URL
      _createdOn: Date, // Date on which its created
      _apiKey: { type: String, index: true, select: false }, // API KEY used to create / update the record
      _updatedOn: Date, // Date on which its updated
      _expiry: { type: Date, select: false }, // date after which this record will be deleted
      data: { type: Object } // Actual data of the record
    })

    // Once switched on the index will be be set in mongodb. Might need to remove it in order to switch off the behaviour
    if (config.ENABLE_DATA_EXPIRY) {
      dataSchema.index({ _expiry: 1 }, { expireAfterSeconds: 0 })
    }

    return mongoose.model('Data', dataSchema)
  }

  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance()
      }
      return instance
    }
  }
})()
