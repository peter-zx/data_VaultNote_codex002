const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { webcrypto } = require("crypto");

const crypto = webcrypto;
const workspace = "C:/Users/admin/Desktop/0505";
const inputFile = path.join(workspace, "vaultnote-encrypted-backup-latest.json");

function decodeBase64(value) {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptVault(password, payload) {
  const key = await deriveKey(password, decodeBase64(payload.salt));
  const body = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: decodeBase64(payload.iv) },
    key,
    decodeBase64(payload.cipher)
  );
  return JSON.parse(new TextDecoder().decode(body));
}

function csvCell(value = "") {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function toCsv(records) {
  const headers = [
    "标签",
    "状态",
    "异常说明",
    "账号",
    "密码",
    "网址",
    "关联账号",
    "关联账号密码",
    "补充标签",
    "ICCID/卡号",
    "运营商",
    "充值网址",
    "套餐/余额",
    "保号到期",
    "开卡平台",
    "卡号",
    "有效期",
    "CVV",
    "账单地址",
    "卡备注",
    "姓名",
    "住址",
    "邮编",
    "城市",
    "州/省",
    "国家/地区",
    "电话",
    "SSN",
    "证件ID",
    "出生日期",
    "备注",
    "更新时间",
  ];

  const rows = records.map((record) => [
    record.label || record.category,
    record.issueNote ? "异常" : "正常",
    record.issueNote,
    record.username || record.email,
    record.password,
    record.url,
    record.relatedAccount || record.chatgptAccount,
    record.relatedPassword || record.appleId,
    record.extraLabel || record.tags,
    record.esimIccid,
    record.esimCarrier,
    record.esimRechargeUrl,
    record.esimPlan,
    record.esimExpiresAt,
    record.cardPlatform,
    record.cardNumber,
    record.cardExpiry,
    record.cardCvv,
    record.cardBillingAddress,
    record.cardNote,
    record.identityName,
    record.identityAddress,
    record.identityZip,
    record.identityCity,
    record.identityState,
    record.identityCountry,
    record.identityPhone,
    record.identitySsn,
    record.identityId,
    record.identityBirthday,
    record.notes,
    record.updatedAt,
  ]);

  return "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function askPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question("输入 VaultNote 主密码后按回车：", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

(async () => {
  if (!fs.existsSync(inputFile)) {
    console.error(`找不到加密备份：${inputFile}`);
    process.exit(2);
  }
  const payload = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  const password = await askPassword();
  const data = await decryptVault(password, payload);
  const records = data.records || [];
  for (const file of fs.readdirSync(workspace)) {
    if (/^vaultnote-export-.*\.csv$/i.test(file)) {
      fs.unlinkSync(path.join(workspace, file));
    }
  }
  const outFile = path.join(workspace, "vaultnote-export-latest.csv");
  fs.writeFileSync(outFile, toCsv(records), "utf8");
  console.log(`已导出 ${records.length} 条记录：${outFile}`);
})().catch((error) => {
  console.error("导出失败：主密码不正确，或备份文件已损坏。");
  console.error(error.message);
  process.exit(1);
});
