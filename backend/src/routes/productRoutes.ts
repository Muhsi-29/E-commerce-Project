import { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, searchProduct } from "../controllers/productController.js";
import { Router } from "express";
import { authenticateUser, authorizeRoles } from "../middlewares/authMiddleware.js";
const router = Router();
// Public Routes

router.get("/", getAllProducts);
router.get("/search", searchProduct);
router.get("/:id", getProductById);

// Protected routes (Admin-only)
// Note: We cast authenticateUser as any to avoid Express version-specific handler parameter incompatibilities with custom request types.
router.post("/", authenticateUser as any, authorizeRoles("ADMIN") as any, createProduct);
router.put("/:id", authenticateUser as any, authorizeRoles("ADMIN") as any, updateProduct);
router.delete("/:id", authenticateUser as any, authorizeRoles("ADMIN") as any, deleteProduct);
export default router;