const UnauthorizedException = require("../http/exceptions/UnauthorizedException");
const JWT = require("../security/JWT");

module.exports = async (req, res, next)=> {

  try {
    
    let header;
    
    if (req.get) 
      header = req.get('Authorization');
    else if (req.headers.authorization) 
      header = req.headers.authorization;

    if (!header) throw Error('No authorization header');

    const token = header.substring('bearer'.length+1);

    const auth = await JWT.verifyJWT(token);

    req.auth = auth;

    next();

  } catch (error) {
    if (req.get)
      next(new UnauthorizedException(error));
    else
      next(error);
  }
};

