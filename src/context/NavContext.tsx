import { createContext, useContext } from 'react'

/** 轻量导航总线：壳层注入 tab 切换函数，任意页面组件可跳转 */
export type AppTab = 'home' | 'bazi' | 'compat' | 'fengshui' | 'divination' | 'almanac' | 'shensha' | 'me'

const NavContext = createContext<(tab: AppTab) => void>(() => {})

export const NavProvider = NavContext.Provider

export function useNav() {
  return useContext(NavContext)
}
