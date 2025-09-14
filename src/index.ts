import express from "express";
import chatRoutes from "./routes/chat";
import { ALLOWED_ORIGINS, PORT } from "./config";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));


app.use(rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50,
  message: "Too many requests, please try again later.",
}));

app.use(express.json());
app.use("/api/v1", chatRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));