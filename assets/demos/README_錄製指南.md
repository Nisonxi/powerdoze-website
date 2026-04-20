# GIF 錄製指南

## 工具
推薦用 **ScreenToGif** (免費開源): https://www.screentogif.com/
- 安裝後選「錄影機」，框選 PowerDoze 視窗區域
- 錄完後可裁剪、調速、存成 GIF
- 建議尺寸: 800x500 左右，15 FPS，每段 5-15 秒

## 要錄的 12 段

| 檔名 | 操作步驟 |
|------|---------|
| `01-sleep-rules.gif` | 首頁 → 點「+」新增規則 → 設定名稱/時間/星期 → 儲存 → 看到規則出現在列表 |
| `02-power-modes.gif` | 側邊欄 → Power Mode 頁面 → 點一個 mode → 按 Apply → 看到 toast 提示 |
| `03-whitelist.gif` | 側邊欄 → Whitelist → 點「+」掃描 → 勾選一個 App → 確認 → 看到加入列表 |
| `04-fullscreen.gif` | 開一個全螢幕遊戲/影片 → 回到 PowerDoze 首頁看到 Smart Detect 顯示 "Fullscreen: xxx" → 退出全螢幕 |
| `05-away-mode.gif` | 側邊欄 → Smart Detect → Away Mode 區塊 → 開啟 → 設定分鐘數 → 儲存 |
| `06-app-foreground.gif` | Smart Detect → App Rules → 新增規則 → 選 App + 選 Mode → 儲存 |
| `07-wifi-geofencing.gif` | Smart Detect → Wi-Fi → 新增規則 → 選 SSID + 選 Mode → 儲存 |
| `08-battery-policy.gif` | Smart Detect → Battery → 開啟 → 設定閾值和模式 → 儲存 |
| `09-hardware-monitor.gif` | 側邊欄 → System Monitor → 看到 CPU/RAM/Network 圖表 → 切到 Mini Mode |
| `10-smart-task.gif` | 側邊欄 → Smart Tasks → 新增 → 選 Action (Sleep) + Trigger (Countdown) → 儲存 |
| `11-analytics.gif` | 側邊欄 → Analytics → 看到圖表/數據 → 切換時間範圍 |
| `12-export-import.gif` | 側邊欄 → Settings → 拉到底 → 點 Export → 存檔 → 看到成功提示 |

## 錄完後
把 GIF 放到這個資料夾 (`website/assets/demos/`)，然後告訴我，我會自動替換到 features.html 裡。
