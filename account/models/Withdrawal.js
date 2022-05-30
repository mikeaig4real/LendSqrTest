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
    WithdrawalTable,
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
        const { data: result } = await findBySelect(WithdrawalTable, select, filter);
        return {
            error: false,
            data: result.length > 1 ? result : result[0],
            message: 'Withdrawal found successfully'
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {Number} amount - amount to be added to the account
 * @param {String} fromAccount - account to be funded from
 * @returns - {Object} - {error: Boolean, message: String, data: Object}
 */

const create = async ({ fromAccount, amount }) => {
    if (!fromAccount || !amount) {
        throw new Error('fromAccount, amount are required');
    }
    try {
        const columns = [
            {
                name: 'withdrawalId',
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
        await createTable(WithdrawalTable, columns);
        const data = [
            {
                fromAccount,
                amount,
                withdrawalId: fromAccount,
            }
        ];
        const returns = [
            'withdrawalId',
            'fromAccount',
            'amount',
            'createdAt'
        ];
        const { data: result } = await insertData(WithdrawalTable, data, returns);
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