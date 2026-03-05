
import { ComponentProps } from "react"
import Script from "next/script"

import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import Main from "./main"

// https://nextjs.org/docs/pages/building-your-application/optimizing/fonts 

export default async function IndexPage() {
  return (
    <>
      <main className={cn(
        `light fixed inset-0 w-screen h-screen flex flex-col items-center`,
        `bg-zinc-50 text-stone-900 overflow-y-scroll`,

        // important: in "print" mode we need to allow going out of the screen
        `inset-auto print:h-auto print:w-auto print:overflow-visible print:relative print:flex-none`
      )}>
        <TooltipProvider delayDuration={100}>
          <Main />
        </TooltipProvider>

        <Script src="https://www.googletagmanager.com/gtag/js?id=GTM-WH4MGSHS" />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'GTM-WH4MGSHS');
          `}
        </Script>
      </main>
    </>
  )
}