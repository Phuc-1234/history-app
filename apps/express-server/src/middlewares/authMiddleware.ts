// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { prisma } from "@history-app/shared";
import { AuthenticatedUserPayload } from "@history-app/shared";

// 1. Initialize the JWKS client using the URL configuration from your environment settings
const client = jwksClient({
    jwksUri:
        process.env.SUPABASE_JWKS_URL ||
        "https://zxoiowktwundibeofwnt.supabase.co/auth/v1/.well-known/jwks.json",
    cache: true, // Caches public signing keys locally so it doesn't slam Supabase on every request
    rateLimit: true, // Protects against socket flooding
    jwksRequestsPerMinute: 10,
});

// Dynamic signing key retriever for the jsonwebtoken engine
const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
    client.getSigningKey(header.kid, (err, key) => {
        if (err || !key) {
            return callback(
                err || new Error("Target public signing key not found."),
            );
        }
        callback(null, key.getPublicKey());
    });
};

/**
 * Internal helper function to decode tokens and extract the user's Prisma record data
 */
const extractUserProfileFromToken = async (
    req: Request,
): Promise<AuthenticatedUserPayload | null> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    return new Promise((resolve) => {
        jwt.verify(
            token,
            getKey,
            { algorithms: ["RS256", "ES256"] },
            async (err, decoded) => {
                if (err || !decoded) {
                    return resolve(null); // Invalid token structure
                }

                const payload = decoded as jwt.JwtPayload;

                try {
                    // Hydrate from your custom Prisma table structure using the token's 'sub' user UUID
                    const userProfile = await prisma.user.findUnique({
                        where: { id: payload.sub },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            role: true,
                            totalGold: true,
                            totalXp: true,
                        },
                    });

                    if (!userProfile) return resolve(null);

                    return resolve(userProfile as AuthenticatedUserPayload);
                } catch (dbError) {
                    console.error(
                        "Database lookup error during token hydration:",
                        dbError,
                    );
                    return resolve(null);
                }
            },
        );
    });
};

/**
 * MIDDLEWARE 1: Strict Verification Interceptor
 * blocks access unless a user is logged in AND has the 'STUDENT' role privileges.
 */
export const requireStudent = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    req.user = await extractUserProfileFromToken(req);

    if (!req.user) {
        return res
            .status(401)
            .json({ error: "Access denied. Valid login session required." });
    }

    if (req.user.role !== "STUDENT") {
        return res
            .status(403)
            .json({ error: "Access forbidden. Student status required." });
    }

    return next();
};

/**
 * MIDDLEWARE 2: Optional / Guest Interceptor
 * Always allows the request through. If a token is provided, it extracts user details
 * so the frontend can display custom curriculum pathways. Otherwise, they remain a generic guest.
 */
export const optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    req.user = await extractUserProfileFromToken(req);

    // Always let the request pass down to the controller loop!
    return next();
};
