
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

import { Login } from "../login"
import { SettingsDialog } from "../settings-dialog"

export function AuthWall({ show }: { show: boolean }) {
  return (
    <Dialog open={show}>
      <DialogContent className="sm:max-w-[800px]">
        <div className="grid gap-4 py-4 text-stone-800 text-center text-xl font-[var(--font-main)]">
          <p className="font-bold">
            码码乐 AI 漫画工厂是一款免费的创作工具。
          </p>
          <p className="text-lg">
            默认使用码码乐 AI 引擎生成剧情和分镜图，<br />
            我们的服务完全免费，请先登录以开启创作 👇
          </p>
          <div className="flex justify-center py-2">
            <Login />
          </div>
          <p className="mt-2 text-base text-[var(--text-muted)]">
            如果登录遇到问题，您也可以在 <SettingsDialog /> 中<br />
            配置您自己的 API 服务商。
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            此弹窗在您登录成功或配置外部引擎后将不再显示。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}