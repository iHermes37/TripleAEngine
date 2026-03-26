import { EcommercePlatform } from "@/types/constant";
import { EcommerceService } from "@/types/platform";
import { AmazonClient } from "../platform/Ecommerce/amazon";
import { ProductInfo } from "@/types/product";


export class EcommerceManager implements EcommerceService {
    private services: Map<EcommercePlatform, EcommerceService>;
    private defaultPlatform: EcommercePlatform;

    constructor(defaultPlatform: EcommercePlatform = EcommercePlatform.Amazon) {
        this.services = new Map();
        this.defaultPlatform = defaultPlatform;
        this.registerPlatform(EcommercePlatform.Amazon, new AmazonClient());
    }

    registerPlatform(platform: EcommercePlatform, service: EcommerceService): void {
        this.services.set(platform, service);
        console.log(`Registered platform: ${platform}`);
    }

    getPlatformService(platform: EcommercePlatform): EcommerceService {
        const service = this.services.get(platform);
        if (!service) throw new Error(`Platform ${platform} not registered`);
        return service;
    }

    getPlatformName(): EcommercePlatform {
        return this.defaultPlatform;
    }

    // ── 单品接口（保持向后兼容）──────────────────────────────────────────────
    async getProductInfo(keywords: string, platform?: EcommercePlatform): Promise<ProductInfo> {
        const targetPlatform = platform || this.defaultPlatform;
        const service = this.getPlatformService(targetPlatform);
        try {
            console.log(`Using platform: ${targetPlatform}`);
            return await service.getProductInfo(keywords);
        } catch (error) {
            console.error(`Error fetching from ${targetPlatform}:`, error);
            throw error;
        }
    }

    // ── 新增：单平台列表接口，支持 maxPages ──────────────────────────────────
    async getProductList(
        keywords: string,
        platform?: EcommercePlatform,
        maxPages = 1
    ): Promise<ProductInfo[]> {
        const targetPlatform = platform || this.defaultPlatform;
        const service = this.getPlatformService(targetPlatform);
        try {
            console.log(`Using platform: ${targetPlatform}, maxPages: ${maxPages}`);
            // AmazonClient.getProductList 已支持 maxPages 参数
            return await (service as AmazonClient).getProductList(keywords, maxPages);
        } catch (error) {
            console.error(`Error fetching list from ${targetPlatform}:`, error);
            throw error;
        }
    }

    // ── 原有：多平台并行搜索（单条，保持兼容）───────────────────────────────
    async searchMultiplePlatforms(
        keywords: string,
        platforms?: EcommercePlatform[]
    ): Promise<Map<EcommercePlatform, ProductInfo>> {
        const targetPlatforms = platforms || Array.from(this.services.keys());
        const results = new Map<EcommercePlatform, ProductInfo>();

        const promises = targetPlatforms.map(async (platform) => {
            try {
                const service = this.getPlatformService(platform);
                const productInfo = await service.getProductInfo(keywords);
                results.set(platform, productInfo);
            } catch (error) {
                console.error(`Failed to fetch from ${platform}:`, error);
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    // ── 新增：多平台并行搜索列表，支持 maxPages ──────────────────────────────
    async searchMultiplePlatformsList(
        keywords: string,
        platforms?: EcommercePlatform[],
        maxPages = 1
    ): Promise<Map<EcommercePlatform, ProductInfo[]>> {
        const targetPlatforms = platforms || Array.from(this.services.keys());
        const results = new Map<EcommercePlatform, ProductInfo[]>();

        const promises = targetPlatforms.map(async (platform) => {
            try {
                const list = await this.getProductList(keywords, platform, maxPages);
                results.set(platform, list);
                console.log(`✅ ${platform}: fetched ${list.length} products`);
            } catch (error) {
                console.error(`Failed to fetch list from ${platform}:`, error);
                results.set(platform, []); // 失败时置空而非丢弃，前端可感知
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    // ── 批量搜索多个关键词（单条）────────────────────────────────────────────
    async searchBatch(
        keywords: string[],
        platform?: EcommercePlatform
    ): Promise<Map<string, ProductInfo>> {
        const results = new Map<string, ProductInfo>();

        const promises = keywords.map(async (keyword) => {
            try {
                const product = await this.getProductInfo(keyword, platform);
                results.set(keyword, product);
            } catch (error) {
                console.error(`Failed to search for "${keyword}":`, error);
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    // ── 新增：批量搜索多个关键词（列表）────────────────────────────────────
    async searchBatchList(
        keywords: string[],
        platform?: EcommercePlatform,
        maxPages = 1
    ): Promise<Map<string, ProductInfo[]>> {
        const results = new Map<string, ProductInfo[]>();

        const promises = keywords.map(async (keyword) => {
            try {
                const list = await this.getProductList(keyword, platform, maxPages);
                results.set(keyword, list);
            } catch (error) {
                console.error(`Failed to search list for "${keyword}":`, error);
                results.set(keyword, []);
            }
        });

        await Promise.allSettled(promises);
        return results;
    }

    setDefaultPlatform(platform: EcommercePlatform): void {
        if (!this.services.has(platform)) {
            throw new Error(`Platform ${platform} not registered`);
        }
        this.defaultPlatform = platform;
        console.log(`Default platform set to: ${platform}`);
    }

    getRegisteredPlatforms(): EcommercePlatform[] {
        return Array.from(this.services.keys());
    }

    addPlatform(platform: EcommercePlatform, service: EcommerceService): void {
        if (this.services.has(platform)) {
            console.warn(`Platform ${platform} already exists, overwriting...`);
        }
        this.registerPlatform(platform, service);
    }

    removePlatform(platform: EcommercePlatform): boolean {
        if (platform === this.defaultPlatform) {
            console.warn(`Cannot remove default platform ${platform}`);
            return false;
        }
        return this.services.delete(platform);
    }
}