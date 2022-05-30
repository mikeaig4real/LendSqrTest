const Account = require('../models/Account');
const Withdrawal = require('../models/Withdrawal');
const Transfer = require('../models/Transfer');
const Funding = require('../models/Funding');
const bcrypt = require('bcryptjs');
const { StatusCodes } = require('http-status-codes');

/**
 * 
 * @param {Object} req - Request Object
 * @param {Object} res - Response Object
 * @returns {Object} Returns an Error Object and or data
 */

const createAccount = async (req, res) => {
    const { username, password, email } = { ...req.query, ...req.params, ...req.body };
    if (!username || !password || !email) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'username, password and email are required'
        });
    };
    try {
        await Account.createAccountTable();
        const { data: existingAccount } = await Account.find(['email', '=', email], ['username', 'email']);
        if (existingAccount) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: true,
                message: 'Account already exists'
            });
        };
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const { data: account } = await Account.create({
            username,
            password: hashedPassword,
            email
        });
        return res.status(StatusCodes.CREATED).json({
            error: false,
            message: 'Account created successfully',
            data: account
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: true,
            message: error.message
        });
    }
};

/**
 * 
 * @param {Object} req - Request Object
 * @param {Object} res - Response Object
 * @returns {Object} Returns an Error Object and or data
 */

const fundAccount = async (req, res) => {
    const { amount, account: toAccount } = { ...req?.user, ...req.query, ...req.params, ...req.body };
    if (!amount || !toAccount) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount and toAccount are required'
        });
    };
    // check if amount is a number and greater than 0
    if (isNaN(amount) || +amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount must be a number greater than 0'
        });
    }
    try {
        const { data: existingAccount } = await Account.find(['accountId', '=', toAccount], ['accountId', 'accountBalance']);
        if (!existingAccount) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: true,
                message: 'Account not found'
            });
        };
        const amountToFund = +amount;
        const { data: { accountBalance } } = await Account.update(['accountId', '=', toAccount], { accountBalance: +existingAccount.accountBalance + amountToFund }, ['accountId', 'accountBalance']);
        const { data: { createdAt, fundingId } } = await Funding.create({
            amount,
            toAccount: existingAccount.accountId
        });
        return res.status(StatusCodes.CREATED).json({
            error: false,
            message: 'Funding successful',
            data: {
                createdAt,
                fundingId,
                amount,
                toAccount: existingAccount.accountId,
                accountBalance
            }
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: true,
            message: error.message
        });
    }
}

/**
 * 
 * @param {Object} req - Request Object
 * @param {Object} res - Response Object
 * @returns {Object} Returns an Error Object and or data
 */

const transferFunds = async (req, res) => {
    const { amount, account: fromAccount, toAccount } = { ...req?.user, ...req.query, ...req.params, ...req.body };
    if (!amount || !fromAccount || !toAccount) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount, fromAccount and toAccount are required'
        });
    };
    // check if amount is a number and greater than 0
    if (isNaN(amount) || +amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount must be a number greater than 0'
        });
    };
    try {
        const { data: existingAccountFrom } = await Account.find(['accountId', '=', fromAccount], ['accountId', 'accountBalance']);
        if (!existingAccountFrom) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: true,
                message: 'Account not found (Giver)'
            });
        };
        const { data: existingAccountTo } = await Account.find(['accountId', '=', toAccount], ['accountId', 'accountBalance']);
        if (!existingAccountTo) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: true,
                message: 'Account not found (Receiver)'
            });
        }
        const amountToFund = +amount;
        if (existingAccountFrom.accountBalance - amountToFund < 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: true,
                message: 'Insufficient funds'
            });
        };
        // update from account
        const { data: { accountBalance } } = await Account.update(['accountId', '=', fromAccount], { accountBalance: +existingAccountFrom.accountBalance - amountToFund }, ['accountId', 'accountBalance']);
        // update to account
        await Account.update(['accountId', '=', toAccount], { accountBalance: +existingAccountTo.accountBalance + amountToFund }, ['accountId', 'accountBalance']);
        const { data: { createdAt, transferId } } = await Transfer.create({
            amount,
            fromAccount: existingAccountFrom.accountId,
            toAccount: existingAccountTo.accountId
        });
        return res.status(StatusCodes.CREATED).json({
            error: false,
            message: 'Transfer successful',
            data: {
                createdAt,
                transferId,
                amount,
                fromAccount: existingAccountFrom.accountId,
                toAccount: existingAccountTo.accountId,
                accountBalance,
            }
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: true,
            message: error.message
        });
    }
}

/**
 * 
 * @param {Object} req - Request Object
 * @param {Object} res - Response Object
 * @returns {Object} Returns an Error Object and or data
 */

const withdrawFunds = async (req, res) => {
    const { amount, account: fromAccount } = { ...req?.user, ...req.query, ...req.params, ...req.body };
    if (!amount || !fromAccount) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount and fromAccount are required'
        });
    };
    // check if amount is a number and greater than 0
    if (isNaN(amount) || +amount <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'amount must be a number greater than 0'
        });
    };
    try {
        const { data: existingAccount } = await Account.find(['accountId', '=', fromAccount], ['accountId', 'accountBalance']);
        if (!existingAccount) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: true,
                message: 'Account not found'
            });
        };
        const amountToFund = +amount;
        if (existingAccount.accountBalance - amountToFund < 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                error: true,
                message: 'Insufficient funds'
            });
        };
        // update from account
        const { data: { accountBalance } } = await Account.update(['accountId', '=', fromAccount], { accountBalance: +existingAccount.accountBalance - amountToFund }, ['accountId', 'accountBalance']);
        const { data: { createdAt, withdrawalId } } = await Withdrawal.create({
            amount,
            fromAccount: existingAccount.accountId
        });
        return res.status(StatusCodes.CREATED).json({
            error: false,
            message: 'Withdrawal successful',
            data: {
                createdAt,
                withdrawalId,
                amount,
                fromAccount: existingAccount.accountId,
                accountBalance,
            }
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: true,
            message: error.message
        });
    }
};

/**
 * 
 * @param {Object} req - Request Object
 * @param {Object} res - Response Object
 * @returns {Object} Returns an Error Object and or data
 */

// special login route to get user details
const login = async (req, res) => {
    const { username, password } = { ...req.query, ...req.params, ...req.body };
    if (!username || !password) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: true,
            message: 'username and password are required'
        });
    };
    try {
        const { data: existingAccount } = await Account.find(['username', '=', username], ['username', 'password', 'accountId', 'accountBalance']);
        if (!existingAccount) {
            return res.status(StatusCodes.NOT_FOUND).json({
                error: true,
                message: 'Account not found'
            });
        };
        const { password: accountPassword, ...userDetails } = existingAccount;
        // compare passwords using bcrypt
        const isPasswordValid = await bcrypt.compare(password, accountPassword);
        if (!isPasswordValid) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                error: true,
                message: 'Invalid password'
            });
        };
        // get all credits
        const { data: credits } = await Funding.find(['toAccount', '=', existingAccount.accountId], ['amount', 'createdAt', 'fundingId']);
        // get all debits
        const { data: debits } = await Withdrawal.find(['fromAccount', '=', existingAccount.accountId], ['amount', 'createdAt', 'withdrawalId']);
        // get all transfers
        const { data: transfers } = await Transfer.find(['fromAccount', '=', existingAccount.accountId], ['amount', 'createdAt', 'transferId']);
        return res.status(StatusCodes.OK).json({
            error: false,
            message: 'Login successful',
            data: {
                user: userDetails,
                credits: credits || [],
                debits: debits || [],
                transfers: transfers || [],
            }
        });
    } catch (error) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: true,
            message: error.message
        });
    }
}

module.exports = {
    createAccount,
    fundAccount,
    transferFunds,
    withdrawFunds,
    login,
}