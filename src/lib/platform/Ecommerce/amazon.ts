// services/platform/Ecommerce/amazon.ts
import { EcommercePlatform } from "../../../types/constant";
import { EcommerceService } from "../../../types/platform";
import { ProductInfo } from "../../../types/product";
import { chromium, Browser, Page, BrowserContext } from 'playwright';

interface AmazonProductData {
    Product: string;
    ASIN: string;
    UUID: string | null;
    ImageURL: string | null;
    URL: string | null;
    Price: string;
    Rating: string;
    ScrapedAt: string;
}

export interface AmazonClientConfig {
    headless?: boolean;
    maxPages?: number;
    proxy?: string;
}

export class AmazonClient implements EcommerceService {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private config: Required<AmazonClientConfig>;

    constructor(config: AmazonClientConfig = {}) {
        this.config = {
            headless: config.headless ?? false,
            maxPages: config.maxPages ?? 1,
            proxy: config.proxy ?? '',
        };
    }

    /**
     * 获取平台名称 - 实现 EcommerceService 接口
     */
    getPlatformName(): EcommercePlatform {
        return EcommercePlatform.Amazon;
    }

    /**
     * 获取单个商品信息 - 实现 EcommerceService 接口
     * @param keywords 搜索关键词
     * @returns 商品信息
     */
    async getProductInfo(keywords: string): Promise<ProductInfo> {
        try {
            await this.startBrowser();
            
            // 只获取第一页的第一个商品
            const productDataList = await this.searchAndGetProducts(keywords, 1);
            
            if (productDataList.length === 0) {
                throw new Error('未找到任何商品');
            }
            
            // 返回第一个商品
            return this.convertToProductInfo(productDataList[0]);
            
        } catch (error) {
            console.error('Failed to get product info:', error);
            throw new Error(`Failed to get product info: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            if (this.browser) {
                await this.close();
            }
        }
    }

    /**
     * 获取商品列表（扩展方法）
     * @param keywords 搜索关键词
     * @param maxPages 最大页数
     * @returns 商品信息列表
     */
    async getProductList(keywords: string, maxPages: number = 1): Promise<ProductInfo[]> {
        try {
            await this.startBrowser();
            
            const productDataList = await this.searchAndGetProducts(keywords, maxPages);
            
            if (productDataList.length === 0) {
                throw new Error('未找到任何商品');
            }
            
            // 转换全部商品
            return productDataList.map(item => this.convertToProductInfo(item));
            
        } catch (error) {
            console.error('Failed to get product list:', error);
            throw new Error(`Failed to get product list: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            if (this.browser) {
                await this.close();
            }
        }
    }

    /**
     * 启动浏览器
     */
    private async startBrowser(): Promise<void> {
        console.log('🚀 启动浏览器...');

        const launchOptions: any = {
            headless: this.config.headless,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--no-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--start-maximized',
                '--disable-gpu',
                '--disable-software-rasterizer',
                '--disable-extensions',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-zygote',
                '--window-size=1920,1080',
            ],
        };

        if (this.config.proxy) {
            launchOptions.proxy = { server: this.config.proxy };
        }

        this.browser = await chromium.launch(launchOptions);

        this.context = await this.browser.newContext({
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            locale: 'en-SG',
            timezoneId: 'Asia/Singapore',
            extraHTTPHeaders: {
                'Accept-Language': 'en-SG,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
        });

        this.page = await this.context.newPage();

        // 注入反检测脚本
        await this.page.addInitScript(`
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-SG', 'en']
            });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'connection', {
                get: () => ({
                    effectiveType: '4g',
                    rtt: 50,
                    downlink: 10,
                    saveData: false,
                })
            });
        `);
    }

    /**
     * 随机延迟
     */
    private async randomDelay(min: number, max: number): Promise<void> {
        const delay = Math.random() * (max - min) + min;
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * 随机鼠标移动
     */
    private async randomMouseMove(): Promise<void> {
        if (!this.page) return;
        const viewport = this.page.viewportSize();
        if (!viewport) return;
        const x = Math.random() * viewport.width;
        const y = Math.random() * viewport.height;
        await this.page.mouse.move(x, y);
    }

    /**
     * 搜索并获取商品（支持多页）
     */
    private async searchAndGetProducts(keyword: string, maxPages: number = 1): Promise<AmazonProductData[]> {
        if (!this.page) {
            throw new Error('浏览器未启动');
        }

        console.log(`🔍 正在搜索: ${keyword}`);
        console.log(`📄 最大采集页数: ${maxPages}`);

        // 访问 Amazon
        const amazonUrl = 'https://www.amazon.sg/';
        await this.page.goto(amazonUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
        });

        await this.randomDelay(2000, 4000);
        await this.randomMouseMove();

        // 处理可能的验证页面
        const pageContent = await this.page.content();
        if (pageContent.includes('Continue shopping') ||
            pageContent.includes('captcha') ||
            pageContent.includes('Robot Check')) {
            console.log('🔐 检测到验证页面，等待手动处理...');
            await this.page.waitForSelector('input#twotabsearchtextbox', {
                timeout: 60000,
            });
            await this.randomDelay(2000, 3000);
        }

        // 等待搜索框并输入关键词
        let searchBoxFound = false;
        for (let i = 0; i < 3; i++) {
            const searchBoxById = await this.page.locator('input#twotabsearchtextbox').count();
            if (searchBoxById > 0) {
                searchBoxFound = true;
                break;
            }
            console.log(`⏳ 等待搜索框加载... (尝试 ${i + 1}/3)`);
            await this.randomDelay(2000, 3000);
        }

        if (!searchBoxFound) {
            throw new Error('未找到搜索框，可能被反爬拦截');
        }

        const searchBox = this.page.locator('input#twotabsearchtextbox').first();
        await searchBox.waitFor({ state: 'visible' });
        await searchBox.click();
        await this.randomDelay(200, 500);
        await searchBox.fill('');
        await this.randomDelay(100, 300);

        // 模拟人工输入
        for (const char of keyword) {
            await searchBox.type(char, { delay: Math.random() * 100 + 50 });
        }

        await this.randomDelay(500, 1500);

        // 提交搜索
        await searchBox.press('Enter');
        console.log('⏳ 等待搜索结果加载...');
        await this.page.waitForLoadState('domcontentloaded');
        await this.randomDelay(3000, 5000);

        // 检查是否成功进入搜索结果页
        const currentUrl = this.page.url();
        if (!currentUrl.includes('/s/') && !currentUrl.includes('search')) {
            console.log(`⚠️ 可能未进入搜索结果页，当前 URL: ${currentUrl}`);
        }

        // 采集多页数据
        const allProducts = await this.collectMultiplePages(maxPages);
        
        console.log(`✅ 共采集到 ${allProducts.length} 个商品`);
        return allProducts;
    }

    /**
     * 采集多页商品数据
     */
    private async collectMultiplePages(maxPages: number): Promise<AmazonProductData[]> {
        if (!this.page) {
            return [];
        }

        const allProducts: AmazonProductData[] = [];
        let currentPage = 1;

        while (currentPage <= maxPages) {
            console.log(`\n📄 正在采集第 ${currentPage} 页...`);
            
            // 采集当前页数据
            const pageProducts = await this.collectCurrentPageData();
            allProducts.push(...pageProducts);
            
            console.log(`✅ 第 ${currentPage} 页采集完成，获取 ${pageProducts.length} 个商品`);
            
            // 检查是否还有下一页
            if (currentPage >= maxPages) {
                console.log(`📊 已达到设置的最大页数 (${maxPages} 页)，停止采集`);
                break;
            }
            
            // 尝试翻页
            const hasNextPage = await this.goToNextPage();
            if (!hasNextPage) {
                console.log('📄 已到达最后一页，停止采集');
                break;
            }
            
            currentPage++;
            
            // 翻页后等待页面加载
            await this.randomDelay(3000, 5000);
        }
        
        return allProducts;
    }

    /**
     * 采集当前页的商品数据
     */
    private async collectCurrentPageData(): Promise<AmazonProductData[]> {
        if (!this.page) {
            return [];
        }

        const pageProducts: AmazonProductData[] = [];

        try {
            // 等待商品列表加载
            await this.page.waitForSelector('div[data-asin]', {
                timeout: 15000,
            });

            // 获取所有商品元素
            const items = await this.page.locator('div[data-asin]').all();
            
            console.log(`📦 当前页找到 ${items.length} 个商品元素`);

            for (const item of items) {
                try {
                    // 获取 ASIN
                    const asin = await item.getAttribute('data-asin');
                    if (!asin || asin === '' || asin === 'null') {
                        continue;
                    }

                    // 提取标题
                    let product = '';
                    const titleSelectors = [
                        'h2 span',
                        'h2.a-size-base-plus span',
                        '.a-size-base-plus.a-color-base.a-text-normal',
                        'a.a-link-normal span'
                    ];

                    for (const selector of titleSelectors) {
                        const element = item.locator(selector).first();
                        if (await element.count() > 0) {
                            const text = await element.innerText();
                            if (text && text.trim()) {
                                product = text.trim();
                                break;
                            }
                        }
                    }

                    // 如果没有标题，跳过该商品
                    if (!product || product === '') {
                        continue;
                    }

                    // 提取价格
                    let price = '暂无价格';
                    const priceElement = item.locator('span.a-price span.a-offscreen').first();
                    if (await priceElement.count() > 0) {
                        price = await priceElement.innerText();
                    } else {
                        const altPrice = item.locator('.a-price .a-offscreen').first();
                        if (await altPrice.count() > 0) {
                            price = await altPrice.innerText();
                        }
                    }

                    // 提取评分
                    let rating = '暂无评分';
                    const ratingElement = item.locator('span.a-icon-alt').first();
                    if (await ratingElement.count() > 0) {
                        rating = await ratingElement.innerText();
                    }

                    // 提取评分数量
                    let reviewCount = '';
                    const reviewElement = item.locator('span.a-size-base.s-underline-text, span.a-size-mini.puis-normal-weight-text').first();
                    if (await reviewElement.count() > 0) {
                        reviewCount = await reviewElement.innerText();
                    }

                    // 提取商品链接
                    let url = '';
                    const linkSelectors = [
                        'a.a-link-normal.s-line-clamp-2',
                        'a.a-link-normal.a-text-normal'
                    ];
                    for (const selector of linkSelectors) {
                        const linkElement = item.locator(selector).first();
                        if (await linkElement.count() > 0) {
                            const href = await linkElement.getAttribute('href');
                            if (href) {
                                url = href.startsWith('http') ? href : `https://www.amazon.sg${href}`;
                                break;
                            }
                        }
                    }

                    // 提取图片
                    let imageUrl = '';
                    const imgElement = item.locator('img.s-image').first();
                    if (await imgElement.count() > 0) {
                        imageUrl = (await imgElement.getAttribute('src')) || '';
                    }

                    const ratingText = rating + (reviewCount ? ` (${reviewCount})` : '');

                    pageProducts.push({
                        Product: product,
                        ASIN: asin,
                        UUID: null,
                        ImageURL: imageUrl,
                        URL: url,
                        Price: price,
                        Rating: ratingText,
                        ScrapedAt: new Date().toISOString(),
                    });

                    // 调试输出前3条
                    if (pageProducts.length <= 3) {
                        console.log(`   📍 示例 ${pageProducts.length}: ${product.substring(0, 40)}... | ${price} | ${asin}`);
                    }

                } catch (error) {
                    console.error('⚠️ 处理商品时出错:', error);
                    continue;
                }
            }

        } catch (error) {
            console.error('❌ 采集当前页数据时出错:', error);
        }

        return pageProducts;
    }

    /**
     * 翻到下一页
     */
    private async goToNextPage(): Promise<boolean> {
        if (!this.page) {
            return false;
        }

        try {
            const disabledSelector = 'span.s-pagination-next.s-pagination-disabled';
            const enabledSelector = 'a.s-pagination-next:not([aria-disabled="true"])';

            // 检查是否还有下一页
            const isDisabled = await this.page.locator(disabledSelector).count();
            if (isDisabled > 0) {
                console.log('📄 没有下一页了');
                return false;
            }

            const nextBtn = this.page.locator(enabledSelector);
            const nextBtnCount = await nextBtn.count();

            if (nextBtnCount === 0) {
                console.log('⚠️ 未找到下一页按钮');
                return false;
            }

            // 滚动到下一页按钮并点击
            await nextBtn.scrollIntoViewIfNeeded();
            await nextBtn.waitFor({ state: 'visible' });
            await nextBtn.click();

            // 等待页面加载
            await this.page.waitForLoadState('domcontentloaded');
            await this.randomDelay(2000, 3000);

            return true;
        } catch (error) {
            console.error('❌ 翻页失败:', error);
            return false;
        }
    }

    /**
     * 将 Amazon 数据转换为 ProductInfo 格式
     */
    private convertToProductInfo(amazonData: AmazonProductData): ProductInfo {
        // 解析价格字符串，提取数字部分
        let priceNumber = 0;
        if (amazonData.Price !== '暂无价格') {
            const priceMatch = amazonData.Price.match(/[\d,]+\.?\d*/);
            if (priceMatch) {
                priceNumber = parseFloat(priceMatch[0].replace(/,/g, ''));
            }
        }

        // 解析评分，提取销售数量
        let salesCount = 0;
        if (amazonData.Rating !== '暂无评分') {
            // 匹配括号内的数字，如 (3.8K) 或 (1234)
            const salesMatch = amazonData.Rating.match(/\(([\d,.]+)\s*K?\)/);
            if (salesMatch) {
                let num = parseFloat(salesMatch[1].replace(/,/g, ''));
                // 如果包含 K，表示千为单位
                if (salesMatch[0].includes('K')) {
                    num = num * 1000;
                }
                salesCount = Math.floor(num);
            }
        }

        return {
            name: amazonData.Product,
            price: priceNumber,
            description: amazonData.Product,
            image: amazonData.ImageURL || '',
            Sales: salesCount,
            comments: [],
        };
    }

    /**
     * 关闭浏览器
     */
    private async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            console.log('🔒 浏览器已关闭');
        }
    }
}