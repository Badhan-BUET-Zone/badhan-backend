const moment = require('moment');

const donorInterface = require('../db/interfaces/donorInterface');
const donationInterface = require('../db/interfaces/donationInterface');
const logInterface = require('../db/interfaces/logInterface');
const tokenInterface = require('../db/interfaces/tokenInterface');

const handlePOSTDonors = async (req, res) => {
    /*  #swagger.tags = ['Donors']
           #swagger.description = 'handles the insertion of a new donor into the database.' */
    /* #swagger.parameters['insertDonor'] = {
               in: 'body',
               description: 'donor info for inserting donor',
               schema:{
                phone: 8801521438557,
                bloodGroup: 2,
                hall: 5,
                name: 'Mir Mahathir Mohammad',
                studentId: 1605011,
                address: 'Azimpur',
                roomNumber: '3009',
                comment: 'developer of badhan',
                extraDonationCount: 2,
               }
      } */
    try {
        let authenticatedUser = res.locals.middlewareResponse.donor;

        if (authenticatedUser.designation === 0) {
            /* #swagger.responses[401] = {
              schema: {
                status: 'ERROR',
                message: 'User does not have permission to add donors'
               },
              description: 'If user does not have permission to insert donor, user will get this error message'
            } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'User does not have permission to add donors'
            });
        }

        let duplicateDonorResult = await donorInterface.findDonorsByPhone(req.body.phone);
        if (duplicateDonorResult.donors.length !== 0) {


            if (authenticatedUser.designation === 3 || duplicateDonorResult.donors[0].hall === authenticatedUser.hall || duplicateDonorResult.donors[0].hall > 6) {
                /* #swagger.responses[409] = {
                schema: {
                    status: 'ERROR',
                    message: 'Donor found with duplicate phone number',
                    donor: 'donor array'
                },
                description: 'If the donor already exists in the database, user will get the error message'
                } */
                return res.status(409).send({
                    status: 'ERROR',
                    message: 'Donor found with duplicate phone number',
                    donor: duplicateDonorResult.donors[0]
                });
            } else {
                /* #swagger.responses[401] = {
                schema: {
                    status: 'ERROR',
                    message: 'Donor found with duplicate phone number in another hall',
                    donor: 'this field will return null'
               },
              description: 'If the donor with same phone number already exists in the database with another hall name, user will get the error message'
       } */
                return res.status(401).send({
                    status: 'ERROR',
                    message: 'Donor found with duplicate phone number in another hall',
                    donor: null
                });
            }

        }

        let donorObject = {
            phone: req.body.phone,
            bloodGroup: req.body.bloodGroup,
            hall: req.body.hall,
            name: req.body.name,
            studentId: req.body.studentId,
            address: req.body.address,
            roomNumber: req.body.roomNumber,
            lastDonation: 0,
            comment: req.body.comment,
            donationCount: req.body.extraDonationCount,
        };

        let donorInsertionResult = await donorInterface.insertDonor(donorObject);
        if (donorInsertionResult.status !== 'OK') {
            /* #swagger.responses[400] = {
             schema: {
                   status: 'ERROR',
                   message: 'New donor insertion unsuccessful'
              },
             description: 'If the donor with same phone number already exists in the database with another hall name, user will get the error message'
      } */
            return res.status(400).send({
                status: 'ERROR',
                message: 'New donor insertion unsuccessful'
            });
        }

        for (let i = 0; i < req.body.extraDonationCount; i++) {
            await donationInterface.insertDonation({
                phone: donorInsertionResult.data.phone,
                donorId: donorInsertionResult.data._id,
                date: 0
            });
        }

        await logInterface.addLog(res.locals.middlewareResponse.donor._id,"CREATE DONOR", donorInsertionResult.data);

        /* #swagger.responses[201] = {
            schema: {
                  status: 'OK',
                message: 'New donor inserted successfully',
                newDonor: 'new donor data'
             },
            description: 'successful donor insertion'
     } */
        return res.status(201).send({
            status: 'OK',
            message: 'New donor inserted successfully',
            newDonor: donorInsertionResult.data
        });

    } catch (e) {
        /* #swagger.responses[500] = {
           schema: {
                status: 'EXCEPTION',
                message: 'error message'
            },
           description: 'In case of internal server error, the user will get this message'
    } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        })
    }
}

const handleDeleteDonors = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'handles the deletion of an existing donor from the database.' */
    /* #swagger.parameters['donorId'] = {
              in: 'query',
              description: 'donor id for deleting donation',
              type:'string'
     } */

    try {
        let donorId = res.locals.middlewareResponse.targetDonor._id;

        let deleteDonorResult = await donorInterface.deleteDonorById(donorId);

        /* #swagger.responses[404] = {
             schema: {
                    status: 'EXCEPTION',
                    message: 'Error occurred in deleting target donor'
              },
             description: 'Error occured when deleting target donor'
        } */
        if (deleteDonorResult.status !== 'OK') {
            return res.status(404).send({
                status: 'EXCEPTION',
                message: "Error occurred in deleting target donor"
            })
        }

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "DELETE DONOR", deleteDonorResult.data);

        /* #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Donor deleted successfully'
        },
        description: 'Successful donor deletion'
        } */
        return res.status(200).send({
            status: 'OK',
            message: 'Donor deleted successfully'
        });


    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
                    status: 'EXCEPTION',
                    message: 'Internal server error'
              },
             description: 'In case of internal server error, user will get this error message'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        })
    }
}

const handleGETSearch = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Searches for donors that matches the filters' */
    /* #swagger.parameters['bloodGroup'] = {
             description: 'blood group for donors',
             type: 'number',
             name:'bloodGroup',
             in:'query'
      } */
    /* #swagger.parameters['hall'] = {
            description: 'hall for donors',
            type: 'number',
            name:'hall',
            in:'query'
     } */
    /* #swagger.parameters['batch'] = {
            description: 'batch for donors',
            type: 'number',
            name:'batch',
            in:'query'
     } */
    /* #swagger.parameters['name'] = {
            description: 'name for donors',
            type: 'string',
            name:'name',
            in:'query'
     } */
    /* #swagger.parameters['name'] = {
           description: 'address for donors',
           type: 'string',
           name:'address',
           in:'query'
    } */
    /* #swagger.parameters['isAvailable'] = {
          description: 'isAvailable for donors',
          type: 'boolean',
          name:'isAvailable',
          in:'query'
   } */
    /* #swagger.parameters['isNotAvailable'] = {
         description: 'isNotAvailable for donors',
         type: 'boolean',
         name:'isNotAvailable',
         in:'query'
  } */
    try {


        let reqQuery = req.query;
        reqQuery.bloodGroup = parseInt(reqQuery.bloodGroup);

        reqQuery.hall = parseInt(reqQuery.hall);
        reqQuery.batch = isNaN(parseInt(reqQuery.batch)) ? "" : parseInt(reqQuery.batch);
        reqQuery.isAvailable = reqQuery.isAvailable.toLowerCase() === 'true';
        reqQuery.isNotAvailable = reqQuery.isNotAvailable.toLowerCase() === 'true';

        if (reqQuery.hall !== res.locals.middlewareResponse.donor.hall && reqQuery.hall <= 6 && res.locals.middlewareResponse.donor.designation !== 3) {
            /* #swagger.responses[400] = {
              schema: {
                status: 'ERROR',
                message: 'You are not allowed to search donors of other halls'
               },
              description: 'This error will occur if the user tries to search other halls'
       } */
            return res.status(400).send({
                status: 'ERROR',
                message: 'You are not allowed to search donors of other halls'
            });
        }


        let searchFilter = {
            bloodGroup: reqQuery.bloodGroup,
            hall: reqQuery.hall,
        };

        if (reqQuery.bloodGroup === -1) {
            delete searchFilter.bloodGroup;
        }

        if (reqQuery.hall === -1) {
            delete searchFilter.hall;
        }

        let donorsQueryResult = await donorInterface.findDonorsByQuery(searchFilter, {password: 0});

        if (donorsQueryResult.status === 'OK') {
            let donors = donorsQueryResult.data;

            if (!reqQuery.isAvailable) {
                let threshold = moment().subtract(120, 'days').valueOf();
                donors = donors.filter((donor) => donor.lastDonation >= threshold);
            }

            if (!reqQuery.isNotAvailable) {
                let threshold = moment().subtract(120, 'days').valueOf();
                donors = donors.filter((donor) => donor.lastDonation < threshold);
            }

            if (reqQuery.batch !== '') {
                donors = donors.filter((donor) => donor.studentId.startsWith(reqQuery.batch));
            }

            if (reqQuery.name !== '') {
                donors = donors.filter((donor) => {
                    let j = 0;
                    for (let i = 0; i < donor.name.length; i++) {
                        if (reqQuery.name[j] === donor.name[i] || reqQuery.name[j].toUpperCase() === donor.name[i]) {
                            j++;
                        }
                        if (j >= reqQuery.name.length) {
                            break;
                        }
                    }
                    return j >= reqQuery.name.length;

                });
            }

            if (reqQuery.address !== '') {

                donors = donors.filter(donor => {
                    if (donor.address === undefined || donor.address === null) return false;
                    // console.log("Donor address = " + donor.address);
                    // console.log("Query address = " + reqQuery.address);
                    return donor.address.toLowerCase().includes(reqQuery.address.toLowerCase());
                })
            }

            /* #swagger.responses[200] = {
              schema: {
                status: 'OK',
                message: 'Donors queried successfully',
                filteredDonors:[{
                _id: 'abjcguiwefvew',
                phone: 8801521438557,
                name: 'Mir Mahathir Mohammad',
                studentId: 1605011,
                lastDonation: 987876287160,
                bloodGroup: 2,
                hall: 5,
                roomNumber: '3009',
                address: 'Azimpur',
                comment: 'developer of badhan',
                designation: 3,
                }]
               },
              description: 'Array of donors that matches the filter parameters'
       } */
            await logInterface.addLog(res.locals.middlewareResponse.donor._id, "READ SEARCH", {filter: reqQuery, resultCount:donors.length});

            return res.status(200).send({
                status: 'OK',
                message: 'Donors queried successfully',
                filteredDonors: donors
            });
        } else {
            /* #swagger.responses[400] = {
              schema: {
                status: 'ERROR',
                message: 'Donor query unsuccessful'
               },
              description: 'Filtering donors has been unsuccessful.'
       } */
            return res.status(400).send({
                status: 'ERROR',
                message: 'Donor query unsuccessful'
            });
        }
    } catch (e) {
        console.log(e);
        /* #swagger.responses[500] = {
              schema: {
                status: 'EXCEPTION',
                message: '(Error message)'
               },
              description: 'Internal server error'
       } */
        res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handlePATCHDonorsComment = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Adds a comment to a donor's profile.' */
    /* #swagger.parameters['editDonorComment'] = {
               in: 'body',
               description: 'donor info for posting comment',
               schema:{
                donorId: 'hujfsduif783ujh',
                comment:'Sample comment about donor'
               }
      } */
    try {
        let targetDonor = res.locals.middlewareResponse.targetDonor;

        targetDonor.comment = req.body.comment;
        await targetDonor.save();

        await logInterface.addLog(res.locals.middlewareResponse.donor._id,"UPDATE DONOR COMMENT", targetDonor);


        /* #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Comment posted successfully'
        },
        description: 'In case of successfully saving the comment'
        } */
        return res.status(200).send({
            status: 'OK',
            message: 'Comment posted successfully'
        });

    } catch (e) {
        /* #swagger.responses[500] = {
           schema: {
                status: 'EXCEPTION',
                message: '(Error message)'
            },
           description: 'In case of internal server error, the user will get this message'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handlePATCHDonorsPassword = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Handles the changing of password for an account.' */
    /* #swagger.parameters['changePassword'] = {
               in: 'body',
               description: 'donor info for changing password',
               schema:{
                donorId:'ghjdgejhd7623jhs',
                newPassword: 'thisisanewpassword'
               }
      } */
    try {
        let reqBody = req.body;

        let target = res.locals.middlewareResponse.targetDonor;

        if (target.designation === 0) {
            /* #swagger.responses[401] = {
             schema: {
               status: 'ERROR',
               message: 'Target user does not have an account'
              },
             description: 'Target user does not have an account'
            } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'Target user does not have an account'
            });
        }


        target.password = reqBody.newPassword;

        await target.save();

        await tokenInterface.deleteAllTokensByDonorId(target._id);

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "UPDATE DONOR PASSWORD", {name: target.name});

        /* #swagger.responses[200] = {
             schema: {
               status: 'OK',
               message: 'Password changed successfully'
              },
             description: 'Successful password change done'
        } */
        return res.status(200).send({
            status: 'OK',
            message: 'Password changed successfully'
        });

    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
               status: 'EXCEPTION',
                message: '(Error message)'
              },
             description: 'Internal server error'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handlePATCHDonors = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Handles the update of donor information.' */
    /* #swagger.parameters['editDonor'] = {
               in: 'body',
               description: 'donor info for editing donor',
               schema:{
                donorId:'ghjdgejhd7623jhs',
                newName:'Mir Mahathir Mohammad',
                newPhone:8801521438557,
                newStudentId:1605011,
                newBloodGroup:2,
                newHall:3,
                newRoomNumber:'3009',
                newAddress:'Azimpur'
               }
      } */
    try {
        let reqBody = req.body;
        // let authenticatedUser = res.locals.middlewareResponse.donor;

        let target = res.locals.middlewareResponse.targetDonor;

        if (reqBody.newName !== '') {
            target.name = reqBody.newName;
        }

        if (reqBody.newPhone !== -1) {
            target.phone = reqBody.newPhone;
        }

        if (reqBody.newStudentId !== '') {
            target.studentId = reqBody.newStudentId;
        }

        if (reqBody.newBloodGroup !== -1) {
            target.bloodGroup = reqBody.newBloodGroup;
        }

        if (reqBody.newHall !== -1) {
            target.hall = reqBody.newHall;
        }

        if (reqBody.newRoomNumber !== undefined && reqBody.newRoomNumber !== null) {
            target.roomNumber = reqBody.newRoomNumber;
        }

        if (reqBody.newAddress !== '') {
            target.address = reqBody.newAddress;
        }

        await target.save();

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "UPDATE DONOR", target);

        /* #swagger.responses[200] = {
             schema: {
                status: 'OK',
                message: 'Donor updated successfully'
              },
             description: 'Donor info update successful'
        } */
        return res.status(200).send({
            status: 'OK',
            message: 'Donor updated successfully'
        });

    } catch (e) {
        /* #swagger.responses[500] = {
            schema: {
               status: 'EXCEPTION',
               message: '(Error message)'
             },
            description: 'Internal server error'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handlePATCHDonorsDesignation = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Handles the promotion or demotion of users.' */
    /* #swagger.parameters['promote'] = {
               in: 'body',
               description: 'If the user wants to promote the target donor, promoteFlag should be true and a new password is needed to be set. If the target donor needs to be demoted, the promoteFlag should be false.',
               schema:{
                donorId:'hjasgd673278',
                promoteFlag: true,
                newPassword: 'thisisanewpassword'
               }
      } */
    try {
        let donor = res.locals.middlewareResponse.targetDonor;
        let donorDesignation = donor.designation;

        if (donorDesignation > 1) {
            /* #swagger.responses[401] = {
              schema: {
                status: 'ERROR',
                message: 'The target donor is not a donor nor a volunteer'
               },
              description: 'This route will not work if target donor is a hall admin or super admin'
            } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'User can not promote the target entity'
            });
        }

        if ((donorDesignation === 1 && req.body.promoteFlag) || (donorDesignation === 0 && !req.body.promoteFlag)) {
            /* #swagger.responses[401] = {
             schema: {
               status: 'ERROR',
               message: 'Can not promote volunteer or can not demote donor'
              },
             description: 'If user cannot promote volunteer or cannot demote donor'
            } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'Can\'t promote volunteer or can\'t demote donor'
            });
        }


        let newDesignation;

        if (req.body.promoteFlag) {
            newDesignation = donorDesignation + 1;
        } else {
            newDesignation = donorDesignation - 1;
        }

        donor.designation = newDesignation;
        if (req.body.promoteFlag) {
            donor.password = req.body.newPassword;
        } else {
            donor.password = null;
        }
        await donor.save();

        let logOperation = "";
        if (req.body.promoteFlag) {
            logOperation = "PROMOTE";
        } else {
            logOperation = "DEMOTE";
        }

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "UPDATE DONOR DESIGNATION ("+logOperation+")", donor);
        /* #swagger.responses[200] = {
              schema: {
                status: 'OK',
                message: 'Target user promoted/demoted successfully'
               },
              description: 'Donor promotion/ demotion successful'
       } */
        return res.status(200).send({
            status: 'OK',
            message: 'Target user promoted/demoted successfully'
        });

    } catch (e) {
        /* #swagger.responses[500] = {
              schema: {
                status: 'EXCEPTION',
                message: '(Error message)'
               },
              description: 'Internal server error'
       } */
        res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handleGETVolunteers = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Handles the fetching of volunteer lists for a hall admin.' */
    try {
        let authenticatedUser = res.locals.middlewareResponse.donor;
        let userDesignation = authenticatedUser.designation;

        let userHall = authenticatedUser.hall;

        let donorsQueryResult = await donorInterface.findDonorsByQuery({
            hall: userHall,
            designation: 1
        }, {
            studentId: 1,
            name: 1,
            roomNumber: 1,
            bloodGroup: 1,
            phone: 1,
        });

        if (donorsQueryResult.status !== 'OK') {
            /* #swagger.responses[400] = {
            schema: {
                   status: 'ERROR',
                   message: '(Error message)'
             },
            description: 'The filter parameters are incorrect'
     } */
            return res.status(400).send({
                status: donorsQueryResult.status,
                message: donorsQueryResult.message
            });
        }

        let volunteerList = donorsQueryResult.data;
        /* #swagger.responses[200] = {
            schema: {
                status: 'OK',
                message: 'Volunteer list fetched successfully',
                volunteerList:[
                    {
                        _id: "dskgjhwebkjsdbd",
                        bloodGroup: 2,
                        name: "John Doe",
                        phone: 8801456987445,
                        roomNumber: "409",
                        studentId: 1610000,
                    }
                ]
             },
            description: 'An array of volunteers fetched successfully'
     } */
        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "READ VOLUNTEERS", {});

        return res.status(200).send({
            status: 'OK',
            message: 'Volunteer list fetched successfully',
            volunteerList
        });

    } catch (e) {
        /* #swagger.responses[500] = {
            schema: {
                   status: 'EXCEPTION',
                   message: 'Internal server error'
             },
            description: 'In case of internal server error, user will get this error message'
     } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handlePATCHAdmins = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'Promotes a volunteer to hall admin and demotes the existing hall admin to volunteer' */
    /* #swagger.parameters['admin'] = {
               in: 'body',
               description: 'donor info for changing admin',
               schema:{
                donorId:'hdjhd12vhjgj3428569834hth'
               }
      } */
    try {

        let donorQueryResult = await donorInterface.findDonorByQuery({
            _id: req.body.donorId
        });

        if (donorQueryResult.status !== 'OK') {
            /* #swagger.responses[400] = {
            schema: {
                status: 'ERROR',
                message: '(Error message)'
            },
              description: 'If donor with specified id does not exist , user will get this error message'
       } */
            return res.status(400).send({
                status: donorQueryResult.status,
                message: donorQueryResult.message
            });
        }

        let donor = donorQueryResult.data;
        let donorDesignation = donor.designation;

        if (donorDesignation !== 1) {
            /* #swagger.responses[401] = {
             schema: {
               status: 'ERROR',
                message: 'User is not a volunteer'
              },
             description: 'If fetched user is not a volunteer , user will get this error message'
      } */
            return res.status(401).send({
                status: 'ERROR',
                message: 'User is not a volunteer'
            });
        }

        // Make previous hall admin volunteer

        let donorHall = donor.hall;
        let prevHallAdminQueryResult = await donorInterface.findDonorByQuery({hall: donorHall, designation: 2});

        if (prevHallAdminQueryResult.status === 'OK') {
            let prevHallAdminUpdateResult = await donorInterface.findDonorAndUpdate({
                hall: donorHall,
                designation: 2
            }, {
                $set: {
                    designation: 1,
                }
            });

            if (prevHallAdminUpdateResult.status !== 'OK') {
                /* #swagger.responses[400] = {
              schema: {
                status: 'Error status',
                message: 'Could not change hall admin'
               },
              description: 'hall admin change unsuccessful'
       } */
                return res.status(400).send({
                    status: prevHallAdminUpdateResult,
                    message: 'Could not change hall admin'
                });
            }

            await logInterface.addLog(res.locals.middlewareResponse.donor._id,"UPDATE DONOR DESIGNATION (DEMOTE HALLADMIN)", prevHallAdminUpdateResult.data);

        }

        // Make new hall admin
        let newHallAdminUpdateResult = await donorInterface.findDonorAndUpdate({
            _id: req.body.donorId
        }, {
            $set: {
                designation: 2,
            }
        });

        if (newHallAdminUpdateResult.status !== 'OK') {
            /* #swagger.responses[400] = {
              schema: {
                status: 'ERROR',
                message: 'Demoted previous hall admin, but could not set new hall admin'
               },
              description: 'Previous hall admin demotion successful, but could not set new hall admin'
       } */
            return res.status(400).send({
                status: 'ERROR',
                message: 'Demoted previous hall admin, but could not set new hall admin'
            });
        }

        await logInterface.addLog(res.locals.middlewareResponse.donor._id,"PROMOTE VOLUNTEER", newHallAdminUpdateResult.data);

        /* #swagger.responses[200] = {
            schema: {
              status: 'OK',
              message: 'Successfully changed hall admin'
             },
            description: 'Successfully changed hall admin'
     } */
        return res.status(200).send({
            status: 'OK',
            message: 'Successfully changed hall admin'
        });

    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
                    status: 'EXCEPTION',
                    message: '(Internal server error message)'
              },
             description: 'In case of internal server error, user will get this error message'
      } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handleGETAdmins = async (req, res) => {
    /*  #swagger.tags = ['Donors']
            #swagger.description = 'handles the fetching of hall admin list for a super admin.' */
    try {

        let adminsQueryResult = await donorInterface.findDonorsByQuery({designation: 2}, {
            phone: 1,
            hall: 1,
            name: 1
        });

        if (adminsQueryResult.status !== 'OK') {
            /* #swagger.responses[400] = {
              schema: {
                status: 'ERROR',
                message: '(Error message)'
               },
              description: 'If user does not exists in database, user will get this error message'
       } */
            return res.status(400).send({
                status: adminsQueryResult.status,
                message: adminsQueryResult.message
            });
        }

        let admins = adminsQueryResult.data;

        /* #swagger.responses[200] = {
             schema: {
                status: 'OK',
                message: 'Hall admin list fetched successfully',
                admins:[{
                    _id: "reohrewoihgfsdn",
                    hall: 0,
                    name: "Salman Khan",
                    phone: 8801521478996,
                }]
              },
             description: 'Hall admin list fetch successful '
      } */
        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "READ ADMINS", {});

        return res.status(200).send({
            status: 'OK',
            message: 'Hall admin list fetched successfully',
            admins
        });

    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
                    status: 'EXCEPTION',
                    message: '(Internal server error message)'
              },
             description: 'In case of internal server error, user will get this error message'
      } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }

}

const handleGETDonors = async (req, res) => {

    /*  #swagger.tags = ['Donors']
            #swagger.description = 'handles the fetching of donor details.' */
    /* #swagger.parameters['donorId'] = {
              description: 'Donor id for donor details',
              type: 'string',
              name:'donorId',
              in:'query'
       } */

    try {

        let donor = res.locals.middlewareResponse.targetDonor;

        await donor.populate({
            path:'donations'
        }).populate({
            path: 'callRecords',
            populate: {
                path: 'callerId',
                select: {
                    '_id': 1,
                    'name': 1,
                    'hall': 1,
                    'designation': 1
                }}}).execPopulate();
        /* #swagger.responses[200] = {
              schema: {
                status: 'OK',
                message: 'Successfully fetched donor details',
                donor: {
                    _id: 'abjcguiwefvew',
                    phone: 8801521438557,
                    name: 'Mir Mahathir Mohammad',
                    studentId: 1605011,
                    lastDonation: 987876287160,
                    bloodGroup: 2,
                    hall: 5,
                    roomNumber: '3009',
                    address: 'Azimpur',
                    comment: 'developer of badhan',
                    designation: 3,
                    donationCount: 2,
                }
               },
              description: 'donor info'
       } */

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "READ DONOR", {name: donor.name});

        return res.status(200).send({
            status: 'OK',
            message: 'Successfully fetched donor details',
            donor: donor
        });

    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
               status: 'EXCEPTION',
                message: '(Error message)'
              },
             description: 'Internal server error'
      } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handleGETDonorsMe = async (req, res) => {
    /*  #swagger.tags = ['Donors']
        #swagger.description = 'Handles the fetching of own details.' */

    try {
        let donor = res.locals.middlewareResponse.donor;
        await donor.populate({path: 'callRecords'}).populate({path: 'donations'}).execPopulate();

        /* #swagger.responses[200] = {
              schema: {
                status: 'OK',
                message: 'Successfully fetched donor details',
                donor: {
                    _id: 'abjcguiwefvew',
                    phone: 8801521438557,
                    name: 'Mir Mahathir Mohammad',
                    studentId: 1605011,
                    lastDonation: 987876287160,
                    bloodGroup: 2,
                    hall: 5,
                    roomNumber: '3009',
                    address: 'Azimpur',
                    comment: 'Developer of badhan',
                    designation: 3,
                }
               },
              description: 'Info of the logged in user'
       } */

        await logInterface.addLog(res.locals.middlewareResponse.donor._id, "ENTERED APP", {name: donor.name});

        return res.status(200).send({
            status: 'OK',
            message: 'Successfully fetched donor details',
            donor: donor
        });

    } catch (e) {
        /* #swagger.responses[500] = {
         schema: {
              status: 'EXCEPTION',
              message: '(error message)'
          },
         description: 'In case of internal server error, the user will get this message'
        } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handleGETVolunteersAll = async (req, res) => {
    /*  #swagger.tags = ['Donors']
        #swagger.description = 'Fetches all volunteers' */
    try {
        let volunteerResult = await donorInterface.findAllVolunteers();

        if (volunteerResult.status !== 'OK') {
            /* #swagger.responses[400] = {
              schema: {
                status: 'ERROR',
                message: '(Error message)'
               },
              description: 'Volunteer list fetch unsuccessful'
       } */
            return res.status(400).send({
                status: volunteerResult.status,
                message: volunteerResult.message
            });
        }
        /* #swagger.responses[200] = {
             schema: {
               status: 'OK',
               message: 'Volunteer list fetch successful'
              },
             description: 'Volunteer list fetch successful'
      } */
        return res.status(200).send({
            status: 'OK',
            message: 'Successfully fetched donor details',
            data: volunteerResult.data
        });

    } catch (e) {
        /* #swagger.responses[500] = {
             schema: {
                    status: 'EXCEPTION',
                    message: 'Internal server error'
              },
             description: 'In case of internal server error, user will get this error message'
      } */
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}


module.exports = {
    handlePOSTDonors,
    handleDeleteDonors,
    handleGETSearch,
    handlePATCHDonorsComment,
    handlePATCHDonorsPassword,
    handlePATCHDonors,
    handlePATCHDonorsDesignation,
    handleGETVolunteers,
    handlePATCHAdmins,
    handleGETAdmins,
    handleGETDonors,
    handleGETDonorsMe,
    handleGETVolunteersAll,
}
