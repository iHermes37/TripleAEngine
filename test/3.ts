// test-simple.ts
import fetch from 'node-fetch';
import * as fs from 'fs';

async function simpleSearch() {
    console.log('开始简单测试...\n');
    
    // 使用备用的 Photon API（更稳定）
    const url = 'https://photon.komoot.io/api/?q=pet+supply+usa&limit=5';
    
    console.log('请求URL:', url);
    
    try {
        // 添加超时控制
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000); // 5秒超时
        
        const response = await fetch(url, {
            headers: { 
                'User-Agent': 'TestApp/1.0',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.log('请求失败:', response.status);
            return;
        }
        
        const data = await response.json() as any;
        const features = data.features || [];
        
        console.log(`找到 ${features.length} 条结果\n`);
        
        // 显示结果
        features.forEach((item: any, index: number) => {
            const props = item.properties || {};
            console.log(`${index + 1}. ${props.name || 'Unknown'}`);
            console.log(`   地址: ${props.street || ''}, ${props.city || ''}, ${props.state || ''}`);
            console.log(`   类型: ${props.osm_value || props.osm_key || 'N/A'}`);
            console.log('---');
        });
        
        console.log('✅ 测试完成');
        
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.log('❌ 请求超时，请检查网络连接');
        } else {
            console.log('❌ 错误:', error.message);
        }
    }
}

simpleSearch();