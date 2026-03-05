import { fonts } from '@/lib/fonts'
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '码码乐 AI 漫画工厂：创作属于您自己的漫画！',
  description: '使用 LLM + 即梦 AI 生成漫画分镜。由码码乐提供支持。',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
      </body>
    </html>
  )
}
