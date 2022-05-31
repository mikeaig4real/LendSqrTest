const { StatusCodes } = require('http-status-codes');

const fauxAuthentication = (req, res, next) => {
  // check if headers start with 'Bearer ' and if so, remove the 'Bearer '
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') && req.headers.authorization.split(' ')[1].length === 6) {
    const token = req.headers.authorization.split(' ')[1];
    req.user = {
      account: token
    };
    next();
  } else {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: true,
      message: 'Unauthorized, use valid accountId as token'
    });
  }
};


module.exports = fauxAuthentication;
