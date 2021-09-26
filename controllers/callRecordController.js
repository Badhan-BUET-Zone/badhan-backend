const callRecordInterface = require('../db/interfaces/callRecordInterface');
const logInterface = require('../db/interfaces/logInterface');
const {InternalServerError, NotFoundError, ConflictError,} = require('../response/errorTypes');
const {SuccessResponse} = require('../response/successTypes')

const handlePOSTCallRecord = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['Call Records']
    #swagger.description = 'Endpoint to insert a call record'
    #swagger.parameters['CallRecordObject'] = {
        in: 'body',
        description: 'Contains the donor id of callee',
        schema: {
            donorId: 'fwetiubg43t6847gsdffwekt',
        }
    }
    #swagger.security = [{
        "api_key": []
    }]

    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Call record insertion successful',
            callRecord: {
                date: 1625755390858,
                _id: '60e70f42055a83d88',
                "callerId": {
                    _id: "5e901d56e0177ced73",
                    name: "Mir Mahathir Mohammad",
                    designation: 3,
                    hall: 4
                },
                calleeId: "5e68514546b0e",
            }
        },
        description: 'Call record insertion successful'
    }

     */


    try {
        let donor = res.locals.middlewareResponse.targetDonor;
        let user = res.locals.middlewareResponse.donor;
        let callRecordInsertionResult = await callRecordInterface.insertOne(user._id, donor._id);

        await logInterface.addLog(user._id, "CREATE CALLRECORD", {callee: donor.name});

        return res.sendResponse(new SuccessResponse('Call record insertion successful', {
            callRecord: callRecordInsertionResult.data
        }));

    } catch (e) {
        next(e)
    }
}

const handleDELETECallRecord = async (req, res, next) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['Call Records']
    #swagger.description = 'handles the deletion of one call history for a particular donor.'
    #swagger.parameters['donorId'] = {
        description: 'Id of donor for call history',
        type: 'string',
        name: 'donorId'
    }
    #swagger.parameters['callRecordId'] = {
        description: 'Id of call record that is going to be deleted ',
        type: 'string',
        name: 'callRecordId'
    }
    #swagger.security = [{
        "api_key": []
    }]

    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Call record deletion successful',
            deletedCallRecord: {
                date: 1632553859992,
                _id: "614ecb83a66ce337f8b484e8",
                callerId: "5e901d56effc5900177ced73",
                calleeId: "5e901d56effc5900177ced73",
            }
        },
        description: 'Call record deletion successful'
    }

    #swagger.responses[404] = {
        schema: {
            status: 'ERROR',
            message: 'Call record not found'
        },
        description: 'This error occurs if the call record does not exist'
    }

    #swagger.responses[409] = {
        schema: {
            status: 'ERROR',
            message: 'Target donor does not have the callee of call record'
        },
        description: 'This error occurs if the call record does not associate with the target donor'
    }

     */
    try {
        let user = res.locals.middlewareResponse.donor;
        let donor = res.locals.middlewareResponse.targetDonor;
        let callRecordSearchResult = await callRecordInterface.findById(req.query.callRecordId);
        if (callRecordSearchResult.status !== 'OK') {
            throw new NotFoundError('Call record not found');
        }

        if (!callRecordSearchResult.data.calleeId.equals(donor._id)) {
            throw new ConflictError('Target donor does not have the callee of call record');
        }

        let callRecordDeleteResult = await callRecordInterface.deleteById(req.query.callRecordId);
        if (callRecordDeleteResult.status !== 'OK') {
            throw new InternalServerError(callRecordDeleteResult.message);
        }

        await logInterface.addLog(user._id, "DELETE CALLRECORD", {
            callee: donor.name,
            ...callRecordDeleteResult.data
        });

        return res.sendResponse(new SuccessResponse('Call record deletion successful', {
            deletedCallRecord: callRecordDeleteResult.data,
        }))

    } catch (e) {
        next(e)
    }
}


module.exports = {
    handlePOSTCallRecord,
    handleDELETECallRecord
}
