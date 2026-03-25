
export enum MediaPlatform {
  YouTube,      // 0
  TikTok,       // 1
  XiaoHongShu,  // 2
  Instagram,    // 3
}


export enum EcommercePlatform {
  // ========== 国内主流平台 ==========
  Taobao,           // 0 - 淘宝，国内最大C2C平台
  Tmall,            // 1 - 天猫，国内B2C头部平台
  JD,               // 2 - 京东，自营+3C家电优势
  Pinduoduo,        // 3 - 拼多多，社交拼团模式
  Douyin,           // 4 - 抖音电商，直播带货头部
  Kuaishou,         // 5 - 快手电商，下沉市场直播
  XiaoHongShu,      // 6 - 小红书，内容种草+电商
  Vipshop,          // 7 - 唯品会，品牌特卖
  Suning,           // 8 - 苏宁易购，家电3C
  Dewu,             // 9 - 得物，潮流单品鉴定交易
  Bilibili,         // 10 - B站电商，年轻用户内容变现
  WeChatMiniProgram,// 11 - 微信小程序电商，私域运营
  Meituan,          // 12 - 美团，本地生活+即时零售

  // ========== 国际/跨境主流平台 ==========
  Amazon,           // 13 - 亚马逊，全球最大电商平台
  eBay,             // 14 - eBay，老牌C2C拍卖平台
  AliExpress,       // 15 - 速卖通，阿里旗下跨境B2C
  Walmart,          // 16 - 沃尔玛，美国第二大电商
  Target,           // 17 - Target，美国零售巨头
  BestBuy,          // 18 - 百思买，北美3C垂直平台
  Wayfair,          // 19 - Wayfair，北美家居垂直平台
  Etsy,             // 20 - Etsy，手工艺品垂直平台
  Rakuten,          // 21 - 乐天，日本最大电商平台
  Coupang,          // 22 - 酷澎，韩国最大电商平台
  MercadoLibre,     // 23 - 美客多，拉美最大电商平台
  Allegro,          // 24 - Allegro，波兰及中东欧最大平台
  Zalando,          // 25 - Zalando，欧洲时尚垂直平台
  Otto,             // 26 - Otto，德国第二大电商
  CDiscount,        // 27 - Cdiscount，法国第二大电商
  ManoMano,         // 28 - ManoMano，欧洲DIY/园艺垂直平台
  RealDe,           // 29 - Real.de，德国重要电商平台

  // ========== 新兴平台/社交电商 ==========
  TikTokShop,       // 30 - TikTok Shop，全球短视频电商
  Temu,             // 31 - Temu，拼多多海外版
  SHEIN,            // 32 - SHEIN，快时尚独立站+平台化
  Shopee,           // 33 - Shopee，东南亚及台湾市场主力
  Lazada,           // 34 - Lazada，阿里系东南亚平台
  Daraz,            // 35 - Daraz，南亚电商平台（阿里收购）
  Jumia,            // 36 - Jumia，非洲最大电商平台
  Ozon,             // 37 - Ozon，俄罗斯第二大电商
  Wildberries,      // 38 - Wildberries，俄罗斯最大电商
  Flipkart,         // 39 - Flipkart，印度最大电商平台
  Meesho,           // 40 - Meesho，印度社交电商
  Poshmark,         // 41 - Poshmark，美国二手时尚交易平台
  Depop,            // 42 - Depop，欧美二手潮流平台
  Vinted,           // 43 - Vinted，欧洲二手服饰平台
  Whatnot,          // 44 - Whatnot，美国直播收藏品交易平台

  // ========== 独立站系统 ==========
  Shopify,          // 45 - Shopify，全球最大独立站SaaS
  ShopBase,         // 46 - ShopBase，独立站平台（越南）
  Shopyy,           // 47 - Shopyy，国内独立站SaaS
  WooCommerce,      // 48 - WooCommerce，WordPress电商插件
  Magento,          // 49 - Magento，开源电商系统
  BigCommerce,      // 50 - BigCommerce，企业级独立站
  Squarespace,      // 51 - Squarespace，建站+电商
  WixStores,        // 52 - Wix电商，建站平台电商功能

  // ========== B2B批发平台 ==========
  Alibaba,          // 53 - 阿里巴巴国际站，全球B2B头部
  MadeInChina,      // 54 - 中国制造网，B2B平台
  GlobalSources,    // 55 - 环球资源，B2B贸易平台
  DHgate,           // 56 - 敦煌网，跨境B2B/B2C混合
  ThomasNet,        // 57 - ThomasNet，北美工业品B2B

  // ========== 其他垂直/区域平台 ==========
  Newegg,           // 58 - 新蛋网，北美3C垂直
  Zillow,           // 59 - Zillow，美国房产电商
  Reverb,           // 60 - Reverb，乐器垂直平台
  Houzz,            // 61 - Houzz，家居装修垂直平台
  Farfetch,         // 62 - Farfetch，奢侈品电商
  Myntra,           // 63 - Myntra，印度时尚电商
  Tokopedia,        // 64 - Tokopedia，印尼电商平台（已被TikTok控股）
  Blibli,           // 65 - Blibli，印尼电商平台
  Tiki,             // 66 - Tiki，越南电商平台
  Sendo,            // 67 - Sendo，越南电商平台
  Qoo10,            // 68 - Qoo10，新加坡/日本电商
  Gmarket,          // 69 - Gmarket，韩国电商平台
  Auction,          // 70 - Auction，韩国电商平台
  Linio,            // 71 - Linio，拉美电商平台（已被Falabella收购）
  Falabella,        // 72 - Falabella，拉美零售电商
  Extra,            // 73 - Extra，巴西电商平台
  Submarino,        // 74 - Submarino，巴西电商平台
  CasasBahia,       // 75 - Casas Bahia，巴西家居电商
  OLX,              // 76 - OLX，全球分类信息平台
  Carousell,        // 77 - Carousell，东南亚二手交易平台
  Mercari,          // 78 - Mercari，日本二手交易平台
}