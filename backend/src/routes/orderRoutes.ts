import { Router } from "express";
import { createOrder, getUserOrders, getOrderById, getAllOrders } from "../controllers/orderController.js";
import { authenticateUser, authorizeRoles } from "../middlewares/authMiddleware.js";

const router = Router();

// Apply auth check to all routes below this line
router.use(authenticateUser as any);

router.post("/", createOrder); // POST /api/orders -> Place a new order
router.get("/", getUserOrders); // GET /api/orders -> Get user order history
router.get("/all", authorizeRoles("ADMIN") as any, getAllOrders); // GET /api/orders/all -> Admin view all orders
router.get("/:id", getOrderById); // GET /api/orders/:id -> View details of a specific order

export default router;
