// 极简版本，仅测试连接
import * as lark from "@larksuiteoapi/node-sdk";

const APP_ID = "cli_a932b49f03799cb0";
const APP_SECRET = "oIegoRyxaArYmiXxWeMZshRwdkypqy6v";

const client = new lark.Client({
    appId: APP_ID,
    appSecret: APP_SECRET,
});

async function test() {
    try {
        const resp = await client.im.message.create({
            params: {
                receive_id_type: "open_id"
            },
            data: {
                receive_id: "ou_6b2752fe60992445ae054f3231df1b18", // 需要替换为实际的 open_id
                msg_type: "text",
                content: JSON.stringify({ text: "test" })
            }
        });
        console.log("发送成功:", resp);
    } catch (error) {
        console.error("发送失败:", error);
    }
}

test();