// require('dotenv').config({path:'./env'}) // or import 'dotenv/config' if you're using ES6
// require('dotenv').config({path: './env'})
import dotenv from "dotenv";
import { app } from './app.js';
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})



connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})










/*
import express from "express"
const app = express()
( async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("errror", (error) => {
            console.log("ERRR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error("ERROR: ", error)
        throw err
    }
})()

*/


// method 1 
/* 
import express from "express"

const app=express()

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_name}`)
        app.on("error",(err)=>{
            console.log(`Error: ${err}.`);
            throw err
        })
        app.listen(process.env.PORT,()=>{

            console.log(`Server running on port ${process.env.PORT  }`)
        })
    }
    catch(error){
        console.error("error",error)
        throw err
    }
})()*/