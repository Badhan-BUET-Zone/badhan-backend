const dotenv = require('../../dotenv')
const tokenCache = require('../../cache/tokenCache')
const { Token } = require('../models/Token')
const jwt = require('jsonwebtoken')
const insertAndSaveTokenWithExpiry = async (donorId, userAgent, expiresIn) => {
  let options = {}
  if (expiresIn) {
    options = { expiresIn }
  }
  const token = await jwt.sign({
    _id: String(donorId),
    access: 'auth'
  }, dotenv.JWT_SECRET, options).toString()
  const tokenData = new Token({ donorId, token, ...userAgent })
  const data = await tokenData.save()
  if (data.nInserted === 0) {
    return {
      message: 'Token insertion failed',
      status: 'ERROR',
      data: data
    }
  } else {
    return {
      message: 'Token insertion successful',
      status: 'OK',
      data: data
    }
  }
}

const findTokenDataByToken = async (token) => {
  const tokenData = await Token.findOne({ token })
  if (!tokenData) {
    return {
      message: 'Token not found',
      status: 'ERROR'
    }
  }
  return {
    message: 'Token found successfully',
    status: 'OK',
    data: tokenData
  }
}

const deleteTokenDataByToken = async (token) => {
  const tokenData = await Token.findOneAndDelete({ token })
  if (tokenData) {
    tokenCache.clear(token)
    return {
      message: 'Token successfully removed',
      status: 'OK'
    }
  }
  return {
    message: 'Token not found',
    status: 'ERROR'
  }
}

const deleteAllTokensByDonorId = async (donorId) => {
  const tokenData = await Token.deleteMany({ donorId })
  tokenCache.clearAll()
  return {
    message: 'Token successfully removed',
    status: 'OK',
    data: tokenData
  }
}

const findTokenDataExceptSpecifiedToken = async (donorId, excludedToken) => {
  const tokenDataList = await Token.find({
    $and: [{
      donorId: {
        $eq: donorId
      },
      token: {
        $ne: excludedToken
      }
    }]
  }, { _id: 1, browserFamily: 1, device: 1, ipAddress: 1, os: 1 })
  return {
    message: 'Recent logins fetched successfully',
    status: 'OK',
    data: tokenDataList
  }
}

const deleteByTokenId = async (tokenId) => {
  const deletedToken = await Token.findByIdAndDelete(tokenId)
  tokenCache.clearAll()
  if (deletedToken) {
    return {
      message: 'Token successfully removed',
      status: 'OK',
      data: deletedToken
    }
  }
  return {
    message: 'Token not found',
    status: 'ERROR',
    data: null
  }
}

module.exports = {
  findTokenDataByToken,
  deleteTokenDataByToken,
  deleteAllTokensByDonorId,
  insertAndSaveTokenWithExpiry,
  findTokenDataExceptSpecifiedToken,
  deleteByTokenId
}
