import jwt from "jsonwebtoken";
import User from '../models/userModel.js';

const generateToken = (res, user) => {
  try {
    // 1. Verify JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('[Token Error] JWT_SECRET is not defined in environment variables');
      throw new Error('JWT_SECRET is missing');
    }

    // 2. Create the token payload
    const payload = {
      id: user._id,
      isAdmin: user.isAdmin,
      generatedAt: new Date().toISOString()
    };

    // 3. Generate the token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // 4. Verify the token can be decoded (sanity check)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (verifyError) {
      console.error('[Token Error] Generated token failed verification:', verifyError);
      throw new Error('Token verification failed');
    }

    // 5. Set cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    };

    return token;

  } catch (error) {
    console.error('[Token Error] Token generation failed:', error);
    throw error; // Re-throw to be handled by the calling function
  }
};

export default generateToken;


const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, no token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized, user not found'
      });
    }

    req.user = {
      id: user._id,
      isAdmin: user.isAdmin,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    next();
  } catch (error) {
    console.error('Error in protect middleware:', error);
    res.status(401).json({
      success: false,
      error: 'Not authorized, token failed'
    });
  }
};



const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({
      error: 'Not authorized as admin'
    });
  }
};
// const admin = (req, res, next) => {
//   if (req.user && req.user.isAdmin) {
//     next();
//   } else {
//     res.status(403).json({
//       error: 'Not authorized as admin'
//     });
//   }
// };

export { protect, admin };