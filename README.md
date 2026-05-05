# VaultNote · 解锁资料库

> 本地加密账号管理工具，纯前端实现，数据仅存储在浏览器本地，不会上传到任何服务器。

## 功能特性

### 🔐 安全加密
- **PBKDF2-SHA256** 密钥派生（310,000 次迭代）
- **AES-GCM-256** 端到端加密
- 主密码不保存，遗忘即无法解密
- 复制敏感字段后 30 秒自动清空剪贴板
- 显示密码需二次认证（再次输入主密码）

### 📋 支持的账号类型
| 类型 | 示例字段 |
|------|---------|
| 邮箱 | Gmail、Outlook、QQ邮箱等 |
| 社交账号 | 微信、Telegram、Twitter/X等 |
| 订阅服务 | ChatGPT Plus、Netflix等 |
| 支付账号 | 信用卡、PayPal等 |
| 虚拟信用卡 | WildCard、Depay、Nobepay等 |
| eSIM / 保号卡 | ICCID、运营商、充值网址、到期日等 |
| 实名注册信息 | 姓名、地址、证件ID、SSN等 |

### 📤 导入 / 导出
- 导出加密备份（JSON，可跨浏览器迁移）
- 导出明文表格（CSV，**含密码，请慎用**）
- 导入加密备份（需输入原主密码）

### 🎨 界面设计
- 响应式布局，支持桌面和移动端
- 毛玻璃质感 + 青色主题配色
- 敏感字段默认隐藏，点击"显示"后可见
- 按标签（分类）筛选记录

## 使用方法

### 创建资料库
1. 双击 `index.html` 在浏览器打开
2. 首次使用，输入并确认主密码
3. 点击"创建并进入"

### 添加账号记录
1. 点击底部 **"新建"**
2. 填写账号信息，可选填关联账号、eSIM、虚拟卡、实名信息
3. 点击"保存"，自动加密存储

### 复制密码
1. 展开记录 → 点击"显示"（需再次认证）
2. 点击字段旁的复制图标
3. 30 秒后剪贴板自动清空

### 迁移到新设备
1. 原设备：设置 → 导出备份 → 复制加密 JSON
2. 新设备：打开 `index.html` → 导入备份 → 输入主密码

## 文件说明

```
C:\Users\admin\Desktop\0505\
├── index.html          # 入口页面
├── app.js              # 应用逻辑（含加密/解密、UI渲染、事件处理）
├── styles.css          # 样式（响应式、毛玻璃质感）
├── .gitignore          # Git 忽略规则（排除备份文件和工具输出）
└── tools/
    ├── decrypt-vault-to-csv.js   # 命令行解密 VaultNote 加密备份为 CSV
    └── extract-vault-backup.js    # 命令行提取备份内容（调试用）
```

## 命令行工具

### 解密加密备份为 CSV
```bash
node tools/decrypt-vault-to-csv.js <password> <backup.json> [output.csv]
```

### 提取备份内容（原始 JSON）
```bash
node tools/extract-vault-backup.js <backup.json>
```

## 技术细节

| 项目 | 实现 |
|------|------|
| 加密 | PBKDF2-SHA256（310k 迭代）+ AES-GCM-256 |
| 存储 | Browser localStorage（`vaultnote.encrypted.v1`） |
| 密码学 | Web Crypto API（原生浏览器 API，无外部依赖） |
| 样式 | 纯 CSS（无框架），含深色模式变量 |
| 响应式断点 | 1180px / 860px / 620px / 390px |

## GitHub 仓库

```
https://github.com/peter-zx/data_VaultNote_codex002
```

## ⚠️ 注意事项

- **主密码遗忘 = 数据永久丢失**，请务必牢记或使用密码管理器备份
- 导出 CSV 含明文密码，请仅在安全环境下操作并及时删除
- 浏览器隐身/无痕模式下 localStorage 数据不会持久化
- 更换浏览器或清除缓存前，请先导出加密备份