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
    TransferTable,
    AccountsTable,
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
        const { data: result } = await findBySelect(TransferTable, select, filter);
        return {
            error: false,
            data: result.length > 1 ? result : result[0],
            message: 'Transfer found successfully'
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {Number} amount - amount to be added to the account
 * @param {String} fromAccount - account to be funded from
 * @param {String} toAccount - account to be funded to
 * @returns - {Object} - {error: Boolean, message: String, data: Object}
 */

const create = async ({ toAccount, fromAccount, amount }) => {
    if (!toAccount || !fromAccount || !amount) {
        throw new Error('toAccount, fromAccount, amount are required');
    }
    try {
        const columns = [
            {
                name: 'transferId',
                type: { name: 'string', params: [] },
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
                name: 'toAccount',
                type: { name: 'string', params: [] },
                constraints: [
                
                ]
            },
            {
                name: 'fromAccount',
                type: { name: 'string', params: [] },
                constraints: [
                   
                ]
            },
            {
                name: 'amount',
                type: { name: 'integer', params: [] },
                constraints: [
                    {
                        name: 'notNullable',
                        params: []
                    },
                ]
            },
            {
                name: 'createdAt',
                type: { name: 'timestamp', params: [] },
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
        await createTable(TransferTable, columns);
        const data = [
            {
                toAccount,
                fromAccount,
                amount,
                transferId: `${fromAccount}-${toAccount}`,
            }
        ];
        const returns = [
            'transferId',
            'toAccount',
            'fromAccount',
            'amount',
            'createdAt'
        ];
        const { data: result } = await insertData(TransferTable, data, returns);
        return {
            error: false,
            message: 'Transfer created successfully',
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