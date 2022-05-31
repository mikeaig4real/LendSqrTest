require('dotenv').config();

let knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.PG_HOST,
        user: process.env.PG_USER,
        password: process.env.PG_PASSWORD,
        database: process.env.PG_DB,
        port: process.env.PG_PORT,
    },
    debug: true,
    pool: {
        min: 2,
        max: 10,
    }
});;

// get all connection details from .env file make postgres connection

/**
 * 
 * @returns - returns knex connection
 */

const getConnection = async () => {
    try {
        const connect = await knex;
        return connect;
    } catch (error) {
        throw new Error(error.message);
    }
};

// getConnection();

/**
 * 
 * @param {String} table - table name
 * @param {Object} column - column object
 * @returns {Object} - returns an object with error and message
 */

const addColumn = async (table, column) => {
    try {
        const result = await knex.schema.table(table, table => {
            let col = table?.[column.type.name]?.(column?.name, ...column?.type?.params);
            column.constraints.forEach(constraint => {
                console.table(constraint.name)
                col = col?.[constraint?.name]?.(...constraint?.params);
            });
            return col;
        });
        // console.table(result);
        return {
            error: false,
            message: `Column ${column.name} added successfully`
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} table - table name
 * @param {Object} column - column object
 * @returns {Object} - returns an object with error and message
 */

const createTable = async (table, columns) => {
    try {
        const isExisting = await knex.schema.hasTable(table);
        if (isExisting) {
            return {
                error: false,
                message: `Table ${table} already exists`
            };
        };
        let result = await knex.schema.createTable(table, async table => {
            // if (!columns) return table;
            let cols = columns.map(column => {
                let col = table?.[column.type.name]?.(column?.name, ...column?.type?.params);
                column?.constraints?.forEach(constraint => {
                    col = col?.[constraint?.name]?.(...constraint?.params);
                });
                return col;
            });
            return cols;
        });
        // console.table(result);
        return {
            error: false,
            message: `Table ${table} created successfully`
        }
    } catch (error) {
        // console.log(error);
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} query - query string in sql
 * @returns {Object} - returns an object with error and message
 */

const customQuery = async (query) => {
    try {
        const result = await knex.raw(query);
        return result;
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} table - table name
 * @param {*} alter - alter object
 * @returns {Object} - returns an object with error and message
 */

const alterTable = async (table, alter) => {
    try {
        const result = await knex.schema.alterTable(table, alter);
        // console.table(result);
        return {
            error: false,
            message: `Table ${table} altered successfully`
        };
    } catch (error) {
        throw new Error(error.message);
    }
}

/**
 * 
 * @param {String} table - table name
 * @returns {Object} - returns an object with error and message
 */

const dropTable = async (table) => {
    try {
        const result = await knex.schema.dropTableIfExists(table);
        // console.table(result);
        return {
            error: false,
            message: `Table ${table} dropped successfully`
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} table - table name
 * @param {String} column - column name
 * @returns - returns an object with error and message
 */

const dropColumn = async (table, column) => {
    try {
        const result = await knex.schema.table(table, table => {
            table.dropColumn(column);
        });
        // console.table(result);
        return {
            error: false,
            message: `Column ${column} dropped successfully`
        };
    } catch (error) {
        throw new Error(error.message);
    }
}


/**
 * 
 * @param {String} table - table name
 * @param {Array[String]} columns - columns to be selected
 * @param {Array[String|Number]} where - where clause
 * @returns - returns an object with error and data properties
 */

const findBySelect = async (table, columns, where) => {
    try {
        const result = await knex(table).select(...columns).where(...where);
        // console.table(result, 'hi');
        return {
            error: false,
            data: !Array.isArray(result) ? [result] : result
        };
    } catch (error) {
        // console.log(error);
        throw new Error(error.message);
    }
};

// ['email', '=', email], ['username', 'email']
// findBySelect('Accounts', ['username', 'email'], ['email', '=', 'michael@2canplay.com']);

/**
 * 
 * @param {String} table - table name
 * @param {Array[Object]} data - data to be inserted as an array of objects
 * @param {Array} returns - array of keys to be returned
 * @returns - returns an object with the following structure {error: boolean, message: string}
 */

const insertData = async (table, data, returns) => {
    try {
        const result = await knex.insert(data, returns).into(table);
        // console.table(result)
        return {
            error: false,
            message: `Data inserted successfully`,
            data: !Array.isArray(result) ? [result] : result
        };
    } catch (error) {
        throw new Error(error.message);
    }
};


/**
 * 
 * @param {String} table - table name
 * @param {Object} data - data to be inserted as an object
 * @param {Array[String]} where - where clause
 * @param {Array[String]} returns - array of keys to be returned
 * @returns - returns an object with the following structure {error: boolean, message: string, data: object}    
 */

const updateData = async (table, data, where, returns) => {
    try {
        const result = await knex(table).update(data, returns).where(...where);
        // console.table(result);
        return {
            error: false,
            message: `Data updated successfully`,
            data: !Array.isArray(result) ? [result] : result
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} table - table name
 * @param {Array} where - where clause
 * @param {Array} returns - array of keys to be returned
 * @returns - returns an object with the following structure {error: boolean, message: string, data: object}
 */

const deleteData = async (table, where, returns) => {
    try {
        const result = await knex(table).del(returns).where(...where);
        // console.table(result);
        return {
            error: false,
            message: `Data deleted successfully`,
            data: !Array.isArray(result) ? [result] : result
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

/**
 * 
 * @param {String} table - table name
 * @param {Array[Object]} aggregation - array of aggregation objects in pipeline format
 * @returns - returns an object with the following structure {error: boolean, message: string, data: object}
 */

const aggregateData = async (table, aggregation) => {
    try {
        let result;
        aggregation.forEach(agg => {
            result = knex(table)?.[agg?.type](...agg?.params);
        });
        // console.table(await result);
        result = await result;
        return {
            error: false,
            data: !Array.isArray(result) ? [result] : result
        };
    } catch (error) {
        throw new Error(error.message);
    }
};


module.exports = {
    createTable,
    customQuery,
    addColumn,
    alterTable,
    dropTable,
    dropColumn,
    findBySelect,
    insertData,
    updateData,
    deleteData,
    aggregateData,
    getConnection,
    knex
}



