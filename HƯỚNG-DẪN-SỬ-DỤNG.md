# 📋 HƯỚNG DẪN SỬ DỤNG LIVE TEAM PLUGIN

## 🌊 **LUỒNG CHỌP VÀ HOẠT ĐỘNG**

### 1. Mở Biểu Đồ Trực Quan

🔗 **Link:** `/Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html`

**Thao tác:**
- Mở file trong Chrome/Safari
- Xem biểu đồ luồng từ Slot Registry → Plugin Entry → Render
- Tìm hiểu difference giữa Plugin (Live) và Demo (Hardcode)

---

## 📖 **CẤU TRÚC PLUGIN**

### File Quan Trọng:

| File | Vị Trí | Chức Năng |
|------|--------|-----------|
| `cordis.patch.yml` | `/Agent-Team-Visualizer/cordis.patch.yml` | Plugin entry point (insert) |
| `package.json` | `/Agent-Team-Visualizer/package.json` | Manifest & dsh.client settings |
| `src/dsh-live-plugin.tsx` | `/Agent-Team-Visualizer/src/...` | Slot registration code |
| `src/dsh-live-entry.tsx` | `/Agent-Team-Visualizer/src/...` | Main view component (render) |
| `src/OfficeScene.tsx` | `/Agent-Team-Visualizer/src/...` | 3D scene rendering |
| `dist-dsh/agent-team-visualizer/` | Output bundle output | Bundle cho profile web link |

---

## 🎯 **CÀI ĐẶT VÀO DSX PROFILE WEB**

### Bước 1: Build Plugin (nếu chưa build)

```bash
cd /Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer
npm run build:dsh      # Tạo bundle vào dist-dsh/agent-team-visualizer/
pnpm run lint          # Chất lượng code (nên chạy trước deploy)
git diff --check       # Không commit nếu có lỗi
```

### Bước 2: Add vào Profile Web

File: `~/.dsh/profiles/web/package.json`

```json
{
  "dependencies": {
    "@local/agent-team-visualizer": "link:/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/dist-dsh/agent-team-visualizer"
  }
}
```

### Bước 3: Bundle patch

File: `~/.dsh/profiles/web/cordis.patch.yml`

```yaml
- insert:
    - id: agent-team-visualizer
      name: '@local/agent-team-visualizer'
```

### Bước 4: Restart DSH Web

```bash
# Kết thúc quá trình hiện tại và khởi động lại
# Plugin sẽ tự động inject vào conversation.view slot (order: 20)
```

---

## ✅ **KIỂM TRA PLUGIN ĐÃ HOẠT ĐỘNG**

### Trong Browser (`http://127.0.0.1:3080`):

1. Tìm tab **Live Team** sau Chat và Trajectory View
2. Xem tab có 3D workspace với agents:
   - ✅ Provisioning → Idle (đứng ghế)
   - ✅ Running → Working (ngồi desk)
   - ✅ Failed → Done (badge error label)
   - ❌ otherwise → Idle (waiting state)

---

## 📊 **SƠ ĐỒ LUỒNG (LUÔN CHỌP)**

```
┌───────────────────────────────────────────────┐
│  SLOT REGISTRY (conversation.view)            │
│    ├─ Chat View (order: 0)                    │
│    ├─ Trajectory View (order: 10)             │
│    └─ Live Team View (order: 20) ⭐           │
└───────────────────────────────────────────────┘
              ↓
        Plugin Entry → cordis.patch.yml
              ↓
     dsh-live-plugin.tsx → inject + register
              ↓
      dsh-live-entry.tsx → Read Props (agentTeam, running)
              ↓
       Render 3D Scene với LiveDesk
              ↓
    OfficeCameraController (zoom/pan/orbit)
```

---

## 🔍 **CÁC FILE ĐÃ INDEX TRONG CODEBASE-MEMORY**

Các file sau đã được index trong codebase-memory cho project `Agent-Team-Visualizer`:

- ✅ `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/README.md`
- 📄 `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/cordis.patch.yml`
- 📦 `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/package.json`
- 🎨 `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/src/dsh-live-plugin.tsx`
- 🔌 `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/src/dsh-live-entry.tsx`
- 🖼️ `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/src/OfficeScene.tsx`

**Tìm kiếm qua codebase-memory:**

```bash
# Search graph (MCP tool)
mcp__codebase-memory__search_graph(
  project="Agents-nguyenngoctrantien-AI_dsh-Agent-Team-Visualizer",
  query="Live Team"
)
```

---

## 📚 **TÀI LIỆU THAM KHẢO**

1. **Biểu đồ tương tác:** `/Users/nguyenngoctrantien/AI_dsh/LiveTeam-Diagram.html`
2. **Project README (update):** `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/README.md`
3. **Plugin source (full):** `/Users/nguyenngoctrantien/AI_dsh/Agent-Team-Visualizer/`
4. **Codebase-memory index:** `project="Agents-nguyenngoctrantien-AI_dsh-Agent-Team-Visualizer"`

---

## 🎬 **MỤC ĐÍCH VÀ KHÁC BIỆT**

### ✅ Live Team Plugin (Production)
- Data: Agent team projection từ host state
- Status: Runtime real-status mapping
- Motion: Real-time camera controls
- Use case: Productive runtime trong DSH Web

### ⚪ Standalone Demo (Demo Only)
- Data: Hardcoded initialMembers, initialTasks, feed
- Status: Static illustrations, không phải true runtime state
- Motion: Animation demo testing
- Use case: Testing UI với hardcoded data

---

## 🆘 **LỖI THƯỜNG GẶP VÀ KIỂM SOÁT**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `<id>: failed` in boot audit | `inject` không phải array | Check file `src/dsh-live-plugin.tsx` exports |
| `client bundle not found` | Bundle chưa build | Run `npm run build:dsh` trước deploy |
| `platform must be string = "web"` | Manifest typo | Check field `dsh.client.platform` trong package.json |

---

## ✨ **MỜI CỘNG ĐỒNG PHÁT TRIỂN**

Chúng tôi rất vui nếu bạn:

1. 🌟 ⭐️ Star repo trên GitHub
2. 🤝 PR features mới đến `feature/agent-visualizer-improvements` branch
3. 🔍 Report bug qua issue tracker
4. 👥 Share với team DSH developer khác

**GitHub:** <https://github.com/Tiennguyen25081996/Agent-Team-Visualizer>

---

## 📧 LIÊN HỆ VÀ ĐÓN TẾP

**Email / Slack:** (Liên hệ qua repo GitHub)

**Mở pull request từ branch hiện tại:**
<https://github.com/Tiennguyen25081996/Agent-Team-Visualizer/pull/new/feature/agent-visualizer-improvements>

---

**©️ Tien Ng 2024 - Live Team Plugin for DSH Web** 🎨
