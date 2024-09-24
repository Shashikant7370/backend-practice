import dotenv from "dotenv"
import connectDB from "./db/connection.js"
import {app} from "./app.js"

dotenv.config({
    path:'./env'
})

// const PORT = process.env.PORT || 8000;

connectDB().then( ()=>{
    
        app.listen(process.env.PORT, () => {
          console.log(`App is listening on PORT : ${process.env.PORT}`);
        });

    }

).catch((err)=>{
    console.log("Connection is failed !!!!",err);
    throw err
});












/*
import express from "express";
const app = express();

(async () =>{
    try {

        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_Name}`);
        app.on("error", (err) => {
           console.log("Error : ", err);
         });

        app.listen(`${process.env.PORT}`, () => {
           console.log(`App is listening on port : ${process.env.PORT}`);
        });

    } catch (error) {
        console.log("error ",error);
    
}

   


})();*/