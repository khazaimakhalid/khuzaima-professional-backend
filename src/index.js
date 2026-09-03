import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
});

connectDB()

.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`server is running on port ${process.env.PORT || 8000}`);  
    });
})
.catch((error) => {
    console.error("Failed to connect to database:", error);
})








// import express from "express"
// const app = express()
//  (async () =>{
//     try {
//         await  mongosose.connect(`${process.env.MongoDB_URI}/${DB_URI}`)
//         app.on("error", (error)=> {
//           console.log("error in connecting to database" ,error);
//           throw error;
//         })
//         app.listen(process.env.PORT, ()=> {
//             console.log(`server is running on port ${process.env.PORT}`);
//         })
//          } catch(error){
//            console.log("error:",error);

//            throw error;
//          }
//  })()