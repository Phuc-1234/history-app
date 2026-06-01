// src/middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import {
    prisma,
    AuthenticatedUserPayload,
    ApiAuthErrorResponse,
} from "@history-app/shared";

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
): Promise<AuthenticatedUserPayload | jwt.VerifyErrors | null> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.split(" ")[1];

    return new Promise<AuthenticatedUserPayload | jwt.VerifyErrors | null>(
        (resolve) => {
            jwt.verify(
                token,
                getKey,
                { algorithms: ["RS256", "ES256"] },
                async (err, decoded) => {
                    if (err) {
                        // Return the specific error type back out of the promise wrapper
                        return resolve(err);
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
        },
    );
};

/**
 * MIDDLEWARE 1: Strict Verification Interceptor
 * blocks access unless a user is logged in AND has the 'STUDENT' role privileges.
 */
export const requireStudent = async (
    req: Request,
    res: Response<ApiAuthErrorResponse>, // 👈 Remove the loose '| { error: string }'
    next: NextFunction,
) => {
    const lookupResult = await extractUserProfileFromToken(req);

    if (lookupResult instanceof Error) {
        const isExpired = lookupResult.name === "TokenExpiredError";

        return res.status(401).json({
            error: isExpired
                ? "Access token session has expired."
                : "Access token signature is completely invalid.",
            code: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID", // ✅ Fixed: code added
        });
    }

    if (!lookupResult) {
        return res.status(401).json({
            error: "Access denied. Valid session missing.",
            code: "TOKEN_MISSING", // ✅ Now strictly validated
        });
    }

    req.user = lookupResult;

    // For a 403 Forbidden, you might want a generic fallback type,
    // or to update Response to handle authorization errors too.
    if (req.user.role !== "STUDENT") {
        return res.status(403).json({
            error: "Access forbidden. Student status required.",
            code: "TOKEN_INVALID",
        });
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
    const lookupResult = await extractUserProfileFromToken(req);
    req.user = lookupResult instanceof Error ? null : lookupResult;

    // Always let the request pass down to the controller loop!
    return next();
};
