import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import mongoose from "mongoose";
import { DB_URI } from "../constants.js";


const connectDB = async () => {

try{
   const connectionInstance = await mongoose.connect(`${process.env.MongoDB_URI}/${DB_URI}`);
   console.log(`\n mongo db connected...${connectionInstance.connection.host}`)

} catch(error){
    console.log("error in connecting to database", error);
    process.exit(1);
}
}
export default connectDB;