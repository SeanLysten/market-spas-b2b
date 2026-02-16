import { relations } from "drizzle-orm/relations";
import { products, incomingStock, productVariants, variantOptions } from "./schema";

export const incomingStockRelations = relations(incomingStock, ({one}) => ({
	product: one(products, {
		fields: [incomingStock.productId],
		references: [products.id]
	}),
	productVariant: one(productVariants, {
		fields: [incomingStock.variantId],
		references: [productVariants.id]
	}),
}));

export const productsRelations = relations(products, ({many}) => ({
	incomingStocks: many(incomingStock),
}));

export const productVariantsRelations = relations(productVariants, ({many}) => ({
	incomingStocks: many(incomingStock),
	variantOptions: many(variantOptions),
}));

export const variantOptionsRelations = relations(variantOptions, ({one}) => ({
	productVariant: one(productVariants, {
		fields: [variantOptions.variantId],
		references: [productVariants.id]
	}),
}));