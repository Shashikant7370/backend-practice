import mongoose from "mongoose";
import {DB_Name} from "../constants.js";

async function connectDB(){
    try {
        const connectionInstance = await mongoose.connect(
          `${process.env.MONGODB_URL}/${DB_Name}`,
        );
        console.log(`\n MongoDB connected... DB Host : ${connectionInstance.connection.host}`)


    } catch (error) {
        console.log("Connection Error : ",error);
        process.exit(1)
    }

}

export default connectDB;