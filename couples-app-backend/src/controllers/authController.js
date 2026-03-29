import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcrypt';

const generateConnectionCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const registerUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            res.status(400);
            throw new Error('Please add all fields');
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate unique 6 char connection code
        let connectionCode = generateConnectionCode();
        let codeExists = await User.findOne({ connectionCode });
        while(codeExists) {
            connectionCode = generateConnectionCode();
            codeExists = await User.findOne({ connectionCode });
        }

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            connectionCode
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                name: user.name,
                email: user.email,
                connectionCode: user.connectionCode,
                partnerId: user.partnerId,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch(err) {
        next(err);
    }
};

const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (user && (await bcrypt.compare(password, user.password))) {
            res.json({
                _id: user.id,
                name: user.name,
                email: user.email,
                connectionCode: user.connectionCode,
                partnerId: user.partnerId,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid credentials');
        }
    } catch(err) {
        next(err);
    }
};

const connectPartner = async (req, res, next) => {
    try {
        const { connectionCode } = req.body;
        const userId = req.user.id; // from auth middleware

        if (!connectionCode) {
            res.status(400);
            throw new Error('Please provide a connection code');
        }

        const partner = await User.findOne({ connectionCode });

        if (!partner) {
            res.status(404);
            throw new Error('Invalid connection code');
        }

        if (partner._id.toString() === userId) {
            res.status(400);
            throw new Error('You cannot connect with your own code');
        }

        if (partner.partnerId) {
            res.status(400);
            throw new Error('This user is already connected to someone else');
        }

        const user = await User.findById(userId);
        if (user.partnerId) {
            res.status(400);
            throw new Error('You are already connected to someone');
        }

        // Link both users
        user.partnerId = partner._id;
        partner.partnerId = user._id;

        await user.save();
        await partner.save();

        res.json({
            message: 'Successfully connected with partner!',
            partnerName: partner.name,
            partnerId: partner._id
        });
    } catch(err) {
        next(err);
    }
};

const getPartner = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user.partnerId) {
            return res.status(404).json({ message: 'No partner connected' });
        }
        const partner = await User.findById(user.partnerId).select(
            'name profilePic currentMood currentEnergy lastCheckInMessage lastCheckInDate connectionCode'
        );
        if (!partner) {
            return res.status(404).json({ message: 'Partner not found' });
        }
        res.json(partner);
    } catch (err) {
        next(err);
    }
};

export {
    registerUser,
    loginUser,
    connectPartner,
    getPartner
};
