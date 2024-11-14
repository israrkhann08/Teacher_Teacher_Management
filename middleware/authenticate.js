const jwt = require('jsonwebtoken');
const SecretKey = "12345678Key";

function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (token) {
        try {
            const decoded = jwt.verify(token, SecretKey);
            req.user = decoded; 
            next(); 
        } catch (error) {
            res.status(401).json({ message: "Invalid token" });
        }
    } else {
        return res.status(401).json({ message: "No token provided" });
    }
}

module.exports = authenticate;
