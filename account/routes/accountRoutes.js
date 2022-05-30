const express = require('express');
const router = express.Router();

const {
    createAccount,
    fundAccount,
    transferFunds,
    withdrawFunds,
    login,
} = require('../controllers/accountController');

const auth = require('../middleware/fauxAuth');

router.post('/login', login);

router.post('/create', createAccount);

router.post('/fund', auth, fundAccount);

router.post('/transfer', auth, transferFunds);

router.post('/withdraw', auth, withdrawFunds);


module.exports = router