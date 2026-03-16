import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface BuyerInfo {
    title: string;
    url: string;
    quantity: string;
    country: string;
    countryCode: string;
    description: string;
    buyerName: string;
    buyerInitial: string;
    datePosted: string;
    quotesReceived: number;
    isVerified: {
        email: boolean;
        phone: boolean;
    };
}

class TradewheelScraper {
    private context: BrowserContext | null = null;
    private page: Page | null = null;
    private userDataDir: string;

    constructor(userDataDir: string = './playwright-data') {
        this.userDataDir = path.resolve(userDataDir);
    }

    // 等待用户输入
    private async waitForUserInput(prompt: string): Promise<void> {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise((resolve) => {
            rl.question(prompt, () => {
                rl.close();
                resolve();
            });
        });
    }

    async initialize() {
        console.log('🚀 初始化浏览器...');
        
        // 确保用户数据目录存在
        if (!fs.existsSync(this.userDataDir)) {
            fs.mkdirSync(this.userDataDir, { recursive: true });
            console.log(`📁 创建用户数据目录: ${this.userDataDir}`);
        }

        // 使用持久化用户数据目录启动浏览器（非无头模式）
        this.context = await chromium.launchPersistentContext(this.userDataDir, {
            headless: false, // 必须为非无头模式，以便手动验证
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            args: [
                '--disable-blink-features=AutomationControlled',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ]
        });
        
        // 获取页面
        const pages = this.context.pages();
        this.page = pages.length > 0 ? pages[0] : await this.context.newPage();
        
        // 添加脚本避免检测
        await this.page.addInitScript(() => {
            // 覆盖 navigator.webdriver
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
            
            // 添加 chrome 属性
            // @ts-ignore
            window.chrome = {
                runtime: {}
            };
        });

        console.log('✅ 浏览器初始化完成');
    }

    async handleManualVerification() {
        if (!this.page) throw new Error('页面未初始化');

        console.log('\n🌐 正在访问 Tradewheel...');
        
        try {
            // 访问页面
            await this.page.goto('https://www.tradewheel.com/buyers/', {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });

            // 检查是否遇到验证页面
            const pageTitle = await this.page.title();
            const pageContent = await this.page.content();
            const currentUrl = this.page.url();

            console.log(`📄 当前页面标题: ${pageTitle}`);
            console.log(`🔗 当前URL: ${currentUrl}`);

            // 检测是否在验证页面
            const isVerificationPage = 
                pageContent.includes('安全验证') || 
                pageContent.includes('Cloudflare') || 
                pageContent.includes('cf-browser-verification') ||
                pageContent.includes('请启用JavaScript') ||
                currentUrl.includes('challenge') ||
                currentUrl.includes('captcha');

            if (isVerificationPage) {
                console.log('\n⚠️ ========================================');
                console.log('⚠️ 检测到 Cloudflare 安全验证页面');
                console.log('⚠️ ========================================');
                console.log('\n📝 请按照以下步骤操作:');
                console.log('1. 在打开的浏览器窗口中，手动完成验证');
                console.log('2. 可能需要点击"我不是机器人"或完成图片验证');
                console.log('3. 验证通过后，页面会自动跳转到 Tradewheel');
                console.log('4. 等待页面完全加载完成');
                console.log('\n⏳ 等待手动验证完成（最长5分钟）...');

                // 等待验证通过（URL变化或特定元素出现）
                let verified = false;
                const startTime = Date.now();
                const timeout = 5 * 60 * 1000; // 5分钟

                while (!verified && (Date.now() - startTime) < timeout) {
                    const currentUrl = this.page.url();
                    const content = await this.page.content();
                    
                    // 检查是否已通过验证（不再包含验证关键词，且出现了买家列表元素）
                    if (!currentUrl.includes('challenge') && 
                        !currentUrl.includes('captcha') &&
                        !content.includes('cf-browser-verification') &&
                        (content.includes('related-bo') || content.includes('buyer-list'))) {
                        verified = true;
                        break;
                    }
                    
                    await this.page.waitForTimeout(2000); // 每2秒检查一次
                }

                if (verified) {
                    console.log('✅ 验证通过！继续采集...');
                    
                    // 额外等待页面完全加载
                    await this.page.waitForTimeout(3000);
                    
                    // 等待买家列表加载
                    await this.page.waitForSelector('.related-bo', { 
                        timeout: 10000,
                        state: 'attached'
                    }).catch(() => {
                        console.log('⚠️ 未找到买家列表元素，但继续尝试...');
                    });
                    
                } else {
                    throw new Error('⏰ 验证超时，请在5分钟内完成验证');
                }
            } else {
                console.log('✅ 无需验证，直接进入页面');
                
                // 等待买家列表加载
                await this.page.waitForSelector('.related-bo', { 
                    timeout: 10000,
                    state: 'attached'
                }).catch(() => {
                    console.log('⚠️ 未找到买家列表元素，但继续尝试...');
                });
            }

            // 等待页面稳定
            await this.page.waitForTimeout(2000);
            
            console.log('✅ 页面准备就绪');
            
        } catch (error) {
            console.error('❌ 页面加载失败:', error);
            throw error;
        }
    }

    async scrapeCurrentPage(): Promise<BuyerInfo[]> {
        if (!this.page) throw new Error('页面未初始化');

        console.log('📊 开始提取买家信息...');

        try {
            const buyers = await this.page.evaluate(() => {
                const items: any[] = [];
                
                // 查找所有买家卡片
                const buyerCards = document.querySelectorAll('.related-bo');
                console.log(`找到 ${buyerCards.length} 个买家卡片`);
                
                buyerCards.forEach((element) => {
                    try {
                        // 买家标题和链接
                        const titleElement = element.querySelector('h3 a');
                        const title = titleElement?.textContent?.trim() || '';
                        const url = titleElement?.getAttribute('href') || '';
                        
                        // 数量信息
                        const quantityElement = element.querySelector('.span-quantity strong');
                        const quantity = quantityElement?.textContent?.trim() || 'To be Finalized';
                        
                        // 国家和国旗
                        const countryElement = element.querySelector('.country-name-wrapper');
                        const country = countryElement?.textContent?.trim() || '';
                        
                        const flagElement = element.querySelector('[class^="country-flag"]');
                        let countryCode = '';
                        if (flagElement) {
                            const classes = flagElement.className.split(' ');
                            const flagClass = classes.find(c => c.startsWith('country-flag') && c !== 'country-flag');
                            countryCode = flagClass ? flagClass.replace('country-flag', '') : '';
                        }
                        
                        // 描述
                        const descElement = element.querySelector('.bdesc');
                        const description = descElement?.textContent?.trim() || '';
                        
                        // 买家信息
                        const buyerNameElement = element.querySelector('.verification-name-wrapper strong');
                        const buyerName = buyerNameElement?.textContent?.trim() || '';
                        
                        const buyerInitialElement = element.querySelector('.verification-name-wrapper span');
                        const buyerInitial = buyerInitialElement?.textContent?.trim() || '';
                        
                        // 验证状态
                        const verifiedElements = element.querySelectorAll('.verification-email-wrapper h4');
                        const isVerified = {
                            email: false,
                            phone: false
                        };
                        
                        verifiedElements.forEach((el) => {
                            const text = el.textContent || '';
                            if (text.includes('E-mail')) isVerified.email = true;
                            if (text.includes('Phone')) isVerified.phone = true;
                        });
                        
                        // 发布日期
                        const dateElement = element.querySelector('.rbo-specs span:last-child');
                        let datePosted = '';
                        if (dateElement && dateElement.nextSibling) {
                            datePosted = dateElement.nextSibling.textContent?.trim() || '';
                        }
                        
                        // 报价数量
                        const quotesElement = element.querySelector('.quotes-count');
                        let quotesReceived = 0;
                        if (quotesElement) {
                            const match = quotesElement.textContent?.match(/(\d+)/);
                            if (match) quotesReceived = parseInt(match[1]);
                        }
                        
                        if (title) {
                            items.push({
                                title,
                                url: url.startsWith('http') ? url : `https://www.tradewheel.com${url}`,
                                quantity,
                                country,
                                countryCode,
                                description,
                                buyerName,
                                buyerInitial,
                                datePosted,
                                quotesReceived,
                                isVerified
                            });
                        }
                    } catch (error) {
                        console.error('解析单个买家出错:', error);
                    }
                });
                
                return items;
            });

            console.log(`✅ 本页提取到 ${buyers.length} 个买家`);
            return buyers;

        } catch (error) {
            console.error('❌ 提取数据失败:', error);
            return [];
        }
    }

    async scrapeMultiplePages(maxPages: number = 3): Promise<BuyerInfo[]> {
        if (!this.page) throw new Error('页面未初始化');
        
        const allBuyers: BuyerInfo[] = [];
        const baseUrl = 'https://www.tradewheel.com/buyers/';
        
        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
            console.log(`\n📄 正在采集第 ${pageNum} 页...`);
            
            const url = pageNum === 1 ? baseUrl : `${baseUrl}?page=${pageNum}`;
            
            try {
                if (pageNum > 1) {
                    await this.page.goto(url, {
                        waitUntil: 'networkidle',
                        timeout: 30000
                    });
                    await this.page.waitForTimeout(2000);
                }
                
                const buyers = await this.scrapeCurrentPage();
                allBuyers.push(...buyers);
                
                if (buyers.length === 0) {
                    console.log('⚠️ 本页无数据，停止采集');
                    break;
                }
                
                // 随机延迟，避免请求过快
                if (pageNum < maxPages) {
                    const delay = Math.floor(Math.random() * 3000) + 2000;
                    console.log(`⏳ 等待 ${Math.round(delay/1000)} 秒后继续...`);
                    await this.page.waitForTimeout(delay);
                }
                
            } catch (error) {
                console.error(`❌ 第 ${pageNum} 页采集失败:`, error);
                break;
            }
        }
        
        return allBuyers;
    }

    async searchByKeyword(keyword: string): Promise<BuyerInfo[]> {
        if (!this.page) throw new Error('页面未初始化');
        
        console.log(`\n🔍 搜索关键词: ${keyword}`);
        
        try {
            const searchUrl = `https://www.tradewheel.com/buyers/?search=${encodeURIComponent(keyword)}`;
            await this.page.goto(searchUrl, {
                waitUntil: 'networkidle',
                timeout: 30000
            });
            
            await this.page.waitForTimeout(2000);
            return await this.scrapeCurrentPage();
            
        } catch (error) {
            console.error(`❌ 搜索失败:`, error);
            return [];
        }
    }

    async getTrendingSearches(): Promise<string[]> {
        if (!this.page) throw new Error('页面未初始化');
        
        try {
            const trends = await this.page.evaluate(() => {
                const items: string[] = [];
                document.querySelectorAll('.trending-prods a span').forEach((el) => {
                    items.push(el.textContent?.trim() || '');
                });
                return items;
            });
            
            console.log('🔥 热门搜索:', trends);
            return trends;
            
        } catch (error) {
            console.error('❌ 获取热门搜索失败:', error);
            return [];
        }
    }

    async exportToCSV(buyers: BuyerInfo[], filename: string = 'buyers.csv') {
        if (buyers.length === 0) {
            console.log('⚠️ 没有数据可导出');
            return;
        }
        
        // CSV头
        const headers = ['标题', '数量', '国家', '买家名称', '发布日期', '报价数', '邮箱验证', '电话验证', '描述', 'URL'];
        
        // 转换为CSV行
        const rows = buyers.map(b => [
            `"${b.title.replace(/"/g, '""')}"`,
            `"${b.quantity.replace(/"/g, '""')}"`,
            `"${b.country.replace(/"/g, '""')}"`,
            `"${b.buyerName.replace(/"/g, '""')}"`,
            b.datePosted,
            b.quotesReceived,
            b.isVerified.email ? '是' : '否',
            b.isVerified.phone ? '是' : '否',
            `"${b.description.replace(/"/g, '""').substring(0, 100)}..."`,
            b.url
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        fs.writeFileSync(filename, '\uFEFF' + csvContent); // 添加BOM支持中文
        console.log(`💾 数据已保存到 ${filename}，共 ${buyers.length} 条记录`);
    }

    async close() {
        if (this.context) {
            await this.context.close();
            console.log('👋 浏览器已关闭');
        }
    }
}

// 主函数
async function main() {
    console.log('=== Tradewheel 买家信息采集工具 ===\n');
    
    const scraper = new TradewheelScraper();
    
    try {
        // 初始化浏览器
        await scraper.initialize();
        
        // 处理手动验证
        await scraper.handleManualVerification();
        
        // 获取热门搜索
        console.log('\n=== 热门搜索关键词 ===');
        await scraper.getTrendingSearches();
        
        // 询问用户操作
        console.log('\n=== 请选择操作 ===');
        console.log('1. 采集多页买家信息（默认3页）');
        console.log('2. 按关键词搜索');
        console.log('3. 两者都执行');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
            rl.question('请输入选项 (1/2/3): ', (ans) => {
                resolve(ans);
                rl.close();
            });
        });

        let allBuyers: BuyerInfo[] = [];

        if (answer === '1' || answer === '3') {
            // 采集多页
            console.log('\n=== 开始采集多页买家信息 ===');
            const pageCount = 3; // 可以修改要采集的页数
            const buyers = await scraper.scrapeMultiplePages(pageCount);
            allBuyers = [...allBuyers, ...buyers];
            
            // 保存到CSV
            const dateStr = new Date().toISOString().slice(0, 10);
            await scraper.exportToCSV(buyers, `tradewheel_buyers_${dateStr}.csv`);
        }

        if (answer === '2' || answer === '3') {
            // 按关键词搜索
            console.log('\n=== 关键词搜索 ===');
            
            const searchRl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const keyword = await new Promise<string>((resolve) => {
                searchRl.question('请输入搜索关键词 (如: shoes): ', (ans) => {
                    resolve(ans || 'shoes');
                    searchRl.close();
                });
            });

            const searchBuyers = await scraper.searchByKeyword(keyword);
            allBuyers = [...allBuyers, ...searchBuyers];
            
            if (searchBuyers.length > 0) {
                const dateStr = new Date().toISOString().slice(0, 10);
                await scraper.exportToCSV(searchBuyers, `${keyword}_buyers_${dateStr}.csv`);
            }
        }

        // 显示统计信息
        if (allBuyers.length > 0) {
            console.log('\n=== 采集统计 ===');
            console.log(`总采集数: ${allBuyers.length}`);
            
            const verifiedCount = allBuyers.filter(b => b.isVerified.email && b.isVerified.phone).length;
            console.log(`完全验证的买家: ${verifiedCount} (${((verifiedCount/allBuyers.length)*100).toFixed(1)}%)`);
            
            // 按国家统计
            const countryStats = allBuyers.reduce((acc, b) => {
                if (b.country) {
                    acc[b.country] = (acc[b.country] || 0) + 1;
                }
                return acc;
            }, {} as Record<string, number>);
            
            console.log('\n买家来源国家 Top 5:');
            Object.entries(countryStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .forEach(([country, count]) => {
                    console.log(`  ${country}: ${count}个 (${((count/allBuyers.length)*100).toFixed(1)}%)`);
                });
        }

        console.log('\n✅ 所有任务完成！');
        
    } catch (error) {
        console.error('\n❌ 程序执行出错:', error);
    } finally {
        await scraper.close();
    }
}

// 运行主程序
if (require.main === module) {
    main().catch(console.error);
}

export { TradewheelScraper, type BuyerInfo };