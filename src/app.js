// import express from "express"
// import cors from "cors"
// import cookieParser from "cookie-parser"

// const app = express()

// app.use(cors({
//     origin : process.env.CORS_ORIGIN,
//     credentials: true,
// }))


// app.use(express.json({limit:"20kb"}))
// app.use(express.urlencoded({extended : true, limit:"20kb"}))
// app.use(express.static("public"))
// app.use(cookieParser())


// //routes 



// import userRouter from './routes/user.routes.js'


// //routes declaration

// app.use("/api/v1/users",userRouter)
// //http://localhost:8000/api/v1/users/register


// export {app}





import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// 👇 Dynamic CORS config for multiple frontend domains
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests from tools like Postman or curl
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";

// route declaration
app.use("/api/v1/users", userRouter); // http://localhost:8000/api/v1/users/register

export { app };