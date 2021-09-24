const publicContactInterface = require('../db/interfaces/publicContactInterface');
const logInterface = require('../db/interfaces/logInterface');

const handleDELETEPublicContact = async (req, res) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['Public Contacts']
    #swagger.description = 'Endpoint to delete a public contact'
    #swagger.parameters['donorId'] = {
            description: 'donorId of public contact',
            type: 'string',
            name: 'donorId',
            in: 'query'
    }
    #swagger.parameters['contactId'] = {
            description: 'contactId to be deleted',
            type: 'string',
            name: 'contactId',
            in: 'query'
    }
    #swagger.security = [{
               "api_key": []
        }]

     */

    /*
    #swagger.responses[404] = {
        schema: {
            status: 'ERROR',
            message: "Public contact not found"
        },
        description: 'Response if the public contact to be deleted is not found'
    }
    #swagger.responses[400] = {
        schema: {
            status: 'ERROR',
            message: "Public contact not consistent with donorId"
        },
        description: 'If contactId in database does not have the matching donorId'
    }
    #swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: 'Public contact deleted successfully'
        },
        description: 'Success message'
    }

     */

    try {
        let searchResult = await publicContactInterface.findPublicContactById(req.query.contactId);
        if (searchResult.status !== "OK") {
            return res.status(404).send({
                status: 'ERROR',
                message: "Public contact not found"
            });
        }

        if (!searchResult.data.donorId.equals(req.query.donorId)) {
            return res.status(400).send({
                status: 'ERROR',
                message: "Public contact not consistent with donorId"
            });
        }

        let deletionResult = await publicContactInterface.deletePublicContactById(req.query.contactId);
        if (deletionResult.status !== "OK") {
            return res.status(500).send({
                status: 'EXCEPTION',
                message: e.message
            });
        }
        return res.status(200).send({
            status: 'OK',
            message: 'Public contact deleted successfully'
        });
    } catch (e) {
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }

}

const handlePOSTPublicContact = async (req, res) => {
    /*
    #swagger.auto = false
    #swagger.tags = ['Public Contacts']
    #swagger.description = 'Endpoint to insert a public contact'
    #swagger.security = [{
               "api_key": []
        }]
    #swagger.parameters['PublicContactObject'] = {
        in: 'body',
        description: 'Contains the donor id and assigned blood group of contact',
        schema: {
            donorId: 'fwetiubg43t6847gsdffwekt',
            bloodGroup: 2
        }
    }
    #swagger.responses[201] = {
        schema: {
            status: 'OK',
            message: 'Public contact added successfully',
            publicContact:{
                bloodGroup: 2,
                _id: 'fwetiubg43t6847gsdffwekt',
                donorId: 'fwetiubg43t6847gsdffwekt',
            }
        },
        description: 'Success message'
    }
 */
    try {
        let insertionResult = await publicContactInterface.insertPublicContact(req.body.donorId, req.body.bloodGroup);
        if (insertionResult.status !== "OK") {
            return res.status(500).send({
                status: 'EXCEPTION',
                message: insertionResult.message
            });
        }
        return res.status(201).send({
            status: 'OK',
            message: 'Public contact added successfully',
            publicContact: insertionResult.data
        })
    } catch (e) {
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}

const handleGETPublicContacts = async (req, res) => {
    /*
#swagger.auto = false
#swagger.tags = ['Public Contacts']
#swagger.description = 'Endpoint to get public contacts'
#swagger.responses[200] = {
        schema: {
            status: 'OK',
            message: "All public contacts fetched successfully",
            publicContacts:[
                {
                    bloodGroup: 2,
                    contacts:[
                        {
                            donorId: 'fwetiubg43t6847gsdffwekt',
                            phone: "8801521438557",
                            name: "Mahathir",
                            contactId: 'fwetiubg43t6847gsdffwekt'
                        }
                    ]
                }
            ]
        },
        description: 'Success message'
    }
*/
    try {
        let searchResult = await publicContactInterface.findAllPublicContacts();
        return res.status(200).send({
            status: 'OK',
            message: "All public contacts fetched successfully",
            publicContacts: searchResult.data,
        })
    } catch (e) {
        return res.status(500).send({
            status: 'EXCEPTION',
            message: e.message
        });
    }
}


module.exports = {
    handlePOSTPublicContact,
    handleDELETEPublicContact,
    handleGETPublicContacts
}
