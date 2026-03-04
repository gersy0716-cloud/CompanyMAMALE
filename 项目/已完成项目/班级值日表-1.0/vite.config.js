import { defineConfig } from 'vite'

export default defineConfig({
    server: {
        host: 'localhost',
        // 默认端口5173（教师端）
        // 如需学生端，运行: npm run dev:student
        cors: true,
        open: true
    },
    preview: {
        port: 5000,
        host: 'localhost'
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false
    }
})
