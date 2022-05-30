const randomString = require('randomstring');

const {
    findBySelect,
    updateData,
    deleteData,
    insertData,
    createTable,
    knex,
} = require('../../db/connect');

const {
    AccountsTable,
    FundingTable,
} = require('../../db/dbtables');


/**
 * 
 * @param {Array} filter - array of strings with where clauses
 * @param {Array} select - array of strings with select keys
 * @returns - array of objects or single object
 */

const find = async (filter, select) => {
    if (!filter) {
        throw new Error('filter is required');
    }
    try {
        const { data: result } = await findBySelect(FundingTable, select, filter);
        return {
            error: false,
            data: result.length > 1 ? result : result[0],
            message: 'Funding found successfully'
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {Number} amount - amount to be added to the account
 * @param {String} toAccount - account to be funded
 * @returns - {Object} - {error: Boolean, message: String, data: Object}
 */

const create = async ({ amount, toAccount }) => {
    if (!amount || !toAccount) {
        throw new Error('amount and toAccount are required');
    }
    try {
        const columns = [
            {
                name: 'fundingId',
                type: {
                    name: 'string',
                    params: []
                },
                constraints: [
                    {
                        type: 'primary',
                        params: [],
                    },
                    {
                        type: 'unique',
                        params: [],
                    },
                    {
                        type: 'notNullable',
                        params: [],
                    },
                ]
            },
            {
                name: 'amount',
                type: {
                    name: 'integer',
                    params: []
                },
                constraints: [
                    {
                        name: 'notNullable',
                        params: []
                    },
                    {
                        name: 'unique',
                        params: []
                    }
                ]
            },
            {
                name: 'toAccount',
                type: {
                    name: 'string',
                    params: []
                },
                constraints: [

                ]
            },
            {
                name: 'createdAt',
                type: {
                    name: 'timestamp',
                    params: []
                },
                constraints: [
                    {
                        name: 'notNullable',
                        params: []
                    },
                    {
                        name: 'defaultTo',
                        params: [
                            knex.fn.now()
                        ]
                    }
                ]
            }
        ]
        await createTable(FundingTable, columns);
        const data = [
            {
                amount,
                toAccount,
                fundingId: toAccount
            }
        ];
        const returns = [
            'fundingId',
            'amount',
            'createdAt'
        ];
        const { data: result } = await insertData(FundingTable, data, returns);
        return {
            error: false,
            message: 'Funding created successfully',
            data: result.length > 1 ? result : result[0]
        };

    } catch (error) {
        throw new Error(error.message);
    }
};




// export all functions
module.exports = {
    find,
    create,
}