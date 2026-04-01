import * as lark from '@larksuiteoapi/node-sdk';

// 单例模式，避免重复初始化
let client: lark.Client | null = null;

export function getFeishuClient() {
    if (!client) {
        const APP_ID = process.env.FEISHU_APP_ID;
        const APP_SECRET = process.env.FEISHU_APP_SECRET;
        
        if (!APP_ID || !APP_SECRET) {
            throw new Error('Missing FEISHU_APP_ID or FEISHU_APP_SECRET in environment');
        }
        
        client = new lark.Client({
            appId: APP_ID,
            appSecret: APP_SECRET,
        });
        
        console.log('✅ 飞书客户端初始化成功');
    }
    return client;
}