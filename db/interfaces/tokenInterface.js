const {Token} = require('../models/Token');
const jwt = require('jsonwebtoken');
const {cacheExpiryTime} = require('../mongoose');
const cachegoose = require('cachegoose');

const clearTokenCache = donorId =>{
    cachegoose.clearCache(`${donorId}_tokens_children`);
}
const insertAndSaveToken = async (donorId,userAgent) => {
    try {
        clearTokenCache(donorId);
        let access = 'auth';
        let token = await jwt.sign({
            _id: String(donorId),
            access
        }, process.env.JWT_SECRET).toString();
        let tokenData = new Token({donorId, token,...userAgent});
        let data = await tokenData.save();
        if (data.nInserted === 0) {
            return {
                message: 'Token insertion failed',
                status: 'ERROR',
                data: data,
            }
        }
        return {
            message: 'Token insertion successful',
            status: 'OK',
            data: data,
        };

    } catch (e) {
        console.log("ERROR");
        console.log(e.message);
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const addToken = async (donorId, token, userAgent) => {
    try {
        clearTokenCache(donorId);
        let tokenData = new Token({donorId, token, ...userAgent});
        let data = await tokenData.save();
        if (data.nInserted === 0) {
            return {
                message: 'Token insertion failed',
                status: 'ERROR',
                data: data,
            }
        } else {
            return {
                message: 'Token insertion successful',
                status: 'OK',
                data: data,
            };
        }
    } catch (e) {
        console.log("ERROR");
        console.log(e.message);
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
};

const findTokenDataByTokenCached = async (token,donorId) => {
    try {
        let tokenData = await Token.findOne({token}).cache(0, `${donorId}_tokens_children`)

        if (tokenData === null) {
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
    } catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const findTokenDataByToken = async (token) => {
    try {
        let tokenData = await Token.findOne({token})

        if (tokenData === null) {
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
    } catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const deleteTokenDataByToken = async (token,donorId) => {
    try {
        clearTokenCache(donorId);
        let tokenData = await Token.findOneAndDelete({token});
        if (tokenData) {
            return {
                message: "Token successfully removed",
                status: "OK"
            }
        }

        return {
            message: "Token not found",
            status: "ERROR"
        }

    } catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const deleteAllTokensByDonorId = async (donorId) => {
    try {
        clearTokenCache(donorId);
        let tokenData = await Token.deleteMany({donorId});
        return {
            message: "Token successfully removed",
            status: "OK"
        }
    } catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const findTokenDataExceptSpecifiedToken = async (donorId, excludedToken)=>{
    try{
        let tokenDataList = await Token.find({
            $and:[{
                donorId: {
                    $eq: donorId
                },
                token: {
                    $ne: excludedToken
                }
            }]
        },{_id:1,browserFamily: 1,device: 1, ipAddress:1,os:1});
        return{
            message: "Recent logins fetched successfully",
            status: 'OK',
            data: tokenDataList
        }
    }catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

const deleteByTokenId = async (tokenId,donorId)=>{
    try{
        clearTokenCache(donorId);
        let deletedToken = await Token.findByIdAndDelete(tokenId);
        if(deletedToken){
            return{
                message: "Token successfully removed",
                status: "OK",
                data: deletedToken
            }
        }
        return{
            message: "Token not found",
            status: "ERROR",
            data: null
        }
    }catch (e) {
        console.log("ERROR")
        return {
            message: e.message,
            status: 'ERROR',
            data: null
        }
    }
}

module.exports = {
    addToken,
    findTokenDataByTokenCached,
    findTokenDataByToken,
    deleteTokenDataByToken,
    deleteAllTokensByDonorId,
    insertAndSaveToken,
    findTokenDataExceptSpecifiedToken,
    deleteByTokenId
}
