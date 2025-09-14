import express from "express";
import chatRoutes from "./routes/chat";
import { PORT } from "./config";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();
app.use(cors());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50,
  message: "Too many requests, please try again later.",
}));

app.use(express.json());
app.use("/api/v1", chatRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));