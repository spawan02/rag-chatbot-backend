import express from "express";
import chatRoutes from "./routes/chat";
import { PORT } from "./config";

const app = express();

app.use(express.json());
app.use("/api/v1", chatRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));