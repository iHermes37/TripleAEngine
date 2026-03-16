import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

async function testProxy() {
  const proxyUrl = 'http://127.0.0.1:7890'; // 改成你的代理端口
  
  try {
    // 测试1：直接连接
    console.log('测试直接连接...');
    try {
      const directResult = await axios.get('https://www.reddit.com', { timeout: 5000 });
      console.log('✅ 直接连接成功，不需要代理');
    } catch (e) {
      console.log('❌ 直接连接失败，需要代理');
    }
    
    // 测试2：使用代理
    console.log('\n测试代理连接...');
    const httpsAgent = new HttpsProxyAgent(proxyUrl);
    const proxyResult = await axios.get('https://www.reddit.com', {
      httpsAgent,
      proxy: false,
      timeout: 10000
    });
    
    console.log(`✅ 代理连接成功! 状态码: ${proxyResult.status}`);
    console.log(`代理配置: ${proxyUrl}`);
    
  } catch (error: any) {
    console.error('❌ 代理测试失败:', error.message);
    console.log('请检查:');
    console.log('1. 代理软件是否开启');
    console.log('2. 代理端口是否正确 (Clash: 7890, v2ray: 10809, SS: 1080)');
    console.log('3. 代理是否支持 HTTPS');
  }
}

testProxy();