const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const donorInterface = require('../db/interfaces/donorInterface');
const tokenInterface = require('../db/interfaces/tokenInterface');
const logInterface = require("../db/interfaces/logInterface");
const emailInterface = require("../db/interfaces/emailInterface");

const {
    InternalServerError500,
    BadRequestError400,
    ForbiddenError403,
    NotFoundError404,
    UnauthorizedError401,
    ConflictError409
} = require('../response/errorTypes')
const {CreatedResponse201,OKResponse200} = require('../response/successTypes');

const handlePOSTPasswordForgot = async (req, res, next) => {
    /*
        #swagger.auto = false
        #swagger.tags = ['User']
        #swagger.description = 'Route if user forgets the password.'
        #swagger.parameters['signIn'] = {
            in: 'body',
            description: 'Phone number of user who forgot his/her password',
            schema: {
                phone: "8801521438557",
            }
        }

            #swagger.responses[404] = {
                schema: {
                    status: "ERROR",
                    statusCode: 404,
                    message: "Phone number not recognized/ Account not found/ No recovery email found for this phone number",
                },
                description: 'Error responses'
            }
            #swagger.responses[200] = {
                schema: {
                    status: "OK",
                    statusCode: 200,
                    message: "A recovery mail has been sent to your email address",
                },
                description: 'Success response'
            }
    */
    let phone = req.body.phone;
    let queryByPhoneResult = await donorInterface.findDonorByPhone(phone);
    if (queryByPhoneResult.status !== "OK") {
        return res.respond(new NotFoundError404("Phone number not recognized"));
    }

    let donor = queryByPhoneResult.data;
    let email = donor.email;

    if (donor.designation === 0) {
        return res.respond(new NotFoundError404("Account not found"));
    }

    if (email === "") {
        return res.respond(new NotFoundError404("No recovery email found for this phone number"));
    }

    let tokenInsertResult = await tokenInterface.insertAndSaveToken(donor._id, req.userAgent);

    if (tokenInsertResult.status !== 'OK') {
        return res.respond(new InternalServerError500('Token insertion failed',"found in handlePOSTPasswordForgot when tokenInterface.insertAndSaveToken"));
    }

    let emailHtml = emailInterface.generatePasswordForgotHTML(tokenInsertResult.data.token)

    let result = await emailInterface.sendMail(email, "Password Recovery Email from Badhan", emailHtml);
    if (result.status !== "OK") {
        return res.respond(new InternalServerError500(result.message,"found in handlePOSTPasswordForgot when emailInterface.sendMail"));
    }

    await logInterface.addLog(donor._id, "POST USERS PASSWORD FORGOT", {});

    return res.respond(new OKResponse200("A recovery mail has been sent to your email address"));
}

let handlePOSTSignIn = async (req, res, next) => {
    /*
        #swagger.auto = false
        #swagger.tags = ['User']
        #swagger.description = 'Endpoint to login a user.'
        #swagger.parameters['signIn'] = {
            in: 'body',
            description: 'Phone number of a logging user.',
            schema: {
                phone: "8801521438557",
                password: "123456"
            }
        }
        */

    let donorPhone = req.body.phone;
    let password = req.body.password;
    let donorQueryResult = await donorInterface.findDonorByQuery({phone: donorPhone}, {});


    if (donorQueryResult.status !== 'OK') {
        /*
        #swagger.responses[404] = {
            schema: {
                status: "ERROR",
                statusCode: 404,
                message: 'Donor not found',
            },
            description: 'When the donor is not found'
        }
         */
        return res.respond(new NotFoundError404("Account not found"));
    }

    let donor = donorQueryResult.data;

    let matched;

    try {
        matched = await bcrypt.compare(password, donor.password);
    } catch (e) {
        /*
        #swagger.responses[404] = {
            schema: {
                status: 'ERROR',
                statusCode: 404,
                message: 'You do not have an account'
            },
            description: 'When the logging user does not have any account'
        }
         */
        return res.respond(new NotFoundError404("Account not found"));
    }

    if (!matched) {
        /*
        #swagger.responses[401] = {
            schema: {
                status: 'ERROR',
                statusCode: 401,
                message: 'Incorrect phone / password'
            },
            description: 'When the user provides an invalid password'
        }
         */
        return res.respond(new UnauthorizedError401('Incorrect phone / password'));
    }

    let access = 'auth';
    let token = await jwt.sign({
        _id: donor._id.toString(),
        access
    }, process.env.JWT_SECRET).toString();


    let tokenInsertResult = await tokenInterface.addToken(donor._id, token, req.userAgent);

    if (tokenInsertResult.status !== 'OK') {
        return res.respond(new InternalServerError500('Token insertion failed',"found in handlePOSTSignIn when tokenInterface.addToken"));
    }
    /*
    #swagger.responses[201] = {
        schema: {
            "status": "OK",
            statusCode: 201,
            "message": "Successfully signed in",
            token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
        },
        description: 'A successful sign in returns a token for the user'
    }

     */

    await logInterface.addLog(donor._id, "POST USERS SIGNIN", {});
    return res.respond(new CreatedResponse201("Successfully signed in",{
        token
    }))
};


let handleDELETESignOut = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['User']
    #swagger.description = 'Endpoint to logout a user.'
    #swagger.security = [{
               "api_key": []
        }]
     */


    let token = res.locals.middlewareResponse.token;
    let donor = res.locals.middlewareResponse.donor;

    // did not analyze the result because the route wouldn't reach this point if the token was not in the database
    let tokenDeleteResponse = await tokenInterface.deleteTokenDataByToken(token, donor._id);

    /*
    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            statusCode: 200,
            message: 'Logged out successfully'
        },
        description: 'A successful sign out removes the token for the user'
    }
*/
    await logInterface.addLog(donor._id, "DELETE USERS SIGNOUT", {});
    return res.respond(new OKResponse200('Logged out successfully'));
};

let handleDELETESignOutAll = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['User']
    #swagger.description = 'Endpoint to logout user from all devices.'
    #swagger.security = [{
               "api_key": []
        }]

     */

    let donor = res.locals.middlewareResponse.donor;

    // did not analyze the result because the route wouldn't reach this point if the token was not in the database
    let deleteTokensResponse = await tokenInterface.deleteAllTokensByDonorId(donor._id);
    /*
            #swagger.responses[200] = {
                schema: {
                    status: 'OK',
                    statusCode: 200,
                    message: 'Logged out from all devices successfully'
                },
                description: 'A successful sign out removes all the tokens of the user'
            }

     */
    await logInterface.addLog(donor._id, "DELETE USERS SIGNOUT ALL", {});
    return res.respond(new OKResponse200('Logged out from all devices successfully'));
};

let handlePOSTRedirection = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['User']
    #swagger.description = 'Endpoint to request a temporary redirection token'
    #swagger.security = [{
               "api_key": []
        }]
     */

    let donor = res.locals.middlewareResponse.donor;
    let access = 'auth';
    let token = await jwt.sign({
        _id: donor._id.toString(),
        access
    }, process.env.JWT_SECRET, {expiresIn: '30s'}).toString();


    let tokenInsertResult = await tokenInterface.addToken(donor._id, token, req.userAgent);

    if (tokenInsertResult.status !== 'OK') {
        return res.respond(new InternalServerError500(tokenInsertResult.message,"found in handlePOSTRedirection when tokenInterface.addToken"));
    }
    /*
    #swagger.responses[201] = {
        schema: {
            status: 'OK',
            statusCode: 201,
            message: 'Redirection token created',
            token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
        },
        description: 'Redirection token created'
    }

     */

    await logInterface.addLog(donor._id, "POST USERS REDIRECTION", {});

    return res.respond(new CreatedResponse201("Redirection token created",{
        token
    }))

};


let handlePATCHRedirectedAuthentication = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['User']
    #swagger.description = 'Route endpoint to redirect user from app to web.'
    #swagger.parameters['logIn'] = {
        in: 'body',
        description: 'The temporary token generated by /user/requestRedirection',
        schema: {
            token: "sdlfkhgoenguiehgfudsnbvsiugkb"
        }
    }

     */
    let token = req.body.token;

    let decodedDonor;
    try {
        decodedDonor = await jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
        /*
        #swagger.responses[401] = {
            schema: {
                status: 'ERROR',
                statusCode: 401,
                message: 'Session Expired'
            },
            description: 'This error will occur if the jwt token is invalid'
        }

         */
        return res.respond(new UnauthorizedError401('Session Expired'));
    }

    let donorQueryResult = await donorInterface.findDonorByQuery({_id: decodedDonor._id}, {});

    if (donorQueryResult.status !== 'OK') {
        /*
        #swagger.responses[404] = {
            schema: {
                status: 'ERROR',
                statusCode: 404,
                message: 'Authentication failed. Invalid authentication token.'
            },
            description: 'This error will occur if the user does not exist'
        }

         */
        return res.respond(new NotFoundError404('Donor not found'));
    }

    let donor = donorQueryResult.data;

    let tokenDeleteResponse = await tokenInterface.deleteTokenDataByToken(token, donor._id);

    if (tokenDeleteResponse.status !== "OK") {
        /*
        #swagger.responses[404] = {
            schema: {
                status: 'ERROR',
                statusCode: 404,
                message: 'Token not found'
            },
            description: 'This error will occur if the token does not exist'
        }

         */
        return res.respond(new NotFoundError404('Token not found'));
    }

    let access = 'auth';
    let newToken = await jwt.sign({
        _id: donor._id.toString(),
        access
    }, process.env.JWT_SECRET).toString();


    let tokenInsertResult = await tokenInterface.addToken(donor._id, newToken, req.userAgent);

    if (tokenInsertResult.status !== 'OK') {
        return res.respond(new InternalServerError500(tokenInsertResult.message,"found in handlePATCHRedirectedAuthentication when tokenInterface.addToken"));
    }
    /*
            #swagger.responses[201] = {
                schema: {
                    status: 'OK',
                    statusCode: 201,
                    message: 'Redirected login successful',
                    token: "lksjaopirnboishbnoiwergnbsdiobhsiognkghesuiog"
                },
                description: 'Redirection token created'
            }

     */
    await logInterface.addLog(donor._id, "PATCH USERS REDIRECTION", {});

    return res.respond(new CreatedResponse201("Redirected login successful",{
        token: newToken
    }))
}

const handlePATCHPassword = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['User']
    #swagger.description = 'Route endpoint to change password'
    #swagger.security = [{
               "api_key": []
        }]
    #swagger.parameters['passwordChange'] = {
        in: 'body',
        description: 'New Password',
        schema: {
            password: "mynewpassword"
        }
    }
*/

    let reqBody = req.body;
    let donor = res.locals.middlewareResponse.donor;
    donor.password = reqBody.password;
    await donor.save();

    await tokenInterface.deleteAllTokensByDonorId(donor._id);
    let tokenInsertResult = await tokenInterface.insertAndSaveToken(donor._id, req.userAgent)
    await logInterface.addLog(res.locals.middlewareResponse.donor._id, "PATCH USERS PASSWORD", {});

    /*
    #swagger.responses[201] = {
        schema: {
            status: 'OK',
            statusCode: 201,
            message: 'Password changed successfully',
            token: 'dsgfewosgnwegnhw'
        },
        description: 'Successful password change done'
    }
     */
    return res.respond(new CreatedResponse201('Password changed successfully',{
        token: tokenInsertResult.data.token
    }))
}

const handleGETLogins = async (req, res, next) => {
    /*
        #swagger.auto = false
        #swagger.tags = ['User']
        #swagger.description = 'Endpoint to get recent logins'
        #swagger.security = [{
            "api_key": []
        }]


        #swagger.responses[200] = {
            schema: {
                status: 'OK',
                statusCode: 200,
                message: 'Recent logins fetched successfully',
                logins: [
                    {
                        _id: 'dsgfewosgnwegnhw',
                        os: "Ubuntu 20.04.1",
                        device: "Asus K550VX",
                        browserFamily: "Firefox",
                        ipAddress: "1.2.3.4"
                    }
                ],
                currentLogin: {
                    _id: 'dsgfewosgnwegnhw',
                    os: "Ubuntu 20.04.1",
                    device: "Asus K550VX",
                    browserFamily: "Firefox",
                    ipAddress: "1.2.3.4"
                },
            },
            description: 'Success response'
        }

     */


    let user = res.locals.middlewareResponse.donor;
    let token = res.locals.middlewareResponse.token;
    let recentLoginsResult = await tokenInterface.findTokenDataExceptSpecifiedToken(user._id, token);

    let currentTokenDataResult = await tokenInterface.findTokenDataByToken(token);
    if (currentTokenDataResult.status !== "OK") {
        return res.respond(new InternalServerError500(currentTokenDataResult.message,"found in handleGETLogins when tokenInterface.findTokenDataByToken"));
    }

    let currentTokenData = JSON.parse(JSON.stringify(currentTokenDataResult.data));
    delete currentTokenData.token;
    delete currentTokenData.expireAt;
    delete currentTokenData.donorId;
    delete currentTokenData.__v;


    await logInterface.addLog(res.locals.middlewareResponse.donor._id, "GET USERS LOGINS", {});
    return res.respond(new OKResponse200('Recent logins fetched successfully',{
        logins: recentLoginsResult.data,
        currentLogin: currentTokenData,
    }));
}

const handleDELETELogins = async (req, res, next) => {
    /*
#swagger.auto = false
#swagger.tags = ['User']
#swagger.description = 'Endpoint to delete a login from device'
#swagger.security = [{
               "api_key": []
        }]
 #swagger.parameters['tokenId'] = {
        description: 'ID of token to be deleted',
        type: 'string',
        name: 'tokenId',
        in: 'param'
    }

    #swagger.responses[404] = {
        schema: {
            status: 'ERROR',
            statusCode: 404,
            message: 'Login information not found'
        },
        description: 'Token with specified ID was not found in database'
    }
    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            statusCode: 200,
            message: 'Logged out from specified device',
        },
        description: 'Success response'
    }
*/

    let user = res.locals.middlewareResponse.donor;
    let deletedTokenResult = await tokenInterface.deleteByTokenId(req.params.tokenId, user._id);
    if (deletedTokenResult.status !== "OK") {
        return res.respond(new NotFoundError404('Login information not found'));
    }

    await logInterface.addLog(res.locals.middlewareResponse.donor._id, "DELETE USERS LOGINS", {});
    return res.respond(new OKResponse200('Logged out from specified device'));
}

module.exports = {
    //TOKEN HANDLERS
    handlePOSTSignIn,
    handleDELETESignOut,
    handleDELETESignOutAll,
    handlePOSTRedirection,
    handlePATCHRedirectedAuthentication,
    handlePATCHPassword,
    handlePOSTPasswordForgot,
    handleGETLogins,
    handleDELETELogins
}