import jwt from 'jsonwebtoken';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'devsecret123', {
        expiresIn: '30d',
    });
};

export default generateToken;
