// src/types/express.d.ts
import { AuthenticatedUserPayload } from "@history-app/shared";

declare global {
    namespace Express {
        interface Request {
            // req.user will be populated on protected routes, or null for unauthenticated guests
            user: AuthenticatedUserPayload | null;
        }
    }
}
 