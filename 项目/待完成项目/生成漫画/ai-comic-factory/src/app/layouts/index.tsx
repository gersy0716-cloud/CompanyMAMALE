"use client"

import { StaticImageData } from "next/image"

import { Panel } from "@/app/interface/panel"
import { pick } from "@/lib/pick"
import { Grid } from "@/app/interface/grid"
import { LayoutProps } from "@/types"

import layoutPreview0 from "../../../public/layouts/layout0.jpg"
import layoutPreview1 from "../../../public/layouts/layout1.jpg"
import layoutPreview2 from "../../../public/layouts/layout2.jpg"
import layoutPreview3 from "../../../public/layouts/layout3.jpg"

export function Layout0({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-2 grid-rows-2">
      <div className="bg-stone-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-zinc-100  col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-gray-100  col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-slate-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={900}
          height={900}
        />
      </div>
    </Grid>
  )
}

export function Layout1({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-2 grid-rows-3">
      <div className="bg-stone-100 row-span-1 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={1200}
          height={675}
        />
      </div>
      <div className="bg-zinc-100 row-span-2 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={900}
          height={1350}
        />
      </div>
      <div className="bg-gray-100 row-span-2 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={900}
          height={1350}
        />
      </div>
      <div className="bg-slate-100 row-span-1 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={1200}
          height={675}
        />
      </div>
    </Grid>
  )
}

export function Layout2({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-3 grid-rows-2">
      <div className="bg-zinc-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={750}
          height={750}
        />
      </div>
      <div className="bg-zinc-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={750}
          height={750}
        />
      </div>
      <div className="bg-stone-100 row-span-2 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={600}
          height={1350}
        />
      </div>
      <div className="bg-slate-100 row-span-1 col-span-2">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={1200}
          height={675}
        />
      </div>
    </Grid>
  )
}

export function Layout3({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-3 grid-rows-2">
      <div className="bg-zinc-100 col-span-2 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={1200}
          height={675}
        />
      </div>
      <div className="bg-zinc-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={600}
          height={675}
        />
      </div>
      <div className="bg-stone-100 row-span-1 col-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={600}
          height={675}
        />
      </div>
      <div className="bg-slate-100 row-span-1 col-span-2">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={1200}
          height={675}
        />
      </div>
    </Grid>
  )
}

// cinema style: 1 large top + 3 small bottom
export function Layout4({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-3 grid-rows-2">
      <div className="bg-zinc-100 col-span-3 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={1200}
          height={600}
        />
      </div>
      <div className="bg-zinc-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={400}
          height={400}
        />
      </div>
      <div className="bg-stone-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={400}
          height={400}
        />
      </div>
      <div className="bg-slate-100 col-span-1 row-span-1">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={400}
          height={400}
        />
      </div>
    </Grid>
  )
}

// squares + horizontal
export function Layout5({ page, nbPanels }: LayoutProps) {
  return (
    <Grid className="grid-cols-4 grid-rows-4">
      <div className="bg-zinc-100">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={0}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-zinc-100">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={1}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-stone-100">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={2}
          width={900}
          height={900}
        />
      </div>
      <div className="bg-slate-100">
        <Panel
          page={page}
          nbPanels={nbPanels}
          panel={3}
          width={900}
          height={900}
        />
      </div>
    </Grid>
  )
}

// export const layouts = { Layout1, Layout2_todo, Layout3_todo, Layout4_todo, Layout2, Layout3 }
export const allLayouts = {
  random: <></>,
  Layout0,
  Layout1,
  Layout2,
  Layout3,
  Layout4
}

export const allLayoutLabels = {
  random: "随机布局",
  Layout0: "四格矩阵 (2x2)",
  Layout1: "三格对角 (2x3)",
  Layout2: "宽窄组合 (3x2)",
  Layout3: "经典跨版 (3x2)",
  Layout4: "电影感 (1+3)",
}

// note for reference: A4 (297mm x 210mm)
export const allLayoutAspectRatios = {
  Layout0: "aspect-[297/210]",
  Layout1: "aspect-[297/210]",
  Layout2: "aspect-[297/210]",
  Layout3: "aspect-[297/210]",
  Layout4: "aspect-[297/210]",
}

export type LayoutName = keyof typeof allLayouts

export const defaultLayout: LayoutName = "Layout1"

export type LayoutCategory = "square" | "fluid"

export const nonRandomLayouts = Object.keys(allLayouts).filter(layout => layout !== "random")

export const getRandomLayoutName = (): LayoutName => {
  return pick(nonRandomLayouts) as LayoutName
}

export function getRandomLayoutNames(): LayoutName[] {
  return nonRandomLayouts.sort(() => Math.random() - 0.5) as LayoutName[]
}

export const layoutIcons: Partial<Record<LayoutName, StaticImageData>> = {
  Layout0: layoutPreview0,
  Layout1: layoutPreview1,
  Layout2: layoutPreview2,
  Layout3: layoutPreview3,
  Layout4: undefined,
}
