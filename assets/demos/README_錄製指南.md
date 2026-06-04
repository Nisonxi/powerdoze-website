# PowerDoze Demo 錄製作業包（ScreenToGif）

> 全部 12 段都用 **ScreenToGif** 錄成 GIF。錄完丟回這個資料夾（`website/assets/demos/`），
> **檔名照下面表格一字不差**，然後告訴我，我會接到 `features.html`。

---

## A. 錄之前做一次（決定整體一致性，很重要）

1. **啟動方式**：Release 版 + **系統管理員**執行（不然 CPU 功耗那段會是 0 W）。
2. **主題**：深色（預設就是）。
3. **語言**：切英文 —— Settings（設定）→ Language → English。網站版面是英文，截圖用英文最搭。
4. **視窗大小固定**：把 PowerDoze 視窗拖到大約 **1100 × 720**。**12 段全部用同一個大小**，縮成縮圖時風格才一致。
5. **demo 資料先留著**：Whitelist 的 6 個 App、Smart Tasks 的 3 個（停用）先別清，錄到那兩段要用。**全部 12 段錄完再清**。
   - ⚠️ Smart Tasks 那 3 個保持「**停用**」狀態錄，別讓它真的觸發關機/睡眠。

## B. ScreenToGif 設定（一次設好）

- 下載：<https://www.screentogif.com/>（免費開源）
- 開「**錄影機 (Recorder)**」
- 右下角 **FPS 設 15**
- 框選範圍：框住 App 視窗內容區，約 **900 × 560**（或用視窗吸附對齊 PowerDoze）
- 滑鼠移動**放慢**，停在關鍵畫面 **1～2 秒**讓觀眾看清楚
- 每段長度 **5～12 秒**就好，不用長

## C. 匯出設定（每段錄完都照這個存）

1. 錄完進編輯器 → 刪掉開頭/結尾的廢影格
2.（檔案大的話）用「**減少影格 / Reduce Frames**」壓一下
3. 檔案 → **另存為 → GIF**
4. 編碼器選 **Gifski** 或 **2.0（內建）**→ 檔案較小
5. 最多顏色 **256**、勾 **循環播放（Loop）無限**
6. 目標大小：**每段 < 800 KB**（現有的 130～330 KB 是好範本，別超過 1 MB）

---

## D. 要錄的 12 段（逐段腳本）

英文介面側邊欄由上到下：**Home / Power Modes / Smart Detection / Smart Tasks / Analytics / Whitelist / Process manager / System Monitor / Settings / System Logs**

> 步驟用 App 實際的英文字。`Sidebar` = 左側選單。

| # | 檔名（存成 .gif） | English recording steps | 狀態 |
|---|---|---|---|
| 01 | `01-sleep-rules.gif` | On the **Home** screen, click **＋ / New Rule** → fill in the name, time window and days of week → click **Save** → the new rule appears in the list. | 🔁 現 PNG，重錄成 GIF |
| 02 | `02-power-modes.gif` | Sidebar → **Power Modes** → click a mode card → click **Apply** → wait on the confirmation toast. | ✅ 已有（可重錄） |
| 03 | `03-whitelist.gif` | Sidebar → **Whitelist** → click **＋ / Add App** → scan running apps → tick one app → confirm → it appears in the list. | ⬜ 缺 |
| 04 | `04-fullscreen.gif` | Launch a fullscreen game/video → switch back to **Home**; the status card shows the detected fullscreen app (sleep rules paused) → exit fullscreen → it returns to normal. | ⬜ 缺 |
| 05 | `05-away-mode.gif` | Sidebar → **Smart Detection** → **Away Mode** section → toggle ON → set **Idle timeout** (and, Pro, **Away power mode**) → **Save**. | 🔁 現 PNG，重錄成 GIF |
| 06 | `06-app-foreground.gif` | Sidebar → **Smart Detection** → **App → Power Mode Rules** section → click **Add Rule** → pick an app + pick a Power Mode → **Save**. | ⬜ 缺 |
| 07 | `07-wifi-geofencing.gif` | Sidebar → **Smart Detection** → **Wi-Fi geofencing** section (needs Windows **Location Services ON**) → add a rule → pick an SSID + a Power Mode → **Save**. | ⬜ 缺 |
| 08 | `08-battery-policy.gif` | Sidebar → **Smart Detection** → **Battery Policy** section (laptops only) → toggle ON → set the level threshold + mode → **Save**. | ⬜ 缺 |
| 09 | `09-hardware-monitor.gif` | Sidebar → **System Monitor** → show the CPU / RAM / Network charts → switch to **Mini mode** (floating panel) → switch back. | ✅ 已有（可重錄） |
| 10 | `10-smart-task.gif` | Sidebar → **Smart Tasks** → **Add Task** → set **Action = Sleep**, **Trigger = Countdown** → **Save** (leave it **disabled**). | ⬜ 缺 |
| 11 | `11-analytics.gif` | Sidebar → **Analytics** → show the charts / data → change the **Day range** (7 / 14 / 30 days). | 🔁 現 PNG，重錄成 GIF |
| 12 | `12-export-import.gif` | Sidebar → **Settings** → scroll to **Backup & Restore** → click **Export** → save the file → wait on the "Settings exported" message. | ⬜ 缺 |

---

## E. 錄完之後

把 GIF 丟回這個資料夾，跟我說「錄好了」+ 哪幾段。我會：
- **缺的 7 段**（03/04/06/07/08/10/12）：自動把 `features.html` 對應區塊的線條 icon 換成你的 GIF。
- **重錄的 3 段**（01/05/11）：把 `features.html` 的引用從 `.png` 改成 `.gif`（檔名一樣只差副檔名）。
- 全部接好後，提醒你 commit + 推上 GitHub Pages，並清掉 demo 資料。
