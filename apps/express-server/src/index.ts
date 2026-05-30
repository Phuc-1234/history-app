import express from "express";
// Import the prisma client instance directly from your shared package
import { prisma } from "@history-app/shared";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

app.listen(PORT, () => {
    console.log(`🚀 Express server running on http://localhost:${PORT}`);
});
