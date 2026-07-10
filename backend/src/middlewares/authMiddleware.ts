import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

// Define the payload structure inside the JWT
interface JwtPayload {
    id: number;
    role: "BUYER" | "ADMIN";
}

// Extend Express Request to include the user field
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

// Auth User

export const authenticateUser = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            status: "error",
            message: "Access denied. No token provided."
        });
    }

    const token = authHeader.split(" ")[1];

    try {
        if (!token) {
            return res.status(401).json({
                status: "error",
                message: "Access denied. Token is missing."
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        req.user = decoded; // Attach user payload to the request
        next(); // Call the next handler
    } catch (error) {
        return res.status(403).json({
            status: "error",
            message: "Invalid or expired token."
        });
    }
};


// Auth Roles
export const authorizeRoles = (...allowedRoles: ("BUYER" | "ADMIN")[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized. Please log in first."
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                status: "error",
                message: "Forbidden. You do not have permission to perform this action."
            });
        }

        next();
    };
};
