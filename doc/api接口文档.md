# 市场调研

## 用户画像分析

### 请求

```json
{
  "platform": "reddit",//用户选择下拉的平台名称
  "question": "用户对XX产品的看法",
  "limit": 10,
  "filters": {
    "date_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    },
    "min_likes": 5
  }
}
```

### 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "posts": [
      {
        "title": "帖子标题",
        "url": "https://...",
        "platform": "reddit",
        "comments": [
          {
            "created_at": "2024-11-11T11:11:11Z",
            "content": "评论内容",
            "likes": 128,
            "relevance_score": 0.92
          }
        ]
      }
    ],
    "total": 10,
    "report":""
    "download_token": "token_xyz"
  }
}

```

## 市场分析
### 请求

```json
{
    "question": "当前AI写作工具的市场规模和竞争格局如何？",          //用户输入的关于产品问题
}

```

### 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "report": "xxx",
      "references": ["来源1", "来源2"],
      "generated_at": "2024-12-01T10:00:00Z"
    
  }
}
```

## 获客分析

### 请求

```json
{
    "product":"xxx",            //用户输入的产品名称
    "target_industry":"xxx",    //用户输入的目标行业
    "limit": 20,               //用户输入的获取的条数
    "region": "CN",            //用户输入的目标地区
}
```

### 响应

```json
{
    "code": 200,
    "message": "success",
    "data": {
        "leads": [
        {
            "lead_id": "l001",
            "company": "某某科技有限公司",
            "contact_name": "张三",
            "phone_number": "+86-138xxxx8888",
            "email": "contact@example.com",
            "source_link": "https://...",
        }
        ],
        "total": 20,
        "download_token": "token_abc"
    }
}


```







# 内容营销

## 生成视频

### 请求

```json
{
  "prompt": "为这款护肤品生成一段15秒的种草视频",
  "product_image": {
    "type": "base64",
    "data": "iVBORw0KGgo..."
  },
  "model_image": {
    "type": "url",
    "data": "https://cdn.example.com/model_001.jpg"
  },
  "settings": {
    "duration": 15,
    "ratio": "9:16",
    "style": "realistic",
    "language": "zh"
  }
}
```


### 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "task_id": "task_abc123",
    "status": "pending",
    "estimated_seconds": 60
  }
}
```



```json
{
  "code": 200,
  "message": "success",
  "data": {
    "task_id": "task_abc123",
    "status": "completed",
    "video": {
      "url": "https://cdn.example.com/videos/output_abc123.mp4",
      "thumbnail_url": "https://cdn.example.com/thumbnails/abc123.jpg",
      "duration": 15,
      "size_mb": 8.2,
      "expires_at": "2025-01-01T10:00:00Z"
    }
  }
}
```



## 自动上传

### 请求

```json
{
  "media": {
    "type": "video",
    "source": "task",
    "task_id": "task_abc123"
  },
  "platforms": ["douyin", "instagram", "youtube"],
  "post_config": {
    "title": "夏日清爽护肤新品来啦！",
    "description": "适合油皮的轻盈配方...",
    "tags": ["护肤", "新品", "夏日"],
    "schedule_at": "2024-12-10T09:00:00Z"
  }
}
```

### 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "publish_id": "pub_xyz789",
    "results": [
      {
        "platform": "douyin",
        "status": "published",
        "post_url": "https://www.douyin.com/video/xxx",
        "published_at": "2024-12-10T09:00:05Z"
      },
      {
        "platform": "instagram",
        "status": "failed",
        "error": "access_token_expired"
      },
      {
        "platform": "youtube",
        "status": "scheduled",
        "scheduled_at": "2024-12-10T09:00:00Z"
      }
    ]
  }
}
```




# 智能运营

## 请求

```json
{
  "platform": "douyin",
  "account_id": "acc_001",
}
```

## 响应

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "platform": "douyin",
    "period": "2024-11 ~ 2024-11",
    "overview": {
      "total_views": 128000,
      "total_likes": 9400,
      "new_followers": 1230,
      "avg_engagement_rate": "7.3%"
    },
    "report": "xxx"  
  }
}
```

