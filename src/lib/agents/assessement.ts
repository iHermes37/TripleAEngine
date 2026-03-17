import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatMessageHistory } from "@langchain/community/stores/message/in_memory";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";

const model = new ChatOpenAI({
    model: "deepseek-chat",
    temperature: 0.1,
    maxTokens: 2000,
    configuration: {
        baseURL: "https://api.deepseek.com/v1",
        apiKey: "sk-8c0f97033741425da1b4ce518b5401c3",
    },
    maxRetries: 3,
    timeout: 60000,
});

// 创建外贸分析提示词模板
const prompt = ChatPromptTemplate.fromMessages([
    ["system", `你是一个专业的外贸分析顾问，擅长从多个角度为企业和产品提供国际市场分析。
请根据用户输入的产品或外贸问题，从以下三个维度给出详细分析报告：

1. 市场分析（竞争对手）：
   - 目标市场规模和发展趋势
   - 主要竞争对手分析（价格、渠道、优势劣势）
   - 目标客户群体画像
   - 市场进入壁垒和机会

2. 自身实力评估：
   - 产品核心竞争力分析
   - 供应链和生产能力评估
   - 品牌影响力和营销能力
   - 团队专业度和经验评估
   - SWOT分析（优势、劣势、机会、威胁）

3. 投资回报比（财务分析）：
   - 初期投入成本估算（市场调研、认证、营销等）
   - 预期收益预测（3年）
   - 盈亏平衡点分析
   - ROI估算和建议

请用专业、客观的语言，给出具体的数字估算和 actionable 的建议。
报告格式要清晰，使用适当的标题和分段。`],
    ["placeholder", "{history}"],
    ["human", "请分析：{input}"],
]);

const chain = prompt.pipe(model).pipe(new StringOutputParser());

// 存储不同会话的历史记录
const messageHistories: Record<string, ChatMessageHistory> = {};

const withHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: async (sessionId: string) => {
        if (!messageHistories[sessionId]) {
            messageHistories[sessionId] = new ChatMessageHistory();
        }
        return messageHistories[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

// 外贸分析主函数
async function analyzeForeignTrade(
    query: string, 
    sessionId: string = "default-session"
): Promise<string> {
    try {
        console.log(`🔍 正在分析: "${query}"`);
        console.log("⏳ 生成报告中...\n");
        
        const response = await withHistory.invoke(
            { input: query },
            { configurable: { sessionId } }
        );
        
        return response;
    } catch (error) {
        console.error("分析过程出错:", error);
        throw error;
    }
}

// 获取历史分析记录
async function getAnalysisHistory(sessionId: string): Promise<void> {
    const history = messageHistories[sessionId];
    if (history) {
        const messages = await history.getMessages();
        console.log("\n📋 历史分析记录:");
        messages.forEach((msg, index) => {
            if (msg._getType() === 'human') {
                console.log(`用户 ${index}: ${msg.content}`);
            } else if (msg._getType() === 'ai') {
                const preview = typeof msg.content === 'string' 
                    ? msg.content.substring(0, 100) + '...'
                    : '分析报告';
                console.log(`分析 ${index}: ${preview}`);
            }
        });
    }
}

// 清空历史
async function clearHistory(sessionId: string): Promise<void> {
    const history = messageHistories[sessionId];
    if (history) {
        await history.clear();
        console.log(`✅ 已清空会话 ${sessionId} 的历史记录`);
    }
}

// 示例使用
async function main() {
    try {
        // 示例1：分析智能手表出口
        const report1 = await analyzeForeignTrade(
            "智能手表出口欧美市场",
            "session-smartwatch"
        );
        console.log("📊 智能手表分析报告:");
        console.log(report1);
        console.log("\n" + "=".repeat(80) + "\n");
        
        // 示例2：分析太阳能产品
        const report2 = await analyzeForeignTrade(
            "便携式太阳能充电板出口东南亚",
            "session-solar"
        );
        console.log("📊 太阳能产品分析报告:");
        console.log(report2);
        console.log("\n" + "=".repeat(80) + "\n");
        
        // 示例3：分析纺织品出口
        const report3 = await analyzeForeignTrade(
            "有机棉T恤出口欧盟市场，目标国家德国和法国",
            "session-textile"
        );
        console.log("📊 纺织品分析报告:");
        console.log(report3);
        
        // 查看分析历史
        console.log("\n📋 查看智能手表分析历史:");
        await getAnalysisHistory("session-smartwatch");
        
    } catch (error) {
        console.error("主程序错误:", error);
    }
}

// 如果只想运行单次分析
async function singleAnalysis() {
    const product = process.argv[2] || "智能家居产品出口日本市场";
    
    try {
        const report = await analyzeForeignTrade(product);
        console.log("📊 分析报告:");
        console.log(report);
    } catch (error) {
        console.error("分析失败:", error);
    }
}

// 导出函数供其他模块使用
export { analyzeForeignTrade, getAnalysisHistory, clearHistory };

// 运行主程序
if (require.main === module) {
    // 检查命令行参数
    if (process.argv.length > 2) {
        singleAnalysis();
    } else {
        main();
    }
}