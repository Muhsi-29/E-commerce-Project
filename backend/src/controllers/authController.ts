import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export const register = async (req: Request, res: Response) => {
    try {
        const { email, password, name, role } = req.body;

        // 1. Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({
                status: "error",
                message: "Email, password, and name are required."
            });
        }

        // 2. Check if the user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                status: "error",
                message: "Email is already registered."
            });
        }

        // 3. Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Save the user to the database
        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || "BUYER"
            }
        });

        // 5. Exclude password from the response for security
        const { password: _, ...userWithoutPassword } = newUser;

        res.status(201).json({
            status: "success",
            message: "User registered successfully",
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // 1. Basic validation
        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required."
            });
        }

        // 2. Find user in the database
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        // 3. Compare passwords
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        // 4. Generate JWT
        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" } // Token is valid for 1 day
        );

        // 5. Exclude password from response
        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: "success",
            message: "Logged in successfully",
            token,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                status: "error",
                message: "Email and password are required."
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        // STRICT ADMIN CHECK
        if (user.role !== "ADMIN") {
            return res.status(403).json({
                status: "error",
                message: "Forbidden: Admin access only."
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                status: "error",
                message: "Invalid email or password."
            });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        const { password: _, ...userWithoutPassword } = user;

        res.status(200).json({
            status: "success",
            message: "Admin logged in successfully",
            token,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error("Admin Login error:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};
