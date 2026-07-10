import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import { products, type Product } from "./data/products.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
dotenv.config();

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        status: 'success',
        message: "Server is Running"
    })
});
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/products", productRoutes);

// app.get("/products", (req, res) => {
//     res.status(200).json({
//         status: 'success',
//         data: products
//     })
// });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});