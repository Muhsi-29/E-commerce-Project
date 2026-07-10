import "dotenv/config"; // 1. Load environment variables first
import prisma from "../src/db.js"; // 2. Import the configured prisma instance
import { products } from "../src/data/products.js";

async function main() {
    console.log("Start seeding products...");

    // Clean out any existing products to prevent duplicate errors
    await prisma.product.deleteMany();

    for (const product of products) {
        // Omit the manual 'id' so Postgres can assign autoincremented IDs
        const { id, ...productData } = product;

        const created = await prisma.product.create({
            data: productData,
        });
        console.log(`Created product: ${created.title} (ID: ${created.id})`);
    }

    console.log("Seeding complete!");
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
