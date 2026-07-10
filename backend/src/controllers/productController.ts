import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";
import { products, type Product } from "../data/products.js";
import prisma from "../db.js";

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany();
        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return res.status(404).json({
                status: "error",
                message: 'Product not found'
            })
        }
        res.status(200).json({
            status: 'success',
            data: product
        })
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
}

export const createProduct = async (req: Request, res: Response) => {
    try {
        // console.log("Headers:", req.headers);
        console.log("Received body:", req.body);
        const id = Number(products.length);
        const { title, price, description, category, image, stock } = req.body || {};
        if (!title || !price || !description || !category || !image || !stock) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            })
        }
        const newProduct = await prisma.product.create({
            data: {
                title,
                price: Number(price),
                description,
                category,
                image,
                stock: Number(stock)
            }
        });
        res.status(201).json({
            status: 'success',
            data: newProduct
        })
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }

}

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        // Check if product exists first
        const productExists = await prisma.product.findUnique({ where: { id } });
        if (!productExists) {
            return res.status(404).json({
                status: "error",
                message: 'Product not found'
            });
        }

        // Prepare updated data types
        const { title, price, description, category, image, stock } = req.body;
        const data: Prisma.ProductUpdateInput = {};
        if (title !== undefined) data.title = title;
        if (price !== undefined) data.price = Number(price);
        if (description !== undefined) data.description = description;
        if (category !== undefined) data.category = category;
        if (image !== undefined) data.image = image;
        if (stock !== undefined) data.stock = Number(stock);

        const updatedProduct = await prisma.product.update({
            where: { id },
            data
        });

        res.status(200).json({
            status: 'success',
            data: updatedProduct
        });
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};


export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);
        const index = await prisma.product.findUnique({ where: { id } });
        if (!index) {
            return res.status(404).json({
                status: "error",
                message: 'Product not found'
            })
        }
        await prisma.product.delete({ where: { id } });
        res.status(200).json({
            status: 'success',
            message: 'Product deleted successfully'
        })
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

export const searchProduct = async (req: Request, res: Response) => {
    try {
        const { category, minPrice, maxPrice, q } = req.query;

        // Construct Prisma's dynamic 'where' conditions
        const whereClause: any = {};

        if (category) {
            whereClause.category = {
                equals: String(category),
                mode: 'insensitive' // case-insensitive search
            };
        }

        if (minPrice || maxPrice) {
            whereClause.price = {};
            if (minPrice) whereClause.price.gte = Number(minPrice);
            if (maxPrice) whereClause.price.lte = Number(maxPrice);
        }

        if (q) {
            whereClause.OR = [
                { title: { contains: String(q), mode: 'insensitive' } },
                { description: { contains: String(q), mode: 'insensitive' } }
            ];
        }

        const filteredProducts = await prisma.product.findMany({
            where: whereClause
        });

        res.status(200).json({
            status: 'success',
            results: filteredProducts.length,
            data: filteredProducts
        });
    } catch (error) {
        console.error("Error searching products:", error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
