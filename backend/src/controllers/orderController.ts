import type { Response } from "express";
import prisma from "../db.js";
import type { AuthenticatedRequest } from "../middlewares/authMiddleware.js";

// 1. Create a new Order (requires transaction)
export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { items } = req.body; // Expects items: [{ productId: 1, quantity: 2 }]
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized."
            });
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                status: "error",
                message: "Invalid order items. Must provide an array of items."
            });
        }

        // Fetch products matching the IDs to verify price and stock
        const productIds = items.map((item: any) => Number(item.productId));
        const dbProducts = await prisma.product.findMany({
            where: { id: { in: productIds } }
        });

        const productMap = new Map(dbProducts.map(p => [p.id, p]));

        let totalAmount = 0;
        const orderItemsData: any[] = [];
        const stockUpdates: { productId: number; newStock: number }[] = [];

        // Validate items and calculate total amount
        for (const item of items) {
            const productId = Number(item.productId);
            const quantity = Number(item.quantity);

            if (isNaN(productId) || isNaN(quantity) || quantity <= 0) {
                return res.status(400).json({
                    status: "error",
                    message: "Invalid product ID or quantity."
                });
            }

            const product = productMap.get(productId);
            if (!product) {
                return res.status(404).json({
                    status: "error",
                    message: `Product with ID ${productId} not found.`
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    status: "error",
                    message: `Insufficient stock for product "${product.title}". Only ${product.stock} items left.`
                });
            }

            const itemPrice = product.price;
            totalAmount += itemPrice * quantity;

            orderItemsData.push({
                productId,
                quantity,
                price: itemPrice
            });

            stockUpdates.push({
                productId,
                newStock: product.stock - quantity
            });
        }

        // Perform transactional database writes
        const order = await prisma.$transaction(async (tx) => {
            // A. Create the Order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    status: "PENDING",
                    items: {
                        create: orderItemsData
                    }
                },
                include: {
                    items: true
                }
            });

            // B. Update stock for each product
            for (const update of stockUpdates) {
                await tx.product.update({
                    where: { id: update.productId },
                    data: { stock: update.newStock }
                });
            }

            return newOrder;
        });

        res.status(201).json({
            status: "success",
            message: "Order placed successfully",
            data: order
        });

    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

// 2. Get past orders for logged-in user
export const getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized."
            });
        }

        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({
            status: "success",
            data: orders
        });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

// 3. Get single order by ID
export const getOrderById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orderId = Number(req.params.id);
        const userId = req.user?.id;
        const userRole = req.user?.role;

        if (!userId) {
            return res.status(401).json({
                status: "error",
                message: "Unauthorized."
            });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        });

        if (!order) {
            return res.status(404).json({
                status: "error",
                message: "Order not found."
            });
        }

        // Authorization check: User owns this order OR they are an admin
        if (order.userId !== userId && userRole !== "ADMIN") {
            return res.status(403).json({
                status: "error",
                message: "Forbidden. You cannot access this order."
            });
        }

        res.status(200).json({
            status: "success",
            data: order
        });
    } catch (error) {
        console.error("Error fetching order details:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};

// 4. Admin - Get all orders
export const getAllOrders = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                items: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        res.status(200).json({
            status: "success",
            data: orders
        });
    } catch (error) {
        console.error("Error fetching all orders:", error);
        res.status(500).json({
            status: "error",
            message: "Internal server error"
        });
    }
};
