const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const donorInterface = require('../db/interfaces/donorInterface');
const tokenInterface = require('../db/interfaces/tokenInterface');
const logInterface = require("../db/interfaces/logInterface");


let handlePOSTSignIn = async (req, res) => {
    /*  #swagger.tags = ['User']
            #swagger.description = 'Endpoint to login a user.' */

    /* #swagger.parameters['signIn'] = {
               in: 'body',
               description: 'Phone number of a logging user.',
               schema:{
                phone: "8801521438557",
                password: "123456"
               }
      } */

    try {
        let donorPhone = req.body.phone;
        let password = req.body.password;
        let donorQueryResult = await donorInterface.findDonorByQuery({phone: donorPhone}, {});


        if (donorQueryResult.status !== 'OK') {
            /* #swagger.responses[401] = {
               schema: {
                    status: 401,
                    message: 'Donor not found',
                },
               description: 'When the donor is not found'
            } */
            return res.status(401).send({
                status: donorQueryResult.status,
                message: donorQueryResult.message
            });
        }

        let donor = donorQueryResult.data;

        let matched;

        try {
            matched = await bcrypt.compare(password, donor.password);
        } catch (e) {
            return res.status(401).send({
                status: "ERROR",
                message: "You do not have an account",
            });
        }

        if (!matched) {
            /* #swagger.responses[401] = {
               schema: {
                    status: 'ERROR',
                    message: 'Incorrect phone / password'
                },
               description: 'When the user provides an invalid password'
            } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'Incorrect phone / password'
            });
        }

        let access = 'auth';
        let token = await jwt.sign({
            _id: donor._id.toString(),
            access
        }, process.env.JWT_SECRET).toString();


        let tokenInsertResult = await tokenInterface.addToken(donor._id, token);

        if (tokenInsertResult.status !== 'OK') {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Token insertion failed'
            });
        }

        /* #swagger.responses[201] = {
           schema: {
                token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
            },
           description: 'A successful sign in returns a token for the user'
        } */
        await logInterface.addLog(donor._id, "CREATE SIGN IN", {});

        return res.status(201).send({status: 'OK', message: "Successfully signed in", token: token});


    } catch (e) {
        /* #swagger.responses[500] = {
               schema: {
                    status: 'EXCEPTION',
                    message: 'message generated from the backend caused by runtime error'
                },
               description: 'When the server malfunctions to the request body'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
};


let handleDELETESignOut = async (req, res) => {
    /*  #swagger.tags = ['User']
            #swagger.description = 'Endpoint to logout a user.' */

    try {
        let token = res.locals.middlewareResponse.token;
        let donor = res.locals.middlewareResponse.donor;

        let tokenDeleteResponse = await tokenInterface.deleteTokenDataByToken(token);

        if (tokenDeleteResponse.status !== "OK") {
            return res.status(404).send({
                status: 'OK',
                message: 'Token not found'
            });
        }


        /* #swagger.responses[200] = {
               schema: {
               status: 'OK',
                message: 'Logged out successfully'
                },
               description: 'A successful sign out removes the token for the user'
        } */

        await logInterface.addLog(donor._id, "DELETE SIGN OUT", {});

        return res.status(200).send({
            status: 'OK',
            message: 'Logged out successfully'
        });
    } catch (e) {
        /* #swagger.responses[500] = {
               schema: {
               status: 'ERROR',
            message: 'error message'
                },
               description: 'In case of internal server error user will receive an error message'
        } */
        return res.status(500).send({
            status: 'ERROR',
            message: e.message
        });
    }
};

let handleDELETESignOutAll = async (req, res) => {
    /*  #swagger.tags = ['User']
            #swagger.description = 'Endpoint to logout user from all devices.' */
    try {
        let donor = res.locals.middlewareResponse.donor;

        let deleteTokensResponse = await tokenInterface.deleteAllTokensByDonorId(donor._id);

        if (deleteTokensResponse.status !== "OK") {
            return res.status(404).send({
                status: 'ERROR',
                message: deleteTokensResponse.message
            });
        }


        /* #swagger.responses[200] = {
               schema: {
               status: 'OK',
                message: 'Logged out from all devices successfully'
                },
               description: 'A successful sign out removes all the tokens of the user'
        } */
        await logInterface.addLog(donor._id, "DELETE SIGN OUT ALL", {});
        return res.status(200).send({
            status: 'OK',
            message: 'Logged out from all devices successfully'
        });
    } catch (e) {
        /* #swagger.responses[500] = {
               schema: {
               status: 'ERROR',
            message: 'error message'
                },
               description: 'In case of internal server error user will receive an error message'
        } */
        return res.status(500).send({
            status: 'ERROR',
            message: e.message
        });
    }
};

let handlePOSTRedirection = async (req, res) => {
    /*  #swagger.tags = ['User']
            #swagger.description = 'Endpoint to request a temporary redirection token' */
    try {
        let donor = res.locals.middlewareResponse.donor;
        let access = 'auth';
        // let token = await jwt.sign({
        //     _id: donor._id.toString(),
        //     access
        // }, process.env.JWT_SECRET).toString();
        let token = await jwt.sign({
            _id: donor._id.toString(),
            access
        }, process.env.JWT_SECRET, {expiresIn: '30s'}).toString();


        let tokenInsertResult = await tokenInterface.addToken(donor._id, token);

        if (tokenInsertResult.status !== 'OK') {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Token insertion failed'
            });
        }

        /* #swagger.responses[201] = {
               schema: {
                    status: 'OK',
                    message: 'Redirection token created',
                    token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
                },
               description: 'Redirection token created'
        } */

        await logInterface.addLog(donor._id, "CREATE REDIRECTED TO WEB", {});

        return res.status(201).send({status: 'OK', message: "Redirection token created", token: token});
    } catch (e) {
        /* #swagger.responses[500] = {
               schema: {
               status: 'ERROR',
            message: 'error message'
                },
               description: 'In case of internal server error user will receive an error message'
        } */
        return res.status(500).send({
            status: 'ERROR',
            message: e.message
        });
    }

};


let handlePATCHRedirectedAuthentication = async (req, res) => {
    /*  #swagger.tags = ['User']
           #swagger.description = 'Route endpoint to redirect user from app to web.' */

    /* #swagger.parameters['logIn'] = {
                in: 'body',
                description: 'The temporary token generated by /user/requestRedirection',
                schema:{
                 token: "sdlfkhgoenguiehgfudsnbvsiugkb"
                }
       } */
    try {
        let token = req.body.token;

        let decodedDonor;
        try {
            decodedDonor = await jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            /* #swagger.responses[401] = {
               schema: {
                   status: 'ERROR',
                message: 'Session Expired'
                },
               description: 'This error will occur if the jwt token is invalid'
        } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'Session Expired'
            });
        }

        let donorQueryResult = await donorInterface.findDonorByQuery({_id: decodedDonor._id}, {});

        if (donorQueryResult.status !== 'OK') {
            /* #swagger.responses[401] = {
               schema: {
                   status: 'ERROR',
                message: 'Authentication failed. Invalid authentication token.'
                },
               description: 'This error will occur if the user does not exist'
        } */
            return res.status(404).send({
                status: 'ERROR',
                message: 'Donor not found'
            });
        }

        let donor = donorQueryResult.data;

        let tokenSearchResult = await tokenInterface.findTokenDataByToken(token);
        if (tokenSearchResult.status !== "OK") {
            return res.status(404).send({
                status: 'ERROR',
                message: 'Token not found'
            });
        }

        let tokenDeleteResponse = await tokenInterface.deleteTokenDataByToken(token);

        if (tokenDeleteResponse.status !== "OK") {
            return res.status(404).send({
                status: 'OK',
                message: 'Token not found'
            });
        }

        let access = 'auth';
        let newToken = await jwt.sign({
            _id: donor._id.toString(),
            access
        }, process.env.JWT_SECRET).toString();


        let tokenInsertResult = await tokenInterface.addToken(donor._id, token);

        if (tokenInsertResult.status !== 'OK') {
            return res.status(400).send({
                status: 'ERROR',
                message: 'Token insertion failed'
            });
        }

        /* #swagger.responses[201] = {
               schema: {
                    status: 'OK',
                    message: 'Redirected login successful',
                    token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
                },
               description: 'Redirection token created'
        } */
        return res.status(201).send({status: 'OK', message: "Redirected login successful", token: newToken});

    } catch (e) {
        /* #swagger.responses[500] = {
               schema: {
               status: 'ERROR',
            message: 'error message'
                },
               description: 'In case of internal server error user will receive an error message'
        } */
        console.log(e);
        return res.status(500).send({
            status: 'ERROR',
            message: e.message
        });
    }
}

module.exports = {
    //TOKEN HANDLERS
    handlePOSTSignIn,
    handleDELETESignOut,
    handleDELETESignOutAll,
    handlePOSTRedirection,
    handlePATCHRedirectedAuthentication
}