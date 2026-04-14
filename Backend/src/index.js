import "dotenv/config";
import connectDB from "./config/DBConnection.js"
import { server } from "./websocket.js"
import { app } from "./app.js"

connectDB()
.then(()=>{
    app.on("error", (error)=>{
        console.log("ERROR :", error);
        throw error
    })
    
    const port = process.env.PORT || 5050;
    server.listen(port, () => {
        console.log(`Server and WebSocket are running on port ${port}`);
    })
})
.catch((err)=>{
    console.log("MONGODB CONNECTION FAILED !!", err); 
});
