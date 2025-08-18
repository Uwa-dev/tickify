import express from 'express';
import { protect, admin } from '../utils/createToken.js';
import { 
    loginUser, 
    logoutUser, 
    register, 
    userProfile, 
    updateUserProfile, 
    updateAccountDetails, 
    // deleteUserAccount, 
    // changePassword, 
    getUserById 
} from '../controller/userController.js';

const userRouter = express.Router();

userRouter.post('/register', register)
userRouter.post('/login', loginUser);
userRouter.post("/logout", logoutUser)
userRouter.get("/profile", protect, userProfile);
userRouter.put('/profile/update', protect, updateUserProfile);
userRouter.put('/account/details', protect, updateAccountDetails);
userRouter.get('/:id', protect, admin, getUserById )
// userRouter.delete('/:id', protect, deleteUserAccount);
// userRouter.put('/:id/password', changePassword);

export default userRouter;