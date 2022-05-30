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
        const { data: result } = await findBySelect(AccountsTable, select, filter);
        return {
            error: false,
            data: result.length > 1 ? result : result[0],
            message: 'Account found successfully'
        }
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @returns - {Object} - {error: Boolean, message: String, data: Object}
 * 
 */

const createAccountTable = async () => {
    // console.log(knex)
    try {
        const columns = [
            {
                name: 'accountId',
                type: {
                    name: 'string',
                    params: []
                },
                constraints: [
                    {
                        type: 'notNullable',
                        params: [],
                    },
                    {
                        type: 'unique',
                        params: [],
                    },
                    {
                        type: 'primary',
                        params: [],
                    },
                ]
            },
            {
                name: 'username',
                type: {
                    name: 'string',
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
                name: 'password',
                type: {
                    name: 'string',
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
                name: 'email',
                type: {
                    name: 'string',
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
                    },
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
                        type: 'notNullable',
                        params: []
                    },
                    {
                        type: 'defaultTo',
                        params: [
                            knex.fn.now()
                        ]
                    },
                ]
            },
            {
                name: 'accountBalance',
                type: {
                    name: 'decimal',
                    params: [
                        15,
                        2
                    ]
                },
                constraints: [
                    {
                        type: 'defaultTo',
                        params: [0]
                    },
                    {
                        type: 'notNullable',
                        params: []
                    },
                    {
                        type: 'checkPositive',
                        params: []
                    },
                ]
            }
        ]
        const result = await createTable(AccountsTable, columns);
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} username - username of account to create
 * @param {String} password - password of account to create
 * @param {String} email - email of account to create
 * @returns - array of objects or single object
 */

const create = async ({ username, password, email }) => {
    if (!username || !password || !email) {
        throw new Error('username, password, email are required');
    };
    try {
        const data = {
            accountId: randomString.generate(6),
            username,
            password,
            email,
            accountBalance: 0.00
        };
        const returns = [
            'accountId',
            'username',
            'email',
            'accountBalance'
        ]
        const { data: result } = await insertData(AccountsTable, data, returns);
        return {
            error: false,
            message: 'Account created successfully',
            data: result.length > 1 ? result : result[0]
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * 
 * @param {Array} filter - array of strings with where clauses
 * @param {Object} data - object with key value pairs to update
 * @param {Array} returns - array of strings with select keys
 * @returns - array of objects or single object
 */
const update = async (filter, data, returns) => {
    if (!filter) {
        throw new Error('filter is required');
    }
    try {
        const { data: result } = await updateData(AccountsTable, data, filter, returns);
        return {
            error: false,
            data: result.length > 1 ? result : result[0],
            message: 'Account updated successfully'
        };
    } catch (error) {
        throw new Error(error.message);
    }
}




// export all functions
module.exports = {
    find,
    create,
    update,
    createAccountTable,
}