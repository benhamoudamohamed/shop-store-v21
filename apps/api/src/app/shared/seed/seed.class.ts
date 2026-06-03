import { Logger } from "@nestjs/common";
import { DeepPartial, EntityManager, EntityTarget, ObjectLiteral } from "typeorm";
import { faker } from '@faker-js/faker';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Moderator } from "../../moderator/entities/moderator.entity";
import { Category } from "../../category/entities/category.entity";
import { Product } from "../../product/entities/product.entity";
import { Image } from "../../image/entities/image.entity";
import { Coupon } from "../../coupon/entities/coupon.entity";
import { PurchaseStatus, UserRole } from "@youssef-brand/shared/shared-enums";
import { Purchase } from "../../purchase/entities/purchase.entity";
import { OrderItem } from "../../orderItem/entities/order-item.entity";

export class Seed {
    protected logger = new Logger('🌱 Seed Class 🌱')

    constructor(private entityManager: EntityManager) {  }

    async fakeIt(entity: unknown): Promise<void> {
        switch(entity) {
            case Moderator: 
            await this.addData(await this.addModerator(), Moderator)
                break

            case Category: 
            await this.addData(await this.addCategory(), Category)
                break

            case Product: 
            await this.addData(await this.addProduct(), Product)
                break

            case Coupon:     
            this.addData(await this.addCoupon(), Coupon)
            break
            
            case Purchase: 
            this.addData(await this.addPurchase(), Purchase)
            break
                 
            default:
                break
        }
    }

    // Moderator entity
    private addModerator(): Array<Partial<Moderator>> {
        this.logger.log(`👤 Seeding Users`);
        return Array.from({length: 10}).map<Partial<Moderator>>(()=> {
            // this.logger.log(`🚜 Processed ${i}/1000 records...`);
            return {
                fullName: `${faker.person.fullName()}`,
                email: `${faker.internet.email()}`,
                password: `${faker.internet.password()}`,
                userRole: UserRole.enum.MODERATOR,    
                isActivated: false,  
                verificationCode: '',
            };
        })
    }

    // Category entity
    private async addCategory(): Promise<Array<Partial<Category>>> {
        this.logger.log(`🗂️ Seeding Categories`);
        const existingCategoryNames = new Set(
            (await this.entityManager.find(Category, { select: ['name'] })).map((category) => category.name),
        );
        const usedCategoryNames = new Set<string>();

        return await Promise.all(
            Array.from({ length: 10 }).map<Promise<Partial<Category>>>(async () => {
                let name: string;
                do {
                    name = `${faker.commerce.productName()} ${faker.string.alphanumeric(4)}`;
                } while (existingCategoryNames.has(name) || usedCategoryNames.has(name));
                usedCategoryNames.add(name);

                const ext = this.getRandomImageExtension();
                const originalFilename = `${faker.string.alphanumeric(12)}_${faker.lorem.word()}.${ext}`;
                const thumbnailFilename = `thumb_${originalFilename}`;
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

                await this.createUploadFile(originalFilename, 1024);
                await this.createUploadFile(thumbnailFilename, 512);

                return {
                    name,
                    description: faker.commerce.productDescription(),
                    image: {
                        originalName: `Large_${originalFilename}`,
                        originalUrl: originalFilename,
                        thumbnailName: `Thumb_${originalFilename}`,
                        thumbnailUrl: thumbnailFilename,
                        mimeType
                    } as Image
                };
            })
        );
    }

    // Product entity
    private async addProduct(): Promise<Array<Partial<Product>>> {
        this.logger.log(`📦 Seeding Products`);

        const categories = await this.entityManager.find(Category);
        if (categories.length === 0) {
            this.logger.warn(`⚠️ No categories found, skipping product seeding.`);
            return [];
        }

        const existingProductCodes = new Set(
            (await this.entityManager.find(Product, { select: ['productCode'] })).map((p) => p.productCode),
        );
        const existingProductNames = new Set(
            (await this.entityManager.find(Product, { select: ['name'] })).map((p) => p.name),
        );
        const usedProductCodes = new Set<string>();
        const usedProductNames = new Set<string>();

        const products: Array<Partial<Product>> = [];

        for (const category of categories) {
            for (let i = 0; i < 10; i += 1) {
                let productCode: string;
                do {
                    productCode = faker.string.alphanumeric(6).toUpperCase();
                } while (existingProductCodes.has(productCode) || usedProductCodes.has(productCode));
                usedProductCodes.add(productCode);

                let name: string;
                do {
                    name = `${faker.commerce.productName()} ${faker.string.alphanumeric(3)}`;
                } while (existingProductNames.has(name) || usedProductNames.has(name));
                usedProductNames.add(name);

                const ext = this.getRandomImageExtension();
                const originalFilename = `${faker.string.alphanumeric(12)}_${faker.lorem.word()}.${ext}`;
                const thumbnailFilename = `thumb_${originalFilename}`;
                const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

                await this.createUploadFile(originalFilename, 1024);
                await this.createUploadFile(thumbnailFilename, 512);

                // --- Updated Constraints ---
                
                // 1. unitPrice max 200
                const unitPrice = Number(faker.commerce.price({ min: 5, max: 200, dec: 2 }));

                // 2. tvaRate as percentage, max 20%
                // Common Tunisian rates are 7, 13, 19, but we'll randomize up to 20
                const tvaRate = faker.number.int({ min: 5, max: 20 });

                // 3. stock max 250
                const stock = faker.number.int({ min: 0, max: 250 });

                products.push({
                    productCode,
                    name,
                    description: faker.commerce.productDescription(),
                    unitPrice,
                    tvaRate, // Matches our new Entity field name
                    stock,
                    // Note: totalHT and totalTTC are removed because they are Getters in the Entity
                    isFavorite: faker.datatype.boolean(),
                    isAvailable: faker.datatype.boolean(),
                    image: {
                        originalName: `Large_${originalFilename}`,
                        originalUrl: originalFilename,
                        thumbnailName: `Thumb_${originalFilename}`,
                        thumbnailUrl: thumbnailFilename,
                        mimeType
                    } as Image,
                    category
                });
            }
        }
        return products;
    }

    // Coupon entity
    private async addCoupon(): Promise<Partial<Coupon>[]> {
        this.logger.log(`🧧 Seeding Coupons`);
        
        const themes = ['WELCOME', 'SUMMER', 'RAMADAN', 'PROMO', 'SALE', 'FLASH'];
        const discountValues = [5, 10, 15, 20, 25, 50];
        const coupons: Partial<Coupon>[] = [];

        // Fetch all existing codes once to minimize DB hits during the loop
        const existingCoupons = await this.entityManager.find(Coupon, { select: ['code'] });
        const existingCodesSet = new Set(existingCoupons.map(c => c.code.toUpperCase()));
        const justGeneratedSet = new Set<string>();

        for (let i = 0; i < 10; i++) {
            let finalCode = '';
            let isUnique = false;

            // 1. Generate and Check for uniqueness
            while (!isUnique) {
                const theme = themes[Math.floor(Math.random() * themes.length)];
                const suffix = faker.string.alphanumeric(4).toUpperCase();
                const candidateCode = `${theme}-${suffix}`;

                if (!existingCodesSet.has(candidateCode) && !justGeneratedSet.has(candidateCode)) {
                    finalCode = candidateCode;
                    justGeneratedSet.add(candidateCode);
                    isUnique = true;
                }
            }

            const discount = discountValues[Math.floor(Math.random() * discountValues.length)];

            // 2. Build the object
            coupons.push({
                code: finalCode,
                discountPercentage: discount,
                maxUses: faker.number.int({ min: 10, max: 150 }),
                startDate: new Date(),
                expirationDate: faker.date.soon({ days: 90 }),
                isActive: true,
                isExpired: false,
            });
        }
        return coupons;
    }

    // Purchase entity
    private async addPurchase(): Promise<Array<Partial<Purchase>>> {
        this.logger.log(`💰 Seeding Purchases`);

        // 1. Fetch products and coupons to build dependencies
        const products = await this.entityManager.find(Product);
        const coupons = await this.entityManager.find(Coupon);

        if (products.length === 0) {
            this.logger.warn(`⚠️ No products found, skipping purchase seeding.`);
            return [];
        }

        const purchases: Array<Partial<Purchase>> = [];

        // Let's create 50 random purchases
        for (let p = 0; p < 50; p += 1) {
            // 1.Group status states to handle conditional stock reductions
            const allocatedStatuses: PurchaseStatus[] = [
                PurchaseStatus.enum.PENDING, 
                PurchaseStatus.enum.CONFIRMED, 
                PurchaseStatus.enum.SHIPPED, 
                PurchaseStatus.enum.DELIVERED
            ];

            // 2. Randomly assign a status to the purchase
            const status = faker.helpers.arrayElement(PurchaseStatus.options);
            const isAllocatedState = allocatedStatuses.includes(status);

            let totalHT = 0;
            let totalTax = 0;
            const orderItems: OrderItem[] = [];

            // 3. Randomly choose 1 to 4 distinct products for this order
            const totalDistinctProducts = faker.number.int({ min: 1, max: 4 });
            const randomProducts = faker.helpers.arrayElements(products, totalDistinctProducts);

            for (const product of randomProducts) {
                // Random quantity for this item
                const quantity = faker.number.int({ min: 1, max: 5 });

                // Only enforce stock and deduct if the generated status is an active state
                if (isAllocatedState) {
                    // Skip item or adjust if fake data runs completely dry
                    if (product.stock < quantity) continue; 
                    
                    product.stock -= quantity;
                    await this.entityManager.save(Product, product);
                }

                const currentPrice = Number(product.unitPrice);
                const currentTvaRate = Number(product.tvaRate); 
                
                const itemTotalHT = Number((currentPrice * quantity).toFixed(2));
                const itemTvaAmount = Number(((itemTotalHT * currentTvaRate) / 100).toFixed(2));
                const itemTotalTTC = Number((itemTotalHT + itemTvaAmount).toFixed(2));

                totalHT += itemTotalHT;
                totalTax += itemTvaAmount;

                // 🛒 Create the relational OrderItem entity instanced inside the loop
                const orderItem = this.entityManager.create(OrderItem, {
                    product,
                    quantity,
                    unitpriceAtPurchase: currentPrice,
                    tvaRate: currentTvaRate,
                    tvaAmount: itemTvaAmount,
                    totalHT: itemTotalHT,
                    totalTTC: itemTotalTTC,
                });

                orderItems.push(orderItem);
            }

            // Skip completely empty orders if all items failed stock checks
            if (orderItems.length === 0) continue;

            // 4. Optionally roll for an associated Coupon (30% chance if coupons exist)
            let discount = 0;
            let couponEntity: Coupon | null = null;
            let couponCode: string | null = null;

            if (coupons.length > 0 && faker.datatype.boolean({ probability: 0.3 })) {
                couponEntity = faker.helpers.arrayElement(coupons);
                couponCode = couponEntity.code;

                discount = Number((totalHT * (Number(couponEntity.discountPercentage) / 100)).toFixed(2));

                // Only increment coupon usage count metrics if the order is an active state
                if (isAllocatedState) {
                    couponEntity.usedCount += 1;
                    if (couponEntity.usedCount >= couponEntity.maxUses) {
                        couponEntity.isExpired = true;
                    }
                    await this.entityManager.save(Coupon, couponEntity);
                }
            }

            // 5. Build calculations using your exact financial formulas
            const grandTotal = Number((totalHT + totalTax - discount).toFixed(2));

            // 6. Push data array matching entity specs
            purchases.push({
                clientName: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                phone: faker.phone.number(),
                address: faker.location.streetAddress({ useFullAddress: true }),
                subtotal: totalHT,
                totalTax: Number(totalTax.toFixed(2)),
                discount,
                grandTotal,
                orderItems,
                couponCode: couponCode ?? undefined,
                status,
                coupon: couponEntity ?? undefined,
                createdAt: faker.date.past({ years: 1 }) // Spreads entries out historically 
            });
        }
        return purchases;
    }

    // helper method to get random image extension
    private getRandomImageExtension(): 'jpg' | 'jpeg' | 'png' {
        return faker.helpers.arrayElement(['jpg', 'jpeg', 'png'] as const);
    }
    // helper method to create dummy upload files
    private async createUploadFile(filename: string, size = 1024): Promise<void> {
        const uploadDir = join(process.cwd(), 'upload');
        await fs.mkdir(uploadDir, { recursive: true });
        const filepath = join(uploadDir, filename);
        await fs.writeFile(filepath, Buffer.alloc(size) as Uint8Array);
    }

    // addData method 
    private async addData<T extends ObjectLiteral>(
        data: DeepPartial<T>[],
        entity: EntityTarget<T>,
        callback?: (savedData: T[]) => void,
        ): Promise<void> {
        try {
            // TypeORM's save returns the full entity (T[]), not just Partial<T>
            const savedData = await this.entityManager.save(entity, data);
            if (callback) {
            callback(savedData);
            }
            this.logger.log(`🌳 Seeding successfully`);
        } catch (error) {
            this.logger.log(`🟥 Seeding error with ${error}`);
            throw error; // Re-throw if you want the seed process to halt on failure
        }
    }
}