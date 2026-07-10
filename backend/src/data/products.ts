export interface Product {
    id: number;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
    stock: number;
}

export const products: Product[] = [
    {
        id: 1,
        title: "Apple iPhone 15",
        price: 79999,
        description: "Latest Apple smartphone with A16 Bionic chip.",
        category: "Electronics",
        image: "https://example.com/images/iphone15.jpg",
        stock: 20,
    },
    {
        id: 2,
        title: "Samsung Galaxy S24",
        price: 74999,
        description: "Flagship Android smartphone with AMOLED display.",
        category: "Electronics",
        image: "https://example.com/images/galaxys24.jpg",
        stock: 15,
    },
    {
        id: 3,
        title: "Nike Air Max",
        price: 5999,
        description: "Comfortable running shoes.",
        category: "Footwear",
        image: "https://example.com/images/nike-airmax.jpg",
        stock: 50,
    },
    {
        id: 4,
        title: "Dell Inspiron 15",
        price: 64999,
        description: "15-inch laptop with Intel Core i5 processor.",
        category: "Laptops",
        image: "https://example.com/images/dell-inspiron.jpg",
        stock: 10,
    },
    {
        id: 5,
        title: "Sony WH-1000XM5",
        price: 24999,
        description: "Wireless noise-cancelling headphones.",
        category: "Accessories",
        image: "https://example.com/images/sony-headphones.jpg",
        stock: 25,
    },
];