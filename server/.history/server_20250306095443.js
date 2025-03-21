/*
 * @Author: john_mactavish 981192661@qq.com
 * @Date: 2025-03-04 09:35:08
 * @LastEditors: john_mactavish 981192661@qq.com
 * @LastEditTime: 2025-03-06 09:53:08
 * @FilePath: \htmle:\projects_vscode\passenger info search\server.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const express = require('express');
const createError = require('http-errors');
const logger = require('morgan');
const cors = require('cors');
const connector = require('./utils/connector');

const app = express();

app.use(logger('dev'));
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        db: connector.pool ? 'connected' : 'disconnected'
    });
});

app.get('/api/query', async (req, res, next) => {
    try {
        const rows = await connector.query("谢天");
        if (!rows || rows.length === 0) {
            return res.status(404).json({
                message: `未找到的相关记录`
            });
        }

        res.json({
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error(`🚨 查询错误: ${error.message}`);
        next(error);
    }
});

// app.use('./routes/index.js')(app);

app.use((req, res, next) => {
    next(createError(404));
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || "服务器内部错误",
        }
    });
});

async function startServer() {
    try {
        await connector.initPool();  // 先初始化连接池
        console.log(connector.pool._state);
        
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`服务器启动 监听 ${PORT} 端口号`);
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

async function gracefulShutdown() {
    console.log('\n🛑 收到关闭信号，开始清理...');
    try {
        await connector.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ 关闭失败:', error);
        process.exit(1);
    }
}

process.on("SIGINT", gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

startServer();