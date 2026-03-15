// 对应 test/1.py

import * as net from "net";

function test_tun_mode(): boolean {
  return new Promise<boolean>((resolve) => {
    const sock = net.createConnection({ host: "www.googleapis.com", port: 443 });
    sock.setTimeout(10000);

    sock.on("connect", () => {
      console.log("✅ TUN模式生效！Node socket直接连接成功");
      sock.destroy();
      resolve(true);
    });

    sock.on("error", (e) => {
      console.log(`❌ TUN模式可能未生效: ${e}`);
      resolve(false);
    });

    sock.on("timeout", () => {
      console.log(`❌ TUN模式可能未生效: 连接超时`);
      sock.destroy();
      resolve(false);
    });
  }) as unknown as boolean;
}

test_tun_mode();
