process.on('uncaughtException', (err) => {
    console.error('CRASH LOG:', err);
    process.exit(1);
});

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bedrock = require('bedrock-protocol');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const htmlContent = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MC Bedrock All-in-One Bot</title>
    <script src="/socket.io/socket.io.js"></script>
    <style>
        :root {
            --bg: #0f172a; --card: #1e293b; --accent: #38bdf8;
            --text: #f8fafc; --text-dim: #94a3b8; --danger: #ef4444;
            --success: #22c55e; --warning: #f59e0b; --border: #334155;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: ui-monospace, monospace; }
        body { background: var(--bg); color: var(--text); min-height: 100vh; padding: 1.5rem; display: flex; justify-content: center; align-items: center; }
        .container { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 1rem; }
        .tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; background: var(--card); padding: 0.5rem; border-radius: 12px; border: 1px solid var(--border); }
        .tab-btn { padding: 0.75rem; background: transparent; border: none; border-radius: 8px; color: var(--text-dim); font-weight: bold; cursor: pointer; transition: 0.2s; font-size: 0.9rem; text-align: center; }
        .tab-btn.active { background: var(--accent); color: #0f172a; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.4); display: none; }
        .card.active { display: block; }
        h1 { font-size: 1.15rem; font-weight: 700; color: var(--accent); margin-bottom: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .row-group { display: grid; grid-template-columns: 2fr 1fr; gap: 0.75rem; }
        label { display: block; font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.4rem; }
        input { width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; color: var(--text); font-size: 0.9rem; }
        input:focus { outline: none; border-color: var(--accent); }
        .btn { width: 100%; padding: 0.75rem; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.95rem; }
        .btn-start { background: var(--success); color: #fff; }
        .btn-stop { background: var(--danger); color: #fff; }
        .server-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-bottom: 1.25rem; }
        .stat-box { background: #020617; border: 1px solid var(--border); border-radius: 8px; padding: 1rem 0.5rem; text-align: center; }
        .stat-val { font-size: 1rem; font-weight: bold; color: var(--accent); margin-top: 0.3rem; }
        .stat-lbl { font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; }
        .status-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .status-offline { background: rgba(239,68,68,0.2); color: var(--danger); border: 1px solid var(--danger); }
        .status-online { background: rgba(34,197,94,0.2); color: var(--success); border: 1px solid var(--success); }
        .console { background: #020617; border: 1px solid var(--border); border-radius: 6px; padding: 1rem; height: 180px; overflow-y: auto; font-size: 0.75rem; color: #34d399; line-height: 1.4; margin-top: 1rem; }
        .flex-row { display: flex; justify-content: space-between; align-items: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="tabs">
            <button class="tab-btn active" onclick="switchTab(0)">1. Kết Nối & Bot</button>
            <button class="tab-btn" onclick="switchTab(1)">2. Thông Tin & Console</button>
        </div>

        <div class="card active" id="tab0">
            <h1>Cấu Hình Bot Thật</h1>
            <div class="form-group row-group">
                <div>
                    <label>Địa Chỉ IP / Host</label>
                    <input type="text" id="serverIp" value="kingmc.vn">
                </div>
                <div>
                    <label>Cổng (Port)</label>
                    <input type="number" id="serverPort" value="19132">
                </div>
            </div>
            <div class="form-group">
                <label>Tên Bot (Username)</label>
                <input type="text" id="botName" value="AFK_Guard_01">
            </div>
            <div class="form-group">
                <label>Nhịp Chống AFK (giây)</label>
                <input type="number" id="interval" value="15" min="5">
            </div>
            <button id="toggleBtn" class="btn btn-start" onclick="toggleBot()">Kích Hoạt Bot Thật</button>
        </div>

        <div class="card" id="tab1">
            <h1>Trạng Thái Vận Hành</h1>
            <div class="server-stats">
                <div class="stat-box">
                    <div class="stat-lbl">Trạng thái Bot</div>
                    <div id="botStatusVal" class="stat-val"><span class="status-badge status-offline">Offline</span></div>
                </div>
                <div class="stat-box">
                    <div class="stat-lbl">Giao thức</div>
                    <div class="stat-val">RakNet</div>
                </div>
                <div class="stat-box">
                    <div class="stat-lbl">Phiên bản</div>
                    <div class="stat-val">Bedrock</div>
                </div>
            </div>
            <div class="flex-row">
                <span style="font-size: 0.85rem; color: var(--accent);">Nhật Ký Realtime từ Bot</span>
            </div>
            <div id="consoleLog" class="console">
[System] Ứng dụng gộp 1 file đã sẵn sàng.
            </div>
        </div>
    </div>

    <script>
        const socket = io();
        let running = false;

        function switchTab(index) {
            document.querySelectorAll('.tab-btn').forEach((t, i) => t.classList.toggle('active', i === index));
            document.querySelectorAll('.card').forEach((c, i) => c.classList.toggle('active', i === index));
        }

        function log(msg) {
            const consoleBox = document.getElementById('consoleLog');
            const time = new Date().toLocaleTimeString();
            consoleBox.innerHTML += \`[\${time}] \${msg}<br>\`;
            consoleBox.scrollTop = consoleBox.scrollHeight;
        }

        socket.on('log', (data) => log(data));

        socket.on('bot-status', (status) => {
            const badge = document.getElementById('botStatusVal');
            const btn = document.getElementById('toggleBtn');
            if (status === 'online') {
                running = true;
                badge.innerHTML = '<span class="status-badge status-online">Online</span>';
                btn.textContent = 'Dừng Bot Thật';
                btn.className = 'btn btn-stop';
            } else {
                running = false;
                badge.innerHTML = '<span class="status-badge status-offline">Offline</span>';
                btn.textContent = 'Kích Hoạt Bot Thật';
                btn.className = 'btn btn-start';
            }
        });

        function toggleBot() {
            const ip = document.getElementById('serverIp').value;
            const port = document.getElementById('serverPort').value;
            const username = document.getElementById('botName').value;
            const interval = document.getElementById('interval').value;

            if (!running) {
                socket.emit('start-bot', { ip, port, username, interval });
            } else {
                socket.emit('stop-bot');
            }
        }
    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlContent);
});

let botClient = null;
let afkInterval = null;
let isBotRunning = false;

io.on('connection', (socket) => {
    socket.on('start-bot', (data) => {
        if (isBotRunning) return;
        const { ip, port, username, interval } = data;
        socket.emit('log', `[Hệ thống] Đang kết nối ${username} tới ${ip}:${port}...`);

        try {
            botClient = bedrock.createClient({
                host: ip,
                port: parseInt(port),
                username: username,
                offline: true
            });

            botClient.on('connect', () => {
                isBotRunning = true;
                socket.emit('bot-status', 'online');
                socket.emit('log', '[Thành công] Bot đã kết nối vào server!');
            });

            botClient.on('spawn', () => {
                socket.emit('log', '[Trạng thái] Bot đã xuất hiện trong thế giới. Bật chống AFK...');
                afkInterval = setInterval(() => {
                    if (!botClient) return;
                    const randomYaw = Math.floor(Math.random() * 360);
                    try {
                        botClient.write('move', {
                            runtime_entity_id: 1n,
                            position: { x: 0, y: 0, z: 0 },
                            pitch: 0,
                            yaw: randomYaw,
                            head_yaw: randomYaw,
                            on_ground: true
                        });
                        socket.emit('log', `[Anti-Ban] Gửi nhịp giữ chỗ (Yaw: ${randomYaw}°).`);
                    } catch (e) {}
                }, parseInt(interval) * 1000);
            });

            botClient.on('close', () => {
                socket.emit('log', '[Cảnh báo] Mất kết nối khỏi server.');
                cleanupBot();
                socket.emit('bot-status', 'offline');
            });

            botClient.on('error', (err) => {
                socket.emit('log', `[Lỗi Bot]: ${err.message}`);
                cleanupBot();
                socket.emit('bot-status', 'offline');
            });
        } catch (err) {
            socket.emit('log', `[Lỗi]: ${err.message}`);
            cleanupBot();
            socket.emit('bot-status', 'offline');
        }
    });

    socket.on('stop-bot', () => {
        if (isBotRunning) {
            cleanupBot();
            socket.emit('bot-status', 'offline');
            socket.emit('log', '[Hệ thống] Đã dừng bot.');
        }
    });
});

function cleanupBot() {
    if (afkInterval) clearInterval(afkInterval);
    if (botClient) {
        try { botClient.close(); } catch(e) {}
        botClient = null;
    }
    isBotRunning = false;
    afkInterval = null;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Ứng dụng chạy tại: http://localhost:${PORT}`);
});
