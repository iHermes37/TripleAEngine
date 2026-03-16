import Holidays from "date-holidays";
import cron from "node-cron";

export  interface CountryConfig {
    code: string;       // 国家代码，如 "US" "GB" "DE"
    name: string;       // 显示名称
}

export  interface UserHolidayConfig {
    userId: string;
    countries: CountryConfig[];   // 关注的国家列表
    daysAhead: number;            // 提前几天提醒
    notifyChannel: "email" | "slack" | "console";  // 通知渠道
}

export  interface UpcomingHoliday {
    country: string;
    countryCode: string;
    holidayName: string;
    date: Date;
    daysUntil: number;
}

// ==================== 节日查询 ====================

export function getUpcomingHolidays(config: UserHolidayConfig): UpcomingHoliday[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + config.daysAhead);

    const results: UpcomingHoliday[] = [];

    for (const country of config.countries) {
        try {
            const hd = new Holidays(country.code);

            // 跨年处理：检查今年和明年
            const years = [today.getFullYear(), today.getFullYear() + 1];

            for (const year of years) {
                const holidays = hd.getHolidays(year);

                for (const h of holidays) {
                    const holidayDate = new Date(h.date);
                    holidayDate.setHours(0, 0, 0, 0);

                    if (holidayDate >= today && holidayDate <= targetDate) {
                        const daysUntil = Math.round(
                            (holidayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                        );
                        results.push({
                            country: country.name,
                            countryCode: country.code,
                            holidayName: h.name,
                            date: holidayDate,
                            daysUntil,
                        });
                    }
                }
            }
        } catch (e) {
            console.error(`❌ 国家代码无效: ${country.code}`);
        }
    }

    // 按日期排序
    return results.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ==================== 通知发送 ====================

async function sendNotification(
    holidays: UpcomingHoliday[],
    config: UserHolidayConfig
): Promise<void> {
    if (holidays.length === 0) return;

    const lines = holidays.map(h => {
        const dayStr = h.daysUntil === 0 ? "【今天】"
                     : h.daysUntil === 1 ? "【明天】"
                     : `【${h.daysUntil}天后】`;
        const dateStr = h.date.toLocaleDateString("zh-CN");
        return `${dayStr} ${h.country} - ${h.holidayName}（${dateStr}）`;
    });

    const message = [
        `🎉 外贸节日提醒（提前${config.daysAhead}天）`,
        "─".repeat(40),
        ...lines,
        "─".repeat(40),
    ].join("\n");

    switch (config.notifyChannel) {
        case "console":
            console.log(message);
            break;
        case "email":
            await sendEmail(config.userId, "外贸节日提醒", message);
            break;
    }
}


// 邮件通知（接入你的邮件服务）
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
    // 接入 nodemailer 或其他邮件服务
    console.log(`📧 发送邮件到 ${to}:\n${body}`);
}


// ==================== 定时任务 ====================

export function startHolidayReminderService(configs: UserHolidayConfig[]): void {
    console.log("🚀 节日提醒服务已启动");
    // 每天早上 8:00 自动检查
    cron.schedule("0 8 * * *", async () => {
        console.log(`\n⏰ [${new Date().toLocaleString()}] 开始检查节日...`);

        for (const config of configs) {
            const upcoming = getUpcomingHolidays(config);
            await sendNotification(upcoming, config);
        }
    });
}


// ==================== 使用示例 ====================
const userConfigs: UserHolidayConfig[] = [
    {
        userId: "user_001",
        daysAhead: 3,                           // 提前3天提醒
        notifyChannel: "console",
        countries: [
            { code: "US", name: "美国" },
            { code: "GB", name: "英国" },
            { code: "DE", name: "德国" },
        ],
    },
    {
        userId: "user_002",
        daysAhead: 7,                           // 提前7天提醒
        notifyChannel: "email",
        countries: [
            { code: "FR", name: "法国" },
            { code: "JP", name: "日本" },
            { code: "AU", name: "澳大利亚" },
        ],
    },
];

// 启动服务（服务器运行后一直保持）
// startHolidayReminderService(userConfigs);

// // 也可以立即手动触发一次检查（测试用）
// const result = getUpcomingHolidays(userConfigs[0]);
// console.log(result);

console.log("Worker 进程启动");
startHolidayReminderService(userConfigs);

// 防止进程退出
process.on("SIGINT", () => {
    console.log("Worker 正常关闭");
    process.exit(0);
});