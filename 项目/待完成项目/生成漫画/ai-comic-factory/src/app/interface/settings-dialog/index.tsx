"use client"

import { useState } from "react"
import { useLocalStorage } from 'usehooks-ts'

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { LLMVendor, RenderingModelVendor } from "@/types"
import { Input } from "@/components/ui/input"

import { Label } from "./label"
// We'll define Field locally if needed, or fix the export in field.tsx
import { Field } from "./field"
import { localStorageKeys } from "./localStorageKeys"
import { defaultSettings } from "./defaultSettings"

import { useDynamicConfig } from "@/lib/useDynamicConfig"
import { Slider } from "@/components/ui/slider"
import { fonts } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SectionTitle } from "./section-title"

export function SettingsDialog() {
  const [isOpen, setOpen] = useState(false)
  const [renderingModelVendor, setRenderingModelVendor] = useLocalStorage<RenderingModelVendor>(
    localStorageKeys.renderingModelVendor,
    defaultSettings.renderingModelVendor
  )
  const [renderingUseTurbo, setRenderingUseTurbo] = useLocalStorage<boolean>(
    localStorageKeys.renderingUseTurbo,
    defaultSettings.renderingUseTurbo
  )
  const [llmVendor, setLlmModelVendor] = useLocalStorage<LLMVendor>(
    localStorageKeys.llmVendor,
    defaultSettings.llmVendor
  )
  const [userDefinedMaxNumberOfPages, setUserDefinedMaxNumberOfPages] = useLocalStorage<number>(
    localStorageKeys.userDefinedMaxNumberOfPages,
    defaultSettings.userDefinedMaxNumberOfPages
  )
  const [mamaleApiKey, setMamaleApiKey] = useLocalStorage<string>(
    localStorageKeys.mamaleApiKey,
    defaultSettings.mamaleApiKey
  )

  const { config: { maxNbPages }, isConfigReady } = useDynamicConfig()

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-14 space-x-3 px-8 rounded-full bg-white/50 text-[var(--text-main)] border border-[var(--card-border)] hover:bg-white/80 transition-all font-bold text-base">
          <div>
            <span className="">设置</span>
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw] sm:max-w-[700px] md:max-w-[900px] bg-gray-50/95 backdrop-blur-2xl border-white/20 rounded-[var(--radius-lg)] p-10">
        <DialogHeader className="mb-6">
          <DialogTitle className="w-full text-center text-3xl font-bold text-stone-800 tracking-tight">
            码码乐 AI 漫画设置
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-scroll h-[70vh] px-4 space-y-8">
          <p className="text-lg italic text-zinc-600 w-full text-center p-4 bg-white/40 rounded-[var(--radius-md)] border border-white/20 shadow-sm">
            ℹ️ 部分模型冷启动较慢。生成结果仅供学习交流。<br />
            🔒 您的设置存储在本地浏览器中，隐私安全。
          </p>
          <SectionTitle className="text-xl font-bold border-b-2 border-[var(--primary)] pb-2 inline-block">👇 常规选项</SectionTitle>
          {isConfigReady && <Field className="space-y-6">
            <Label className="pt-2 text-lg font-bold">拖动滑块设置预期的总页数：<span className="text-[var(--primary)] text-2xl ml-2">{userDefinedMaxNumberOfPages}</span></Label>
            <Slider
              className="py-6"
              min={1}
              max={maxNbPages}
              step={1}
              onValueChange={(value: any) => {
                let numericValue = Number(value[0])
                numericValue = !isNaN(value[0]) && isFinite(value[0]) ? numericValue : 0
                numericValue = Math.min(maxNbPages, Math.max(1, numericValue))
                setUserDefinedMaxNumberOfPages(numericValue)
              }}
              defaultValue={[userDefinedMaxNumberOfPages]}
              value={[userDefinedMaxNumberOfPages]}
            />
          </Field>
          }
          <div className={cn(
            `grid gap-2 pt-3 pb-1`,
            `text-stone-800`
          )}>


            {
              // renderingModelVendor === "SERVER" && <>
              //   <Field>
              //     <Label>Quality over performance ratio (beta, deprecated):</Label>
              //     <div className="flex flex-row space-x-2 text-zinc-500">
              //       <Switch
              //         // checked={renderingUseTurbo}
              //         // onCheckedChange={setRenderingUseTurbo}
              //         checked={false}
              //         disabled
              //         className="opacity-30 pointer-events-none"
              //       />
              //       {/*
              //       <span
              //         onClick={() => setRenderingUseTurbo(!renderingUseTurbo)}
              //         className={cn("cursor-pointer", { "text-zinc-800": renderingUseTurbo })}>
              //           Use a faster, but lower quality model (you are warned!)
              //         </span>
              //     */}
              //     <span className="text-zinc-500 italic">
              //       Following feedbacks from users (low rendering quality on comics) the fast renderer has been disabled.
              //     </span>
              //     </div>
              //   </Field>
              // </>
            }

            <SectionTitle className="text-xl font-bold border-b-2 border-[var(--primary)] pb-2 inline-block mt-10">👇 分镜渲染选项 (绘图)</SectionTitle>

            {renderingModelVendor !== "SERVER" && (
              <p className="text-base text-zinc-500 italic mt-4">
                自选通道目前由系统内置配置接管。
              </p>
            )}

            <SectionTitle className="text-xl font-bold border-b-2 border-[var(--primary)] pb-2 inline-block mt-10">👇 认证选项</SectionTitle>
            <Field className="space-y-4 pt-4">
              <Label className="text-lg font-bold">码码乐/BaseMulti 认证令牌 (JWT)：</Label>
              <Input
                type="password"
                placeholder="在此输入您的 JWT 令牌..."
                value={mamaleApiKey}
                onChange={(e) => setMamaleApiKey(e.target.value)}
                className="bg-white h-14 text-base rounded-[var(--radius-md)] border-[var(--card-border)] px-6"
              />
              <p className="text-sm text-zinc-500 italic">
                此令牌用于生图与数据库存储。若不清楚如何获取，请咨询管理员。
              </p>
            </Field>

            <SectionTitle className="text-xl font-bold border-b-2 border-[var(--primary)] pb-2 inline-block mt-10">👇 故事生成选项 (🚧 实验室功能 🚧)</SectionTitle>

            <p className="text-lg p-6 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 italic shadow-sm">
              ℹ️ 系统已配置高性能内置推理性引擎。<br />
              🔒 您的设置仅在本地生效。
            </p>
            <Field className="space-y-4">
              <Label className="text-lg font-bold mt-4">剧情生成 - 请选择 LLM 语言模型服务商：</Label>
              <Select
                onValueChange={(value: string) => {
                  setLlmModelVendor(value as LLMVendor)
                }}
                defaultValue={llmVendor}
                value={llmVendor}>
                <SelectTrigger className="bg-white h-14 text-base rounded-[var(--radius-md)] border-[var(--card-border)] px-6">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-[40vh]">
                  <SelectItem value="SERVER" className="h-14 text-base">码码乐官方引擎 (DeepSeek-V3)</SelectItem>
                  <SelectItem value="GROQ" className="h-14 text-base">Groq (内置加速)</SelectItem>
                  <SelectItem value="ANTHROPIC" className="h-14 text-base">Anthropic (内置加速)</SelectItem>
                  <SelectItem value="OPENAI" className="h-14 text-base">OpenAI (内置加速)</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            {llmVendor !== "SERVER" && (
              <p className="text-base text-zinc-500 italic mt-4">
                自选供应商目前由系统内置 API 接管。
              </p>
            )}

          </div>

        </div>

        <DialogFooter className="mt-8">
          <Button type="submit" className="h-16 w-full text-xl font-bold bg-[var(--primary)] hover:scale-105 active:scale-95 transition-all rounded-2xl shadow-xl shadow-[var(--primary-glow)]" onClick={() => setOpen(false)}>保存并关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}