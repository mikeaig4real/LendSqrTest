const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();
// server
const {
    app,
    server
} = require('../app');
// chai-http
const chaiHttp = require('chai-http');
chai.use(chaiHttp);
// get connect from /db
const {
    getConnection,
    dropTable,
} = require('../db/connect');
const {
    AccountsTable,
    FundingTable,
    TransferTable,
    WithdrawalTable,
} = require('../db/dbtables');
// call connect
getConnection().then(() => {
    // console.log('connected to db');
});
// get all models in account
const {
    Account,
    Funding,
    Transfer,
    Withdrawal
} = require('../account/models/index');

// all routes
// create - /api/v1/user/account/create
// fund - /api/v1/user/account/fund
// withdraw - /api/v1/user/account/withdraw
// transfer - /api/v1/user/account/transfer
// login - /api/v1/user/account/login


// start a suite
suite('Functional Tests', function () {
    // before all tests in the suite drop all tables
    this.beforeAll(async function () {
        await dropTable(AccountsTable);
        await dropTable(FundingTable);
        await dropTable(TransferTable);
        await dropTable(WithdrawalTable);
    });
    // after all tests in the suite drop all tables
    this.afterAll(async function () {
        await dropTable(AccountsTable);
        await dropTable(FundingTable);
        await dropTable(TransferTable);
        await dropTable(WithdrawalTable);
        // await server.close();
    });
    // initiate a senderId, receiverId etc for future tests to mock models
    let senderId;
    let senderInitialBalance = 0;
    let senderPassword;
    let senderUsername;
    let senderEmail;
    let receiverId;
    let receiverInitialBalance = 0;
    let receiverPassword;
    let receiverUsername;
    let receiverEmail;
    // test create account
    // 1. on invalid input with no username, password, or email, return 400 and error object with error as true and message as 'username, password, and email are required'
    // 2. if an account with the same email already exists, return 400 and error object with error as true and message as 'Account already exists'
    // 3. on valid input, return 201 and object with error as false,a message as 'Account created successfully', and a data object with the account details such accountId, username, email, and accountBalance
    test('valid/invalid/same email input POST /api/v1/user/account/create', async function () {
        // invalid input with no username, password, or email
        const invalidInput = {
            username: '',
            password: '',
            email: '',
        };
        // valid input
        const validInput = {
            username: 'test',
            password: 'test',
            email: 'test@gmail.com',
        };

        const validInput2 = {
            username: 'test2',
            password: 'test2',
            email: 'test2@gmail.com',
        }
        // create account with invalid input
        const {
            status,
            body: {
                error,
                message,
            }
        } = await chai.request(app).post('/api/v1/user/account/create').send(invalidInput);
        // assert that the status is 400
        assert.equal(status, 400);
        // assert that the error is true
        assert.equal(error, true);
        // assert that the message is 'username, password, and email are required'
        assert.equal(message, 'username, password and email are required');

        // create account with valid input
        const {
            status: status2,
            body: {
                error: error2,
                message: message2,
                data: {
                    accountId,
                    username,
                    email,
                    accountBalance,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/create').send(validInput);

        // try to create account with same email
        const {
            status: status3,
            body: {
                error: error3,
                message: message3,
            }
        } = await chai.request(app).post('/api/v1/user/account/create').send(validInput);
        // assert that the status is 400
        assert.equal(status3, 400);
        // assert that the error is true
        assert.equal(error3, true);
        // assert that the message is 'Account already exists'
        assert.equal(message3, 'Account already exists');

        senderId = accountId;

        // assert that the status is 201
        assert.equal(status2, 201);
        // assert that the error is false
        assert.equal(error2, false);
        // assert that the message is 'Account created successfully'
        assert.equal(message2, 'Account created successfully');
        // assert that the accountId is a string
        assert.isString(accountId);
        // assert that the username is a string
        assert.isString(username);
        // assert that the email is a string
        assert.isString(email);
        // assert that the accountBalance is a string number to two decimal places
        assert.isString(accountBalance);
        // create account with valid input 2 for receiver
        const {
            status: status4,
            body: {
                error: error4,
                message: message4,
                data: {
                    accountId: accountId2,
                    username: username2,
                    email: email2,
                    accountBalance: accountBalance2,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/create').send(validInput2);
        // assert that the status is 201
        assert.equal(status4, 201);
        // assert that the error is false
        assert.equal(error4, false);
        // assert that the message is 'Account created successfully'
        assert.equal(message4, 'Account created successfully');
        // assert that the accountId is a string
        assert.isString(accountId2);
        // assert that the username is a string
        assert.isString(username2);
        // assert that the email is a string
        assert.isString(email2);
        // assert that the accountBalance is a string number to two decimal places
        assert.isString(accountBalance2);
        // set receiverId
        receiverId = accountId2;
        // set sender password
        senderPassword = validInput.password;
        // set sender username
        senderUsername = validInput.username;
        // set receiver password
        receiverPassword = validInput2.password;
        // set receiver username
        receiverUsername = validInput2.username;
        // set sender email
        senderEmail = validInput.email;
        // set receiver email
        receiverEmail = validInput2.email;
    });
    // test fund account
    // 1. on invalid input with no amount return 400 and error object with error as true and message as 'amount and toAccount are required'
    // 2. on an amount less than or equal to zero, return 400 and error object with error as true and message as 'amount must be greater than zero'
    // 3. on the request using authorization header with `Bearer ${invalid accountId}` return 401 and error object with error as true and message as 'Unauthorized, use valid accountId as token'
    // 4. on the request using authorization header with `Bearer ${valid accountId but does not exist}` return 401 and error object with error as true and message as 'Account not found'
    // 5. on valid input and authorization header with `Bearer ${senderId accountId}` return 200 and object with error as false, a message as 'Funding successful', and a data object with the funding details such createdAt, fundingId, toAccount, and accountBalance
    test('valid/invalid input, valid/invalid auth input POST /api/v1/user/account/fund', async function () {
        // invalid input with no amount
        const invalidInput = {
            amount: '',
            toAccount: undefined,
        };
        const invalidZeroInput = {
            amount: '0',
            toAccount: senderId,
        };
        const invalidInputUnknownAccount = {
            amount: '100',
            toAccount: 'ABCDEF',
        }
        // valid input
        const validInput = {
            amount: '1000',
            toAccount: senderId,
        };
        // invalid authorization header with invalid accountId
        const invalidAuth = ['Authorization', `Bearer ${invalidInput.toAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const validAuth = ['Authorization', `Bearer ${validInput.toAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const invalidAuthUnknown = ['Authorization', `Bearer ${invalidInputUnknownAccount.toAccount}`];

        // fund account with invalid input
        const {
            status,
            body: {
                error,
                message,
            }
        } = await chai.request(app).post('/api/v1/user/account/fund').set(...validAuth).send(invalidInput);
        // assert that the status is 400
        assert.equal(status, 400);
        // assert that the error is true
        assert.equal(error, true);
        // assert that the message is 'amount and toAccount are required'
        assert.equal(message, 'amount and toAccount are required');

        // fund account with valid input but invalid authorization header
        const {
            status: status2,
            body: {
                error: error2,
                message: message2,
            }
        } = await chai.request(app).post('/api/v1/user/account/fund').set(...invalidAuth).send(validInput);
        // assert that the status is 401
        assert.equal(status2, 401);
        // assert that the error is true
        assert.equal(error2, true);
        // assert that the message is 'Unauthorized'
        assert.equal(message2, 'Unauthorized, use valid accountId as token');

        // fund account with valid input, valid authorization header but account does not exist
        const {
            status: status3,
            body: {
                error: error3,
                message: message3,
            }
        } = await chai.request(app).post('/api/v1/user/account/fund').set(...invalidAuthUnknown).send(validInput);
        // assert that the status is 404
        assert.equal(status3, 404);
        // assert that the error is true
        assert.equal(error3, true);
        // assert that the message is 'Account not found'
        assert.equal(message3, 'Account not found');

        // fund with invalid input as zero
        const {
            status: status4,
            body: {
                error: error4,
                message: message4,
            }
        } = await chai.request(app).post('/api/v1/user/account/fund').set(...validAuth).send(invalidZeroInput);
        // assert that the status is 400
        assert.equal(status4, 400);
        // assert that the error is true
        assert.equal(error4, true);
        // assert that the message is 'amount must be greater than zero'
        assert.equal(message4, 'amount must be a number greater than 0');

        // fund account with valid input and valid authorization header
        const {
            status: status5,
            body: {
                error: error5,
                message: message5,
                data: {
                    createdAt,
                    fundingId,
                    toAccount,
                    accountBalance,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/fund').set(...validAuth).send(validInput);
        // assert that the status is 201
        assert.equal(status5, 201);
        // assert that the error is false
        assert.equal(error5, false);
        // assert that the message is 'Funding successful'
        assert.equal(message5, 'Funding successful');
        // assert that the createdAt is a valid date
        assert.equal(Number.isNaN(Date.parse(createdAt)), false);
        // assert that the fundingId is a string
        assert.isString(fundingId);
        // assert that the toAccount is a string
        assert.isString(toAccount);
        // assert that the accountBalance is a string number to two decimal places
        assert.isString(accountBalance);
        // assert that senderInitialBalance plus amount is equal to accountBalance
        assert.equal(parseFloat(senderInitialBalance) + parseFloat(validInput.amount), parseFloat(accountBalance));
        senderInitialBalance += parseFloat(validInput.amount);
    });

    // test withdraw account
    // 1. on invalid input with no amount return 400 and error object with error as true and message as 'amount and fromAccount are required'
    // 2. on an amount less than or equal to zero, return 400 and error object with error as true and message as 'amount must be greater than zero'
    // 3. on the request using authorization header with `Bearer ${invalid accountId}` return 401 and error object with error as true and message as 'Unauthorized, use valid accountId as token'
    // 4. on the request using authorization header with `Bearer ${valid accountId but does not exist}` return 401 and error object with error as true and message as 'Account not found'
    // 5. on withdrawal check if senderInitialBalance - amount is less than 0, return 400 and error object with error as true and message as 'Insufficient funds'
    // 6. on valid input and authorization header with `Bearer ${senderId accountId}` return 200 and object with error as false, a message as 'Withdrawal successful', and a data object with the withdrawal details such createdAt, amount, withdrawalId, fromAccount, and accountBalance
    test('valid/invalid input, valid/invalid auth input POST /api/v1/user/account/withdraw', async function () {
        // invalid input with no amount
        const invalidInput = {
            amount: '',
            fromAccount: undefined,
        };
        const invalidZeroInput = {
            amount: '0',
            fromAccount: senderId,
        };
        const invalidInputUnknownAccount = {
            amount: '100',
            fromAccount: 'ABCDEF',
        }
        const InsufficientFundsInput = {
            amount: '10000',
            fromAccount: senderId,
        }
        // valid input
        const validInput = {
            amount: '100',
            fromAccount: senderId,
        };
        // invalid authorization header with invalid accountId
        const invalidAuth = ['Authorization', `Bearer ${invalidInput.fromAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const validAuth = ['Authorization', `Bearer ${validInput.fromAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const invalidAuthUnknown = ['Authorization', `Bearer ${invalidInputUnknownAccount.fromAccount}`];

        // withdraw account with invalid input
        const {
            status,
            body: {
                error,
                message,
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...validAuth).send(invalidInput);
        // assert that the status is 400
        assert.equal(status, 400);
        // assert that the error is true
        assert.equal(error, true);
        // assert that the message is 'amount and fromAccount are required'
        assert.equal(message, 'amount and fromAccount are required');

        // withdraw account with valid input but invalid authorization header
        const {
            status: status2,
            body: {
                error: error2,
                message: message2,
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...invalidAuth).send(validInput);
        // assert that the status is 401
        assert.equal(status2, 401);
        // assert that the error is true
        assert.equal(error2, true);
        // assert that the message is 'Unauthorized'
        assert.equal(message2, 'Unauthorized, use valid accountId as token');

        // withdraw account with valid input but valid authorization header but account does not exist
        const {
            status: status3,
            body: {
                error: error3,
                message: message3,
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...invalidAuthUnknown).send(validInput);
        // assert that the status is 404
        assert.equal(status3, 404);
        // assert that the error is true
        assert.equal(error3, true);
        // assert that the message is 'Account not found'
        assert.equal(message3, 'Account not found');

        // withdraw account with invalid input as zero
        const {
            status: status4,
            body: {
                error: error4,
                message: message4,
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...validAuth).send(invalidZeroInput);
        // assert that the status is 400
        assert.equal(status4, 400);
        // assert that the error is true
        assert.equal(error4, true);
        // assert that the message is 'amount must be greater than 0'
        assert.equal(message4, 'amount must be a number greater than 0');

        // withdraw account with insufficient funds
        const {
            status: status5,
            body: {
                error: error5,
                message: message5,
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...validAuth).send(InsufficientFundsInput);
        // assert that the status is 400
        assert.equal(status5, 400);
        // assert that the error is true
        assert.equal(error5, true);
        // assert that the message is 'Insufficient funds'
        assert.equal(message5, 'Insufficient funds');

        // withdraw account with valid input and valid authorization header
        const {
            status: status6,
            body: {
                error: error6,
                message: message6,
                data: {
                    createdAt,
                    amount,
                    withdrawalId,
                    fromAccount,
                    accountBalance,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/withdraw').set(...validAuth).send(validInput);
        // assert that the status is 201
        assert.equal(status6, 201);
        // assert that the error is false
        assert.equal(error6, false);
        // assert that the message is 'Withdrawal successful'
        assert.equal(message6, 'Withdrawal successful');
        // assert that the createdAt is a valid date
        assert.equal(Number.isNaN(Date.parse(createdAt)), false);
        // assert that the amount is a valid number
        assert.equal(Number.isNaN(Number(amount)), false);
        // assert that the withdrawalId is a valid string
        assert.equal(typeof withdrawalId, 'string');
        // assert that the fromAccount is a valid string
        assert.equal(typeof fromAccount, 'string');
        // assert that the accountBalance is a valid number
        assert.equal(Number.isNaN(Number(accountBalance)), false);
        // assert that the accountBalance is equal to the senderInitialBalance - amount
        assert.equal(accountBalance, senderInitialBalance - validInput.amount);
        senderInitialBalance -= validInput.amount;
    });

    // test transfer from sender to receiver
    // 1. on invalid input with no amount or no toAccount return 400 and error object with error as true and message as 'amount and toAccount are required'
    // 2. on an amount less than or equal to zero, return 400 and error object with error as true and message as 'amount must be greater than 0'
    // 3. on the request using authorization header with `Bearer ${invalid accountId}` return 401 and error object with error as true and message as 'Unauthorized, use valid accountId as token'
    // 4. on the request using authorization header with `Bearer ${valid accountId but does not exist}` return 404 and error object with error as true and message as 'Account not found (Giver)'
    // 5. on the request using authorization header with `Bearer ${valid accountId}` but toAccount does not exist return 404 and error object with error as true and message as 'Account not found (Receiver)'
    // 6. on withdrawal check if senderInitialBalance - amount is less than 0, return 400 and error object with error as true and message as 'Insufficient funds'
    // 7. on valid input and authorization header with `Bearer ${senderId accountId}` return 200 and object with error as false, a message as 'Transfer successful', and a data object with the withdrawal details such createdAt, amount, transferId, fromAccount, toAccount and accountBalance

    test('valid/invalid input, valid/invalid auth input POST /api/v1/user/account/transfer', async function () {
        // invalid input with no amount and no toAccount
        const invalidInput = {
            amount: '',
            toAccount: '',
            fromAccount: '',
        };

        // invalid input with amount less than or equal to zero
        const invalidZeroInput = {
            toAccount: receiverId,
            amount: '0',
            fromAccount: senderId,
        };

        // valid input with valid accountId
        const validInput = {
            fromAccount: senderId,
            toAccount: receiverId,
            amount: '100',
        };

        // valid input with valid accountId but does not exist
        const unknownSenderAccount = {
            fromAccount: 'ABCDEF',
            toAccount: receiverId,
            amount: '100',
        };

        // valid input with invalid accountId
        const invalidSenderAccount = {
            fromAccount: undefined,
            toAccount: receiverId,
            amount: '100',
        };

        // valid input with valid accountId but does not exist
        const unknownReceiverAccount = {
            toAccount: 'ABCDEF',
            fromAccount: senderId,
            amount: '100',
        };

        const InsufficientFundsInput = {
            toAccount: receiverId,
            fromAccount: senderId,
            amount: '100000',
        };

        // invalid authorization header with invalid accountId
        const invalidAuth = ['Authorization', `Bearer ${invalidSenderAccount.fromAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const validAuth = ['Authorization', `Bearer ${validInput.fromAccount}`];
        // invalid authorization header with valid accountId but does not exist
        const invalidAuthUnknown = ['Authorization', `Bearer ${unknownSenderAccount.fromAccount}`];

        // transfer from sender to receiver with invalid input
        const {
            status,
            body: {
                error,
                message,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...validAuth).send(invalidInput);
        // assert that the status is 400
        assert.equal(status, 400);
        // assert that the error is true
        assert.equal(error, true);
        // assert that the message is 'amount and toAccount are required'
        assert.equal(message, 'amount, fromAccount and toAccount are required');

        // transfer from sender to receiver with invalid zero input
        const { 
            status: status21,
            body: { 
                error: error21,
                message: message21,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...validAuth).send(invalidZeroInput);
        // assert that the status is 400
        assert.equal(status21, 400);
        // assert that the error is true
        assert.equal(error21, true);
        // assert that the message is 'amount must be greater than 0'
        assert.equal(message21, 'amount must be a number greater than 0');

        // transfer from sender to receiver with valid input but invalid authorization header
        const {
            status: status2,
            body: {
                error: error2,
                message: message2,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...invalidAuth).send(validInput);
        // assert that the status is 401
        assert.equal(status2, 401);
        // assert that the error is true
        assert.equal(error2, true);
        // assert that the message is 'Unauthorized, use valid accountId as token'
        assert.equal(message2, 'Unauthorized, use valid accountId as token');

        // transfer from sender to receiver with unknown sender
        const { 
            status: status3,
            body: { 
                error: error3,
                message: message3,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...invalidAuthUnknown).send(validInput);
        // assert that the status is 404
        assert.equal(status3, 404);
        // assert that the error is true
        assert.equal(error3, true);
        // assert that the message is 'Account not found (Giver)'
        assert.equal(message3, 'Account not found (Giver)');

        // transfer from sender to receiver with unknown receiver
        const { 
            status: status4,
            body: { 
                error: error4,
                message: message4,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...validAuth).send(unknownReceiverAccount);
        // assert that the status is 404
        assert.equal(status4, 404);
        // assert that the error is true
        assert.equal(error4, true);
        // assert that the message is 'Account not found (Receiver)'
        assert.equal(message4, 'Account not found (Receiver)');

        // transfer from sender to receiver with insufficient funds
        const { 
            status: status5,
            body: { 
                error: error5,
                message: message5,
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...validAuth).send(InsufficientFundsInput);

        // assert that the status is 400
        assert.equal(status5, 400);
        // assert that the error is true
        assert.equal(error5, true);
        // assert that the message is 'Insufficient funds'
        assert.equal(message5, 'Insufficient funds');

        // transfer from sender to receiver with valid input
        const { 
            status: status6,
            body: { 
                error: error6,
                message: message6,
                data: { 
                    createdAt,
                    amount,
                    transferId,
                    fromAccount,
                    toAccount,
                    accountBalance,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/transfer').set(...validAuth).send(validInput);
        // assert that the status is 201
        assert.equal(status6, 201);
        // assert that the error is false
        assert.equal(error6, false);
        // assert that the message is 'Transfer successful'
        assert.equal(message6, 'Transfer successful');
        // assert that the createdAt is a valid date using Date.parse and Number.isNaN
        assert.equal(!Number.isNaN(Date.parse(createdAt)), true);
        // assert that the amount is equal to the amount sent
        assert.equal(amount, +validInput.amount);
        // assert that the transferId is 'toAccount-fromAccount'
        assert.equal(transferId, `${validInput.fromAccount}-${validInput.toAccount}`);
        // assert that the fromAccount is equal to the accountId sent
        assert.equal(fromAccount, validInput.fromAccount);
        // assert that the toAccount is equal to the accountId sent
        assert.equal(toAccount, validInput.toAccount);
        // assert that the accountBalance is equal to the senderInitialBalance - amount
        assert.equal(accountBalance, senderInitialBalance - validInput.amount);
        senderInitialBalance -= validInput.amount;
        receiverInitialBalance += validInput.amount;
    });

    // test login with both sender and receiver
    // 1. login must be with present username and password else return an error object with error as true and message as 'username and password are required'
    // 2. login must be with a username that exists else return an error object with error as true and message as 'Account not found'
    // 3. login must be with a username that exists and password that matches the password in the database else return an error object with error as true and message as 'Invalid password'
    // 4. with a valid username and password, return a success object with error as false and message as 'Login successful' and data with user,transfers,credits,debits as keys, the user must be an object with keys 'username', 'email', 'accountId', 'accountBalance' and debits,credits,transfers must be arrays

    test('valid/invalid input POST /api/v1/user/account/login', async function () {
        // valid sender login
        const validSendersLogin = {
            username: senderUsername,
            password: senderPassword,
        };
        // valid receiver login
        const validReceiversLogin = {
            username: receiverUsername,
            password: receiverPassword,
        };
        // invalid sender login
        const invalidSendersLogin = {
            username: '',
            password: '',
        };
        // invalid receiver login
        const invalidReceiversLogin = {
            username: '',
            password: '',
        };
        // unknown sender login
        const unknownSendersLogin = {
            username: 'unknown',
            password: 'unknown',
        };
        // unknown receiver login
        const unknownReceiversLogin = {
            username: 'unknown',
            password: 'unknown',
        }
        // wrong sender password
        const wrongSendersPassword = {
            username: senderUsername,
            password: 'wrongPassword',
        };
        // wrong receiver password
        const wrongReceiversPassword = {
            username: receiverUsername,
            password: 'wrongPassword',
        };

        // login with invalid sender input
        const { 
            status: status1,
            body: { 
                error: error1,
                message: message1,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(invalidSendersLogin);
        // assert that the status is 400
        assert.equal(status1, 400);
        // assert that the error is true
        assert.equal(error1, true);
        // assert that the message is 'username and password are required'
        assert.equal(message1, 'username and password are required');

        // login with invalid receiver input
        const { 
            status: status2,
            body: { 
                error: error2,
                message: message2,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(invalidReceiversLogin);
        // assert that the status is 400
        assert.equal(status2, 400);
        // assert that the error is true
        assert.equal(error2, true);
        // assert that the message is 'username and password are required'
        assert.equal(message2, 'username and password are required');

        // login with unknown sender input
        const { 
            status: status3,
            body: { 
                error: error3,
                message: message3,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(unknownSendersLogin);
        // assert that the status is 404
        assert.equal(status3, 404);
        // assert that the error is true
        assert.equal(error3, true);
        // assert that the message is 'Account not found'
        assert.equal(message3, 'Account not found');

        // login with unknown receiver input
        const { 
            status: status4,
            body: { 
                error: error4,
                message: message4,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(unknownReceiversLogin);
        // assert that the status is 404
        assert.equal(status4, 404);
        // assert that the error is true
        assert.equal(error4, true);
        // assert that the message is 'Account not found'
        assert.equal(message4, 'Account not found');

        // login with wrong sender password
        const { 
            status: status5,
            body: { 
                error: error5,
                message: message5,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(wrongSendersPassword);
        // assert that the status is 401
        assert.equal(status5, 401);
        // assert that the error is true
        assert.equal(error5, true);
        // assert that the message is 'Invalid password'
        assert.equal(message5, 'Invalid password');

        // login with wrong receiver password
        const { 
            status: status6,
            body: { 
                error: error6,
                message: message6,
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(wrongReceiversPassword);
        // assert that the status is 401
        assert.equal(status6, 401);
        // assert that the error is true
        assert.equal(error6, true);
        // assert that the message is 'Invalid password'
        assert.equal(message6, 'Invalid password');

        // login with valid sender input
        const { 
            status: status7,
            body: { 
                error: error7,
                message: message7,
                data: { 
                    user: { 
                        username: senderResUsername,
                        email: senderResEmail,
                        accountId: senderResAccountId,
                        accountBalance: senderResAccountBalance,
                    },
                    transfers: senderResTransfers,
                    credits: senderResCredits,
                    debits: senderResDebits,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(validSendersLogin);
        // assert that the status is 200
        assert.equal(status7, 200);
        // assert that the error is false
        assert.equal(error7, false);
        // assert that the message is 'Login successful'
        assert.equal(message7, 'Login successful');
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(senderResTransfers);
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(senderResCredits);
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(senderResDebits);
        // check that the user is the same as the sender
        assert.equal(senderResUsername, senderUsername);
        assert.equal(senderResEmail, senderEmail);
        assert.equal(senderResAccountId, senderId);
        assert.equal(+senderResAccountBalance, senderInitialBalance);

        // login with valid receiver input
        const { 
            status: status8,
            body: { 
                error: error8,
                message: message8,
                data: { 
                    user: { 
                        username: receiverResUsername,
                        email: receiverResEmail,
                        accountId: receiverResAccountId,
                        accountBalance: receiverResAccountBalance,
                    },
                    transfers: receiverResTransfers,
                    credits: receiverResCredits,
                    debits: receiverResDebits,
                }
            }
        } = await chai.request(app).post('/api/v1/user/account/login').send(validReceiversLogin);
        // assert that the status is 200
        assert.equal(status8, 200);
        // assert that the error is false
        assert.equal(error8, false);
        // assert that the message is 'Login successful'
        assert.equal(message8, 'Login successful');
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(receiverResTransfers);
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(receiverResCredits);
        // assert that the user is an object with keys 'username', 'email', 'accountId', 'accountBalance'
        assert.isArray(receiverResDebits);
        // check that the user is the same as the receiver
        assert.equal(receiverResUsername, receiverUsername);
        assert.equal(receiverResEmail, receiverEmail);
        assert.equal(receiverResAccountId, receiverId);
        assert.equal(+receiverResAccountBalance, receiverInitialBalance);
    })
});