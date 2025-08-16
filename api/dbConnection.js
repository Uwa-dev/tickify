import mongoose from "mongoose";

const connectDB = async() => {
    try{
    //    await mongoose.connect('mongodb+srv://omoikejoy34:Joyomoike@tickify-free.tt2ftro.mongodb.net/');
        await mongoose.connect('mongodb://localhost:27017/Tickify');
       console.log('Connected to Tickify database');
    }catch(error){
        console.log(`Database Connection failed: ${error.message}`);
        process.exit(1)
    }
}

export default connectDB;


//mongodb+srv://omoikejoy34:tickify@tickify.wvutphr.mongodb.net/