const jwt = require('jsonwebtoken');
const donorInterface = require('../db/interfaces/donorInterface');
const tokenInterface = require('../db/interfaces/tokenInterface');
const {UnauthorizedError401, InternalServerError500, ForbiddenError403, NotFoundError404} = require("../response/errorTypes");

let handleAuthentication = async (req, res, next) => {
    /*
    #swagger.auto = false
     */
    let token = req.header('x-auth');
    let decodedDonor;

    try {
        decodedDonor = await jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        return res.respond(new UnauthorizedError401('Invalid Authentication'));
    }

    let tokenCheckResult = await tokenInterface.findTokenDataByTokenCached(token, decodedDonor._id);
    if (tokenCheckResult.status !== 'OK') {
        return res.respond(new UnauthorizedError401('You have been logged out'));
    }

    let tokenData = tokenCheckResult.data;

    let findDonorResult = await donorInterface.findDonorById(tokenData.donorId);
    if (findDonorResult.status !== 'OK') {
        return res.respond(new InternalServerError500('No user found associated with token',"Found in handleAuthentication"));
    }

    let donor = findDonorResult.data;

    res.locals.middlewareResponse = {
        donor,
        token
    };
    return next();

};


let handleSuperAdminCheck = async (req, res, next) => {
    if (res.locals.middlewareResponse.donor.designation === 3) {
        return next();
    }
    return res.respond(new ForbiddenError403('You are not permitted to access this route'));
};

let handleHallAdminCheck = async (req, res, next) => {
    /* #swagger.responses[403] = {
                    schema: {
                    status: 'ERROR',
                    statusCode: 403,
                    message: 'error message'
                    },
                   description: 'This error will appear if anyone below the designation of hall admin tries to access this route. This middleware assumes that the handleHallPermission middleware is used before and along with this middleware'
            } */
    if (res.locals.middlewareResponse.donor.designation < 2) {
        return res.respond(new ForbiddenError403('You are not permitted to access this route'));
    }
    next();
};

let handleHigherDesignationCheck = async (req, res, next) => {
    /* #swagger.responses[403] = {
        schema: {
        status: 'ERROR',
        statusCode: 403,
        message: 'You cannot modify the details of a Badhan member with higher designation'
        },
       description: 'This middleware is used to block the manipulation of data of a member with higher designation'
    } */
    if (res.locals.middlewareResponse.donor.designation < res.locals.middlewareResponse.targetDonor.designation
        && res.locals.middlewareResponse.donor._id !== res.locals.middlewareResponse.targetDonor._id) {
        return res.respond(new ForbiddenError403('You cannot modify the details of a Badhan member with higher designation'));
    }
    next();
};

let handleFetchTargetDonor = async (req, res, next) => {
    /* #swagger.responses[404] = {
              schema: {
                status: 'ERROR',
                statusCode: 404,
                message: "Donor not found"
               },
              description: 'When no donor with the specified donor id is found, user will get this error message'
            } */

    /*
    This middleware checks whether the targeted donor is accessible to the logged in user
    Makes sure that the targeted donor id is available in the request
     */
    let donorId;
    if (req.body.donorId) {
        donorId = req.body.donorId
    } else if (req.query.donorId) {
        donorId = req.query.donorId
    } else if (req.params.donorId){
        donorId = req.params.donorId
    }

    let donorQueryResult = await donorInterface.findDonorByQuery({
        _id: donorId
    });
    if (donorQueryResult.status !== 'OK') {
        return res.respond(new NotFoundError404('Donor not found'));
    }
    res.locals.middlewareResponse.targetDonor = donorQueryResult.data;
    return next();
};

let handleHallPermissionOrCheckAvailableToAll = async (req, res, next) => {
    let targetDonor = res.locals.middlewareResponse.targetDonor;
    if (targetDonor.availableToAll) {
        return next();
    }
    await handleHallPermission(req, res, next);
};

let handleHallPermission = async (req, res, next) => {
    /*
    A super admin can access the data of any hall.
    Every hall admin and volunteer can only access data of their own halls along with the data of
    attached students and covid donors.
     */
    /* #swagger.responses[403] = {
              schema: {
                status: 'ERROR',
                statusCode: 403,
                message: 'You are not authorized to access this donor'
               },
              description: 'The user is trying to access or modify data of a different hall'
            } */

    let targetDonor = res.locals.middlewareResponse.targetDonor
    if (targetDonor.hall <= 6
        && res.locals.middlewareResponse.donor.hall !== targetDonor.hall
        && res.locals.middlewareResponse.donor.designation !== 3) {
        return res.respond(new ForbiddenError403('You are not authorized to access a donor of different hall'));
    }
    return next();
};

module.exports = {
    //CHECK PERMISSIONS
    handleAuthentication,
    handleHallAdminCheck,
    handleSuperAdminCheck,
    handleHallPermission,
    handleHigherDesignationCheck,
    handleFetchTargetDonor,
    handleHallPermissionOrCheckAvailableToAll
}