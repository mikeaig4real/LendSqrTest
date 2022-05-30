require('dotenv').config();
// const axios = require('axios');
const fetch = require('node-fetch');

const validateAccount = async ({ account_number }) => {
    if (!account_number) {
        throw new Error('account_number is needed to validate account');
    };
    try {
        const response = await fetch(`https://${process.env.VALIDATION_API}?account_number=${account_number}&bank_code=${process.env.VALIDATION_CODE}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${process.env.PAYSTACK_PK}`
            }
        });
        const { status, message } = await response.json();
        return {
            status,
            message
        };
    } catch (error) {
        return {
            status: false,
            message: error.message
        }
    }
}



module.exports = validateAccount;