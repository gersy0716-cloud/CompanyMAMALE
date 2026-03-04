import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/plat/public/20251220005410/',
      server: {
        port: 5000,
        host: '0.0.0.0',
        strictPort: true, // 严格使用指定端口，如果被占用则报错而不是自动切换
      },
      plugins: [react()],
      css: {
        postcss: './postcss.config.cjs',
      },
      define: {
        'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
        'process.env.OPENAI_BASE_URL': JSON.stringify(env.OPENAI_BASE_URL),
        'process.env.IMAGE_API_URL': JSON.stringify(env.IMAGE_API_URL),
        'process.env.IMAGE_API_TOKEN': JSON.stringify(env.IMAGE_API_TOKEN)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
