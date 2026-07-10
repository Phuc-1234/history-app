// index.ts
import express, { Application, Request, Response, NextFunction } from "express";

import dotenv from "dotenv";
import path from "path";
// Load environment variables (.env)
dotenv.config({
    path: path.resolve(__dirname, '../.env')
});

import cors from "cors";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import contentRoutes from "./routes/contentRoutes";
import gamificationRoutes from "./routes/gamificationRoutes";
import testsRoutes from "./routes/testsRoutes";
import testLogsRoutes from "./routes/testLogsRoutes";
import adminRoutes from "./routes/adminRoutes";
import flashcardRoutes from "./routes/flashcardRoutes";
import socialRoutes from "./routes/socialRoutes";
import testRoutesV2 from "./routes/testRoutesV2";
import paymentRoutes from "./routes/paymentRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import homeRoutes from "./routes/homeRoutes";





const app: Application = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Middleware Pipeline
// ==========================================
// Allow your frontend origins to talk to the backend
app.use(cors({
    origin: '*', // For development, this allows web browsers and mobile apps to pass through freely
}));
app.use(express.json()); // CRITICAL: Parses incoming raw JSON request bodies onto req.body

// ==========================================
// API Route Bindings
// ==========================================
// Mounts your authentication routes under the /api/auth prefix
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
// Triggers hot-reload for feedback routes inclusion
app.use("/api/content", contentRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/tests", testsRoutes);
app.use("/api/test-logs", testLogsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/tests-v2", testRoutesV2);
app.use("/api/payment", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/home", homeRoutes);


// Base Health Check Route (Great for beating Render's spin-down rate limits!)
app.get("/api/healthcheck", (req: Request, res: Response) => {
    res.status(200).send("OK");
});

// anti stack trace leak
// This MUST have 4 parameters so Express recognizes it as an error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // 1. Catch malformed JSON bodies specifically from body-parser
    if (
        err instanceof SyntaxError &&
        "status" in err &&
        err.status === 400 &&
        "body" in err
    ) {
        return res.status(400).json({
            error: "Invalid JSON format payload provided.",
        });
    }

    // 2. Fallback protection for any other unhandled synchronous/asynchronous server crashes
    console.error("Unhandled Global Server Error:", err.message); // Kept safe in server console logs

    return res.status(500).json({
        error: "An unexpected operational anomaly occurred on the server.",
    });
});

// ==========================================
// Server Boot Initialization
// ==========================================
app.listen(PORT, () => {
    console.log(
        `🚀 History Duolingo Engine running on http://localhost:${PORT}`,
    );
});
