// require('dotenv').config({path: '/.env'})


import dotenv from "dotenv"
import connectDB from "./db/index.js";
import express from "express"
// const app = express()
import {app} from "./app.js"
dotenv.config({path: '/.env'})


connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{
    console.log("MOngo DB connection falied ", err);
    
})






// first Approach 

// import express from "express"
// const app = express()

// (async ()=>{
//     try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//     app.on("error" , (error)=>{
//         console.log("Error :" , error)
//         throw error
//     })

//     app.listen(process.env.PORT, ()=>{
//         console.log(`the port is runninhon ${process.env.PORT}`);
        
//     })
//     }catch(error){
//       console.error("Error :" ,error);
//       throw error 
      
//     }
// })()