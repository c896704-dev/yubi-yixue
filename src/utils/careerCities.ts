import type { AnalysisResult } from '../types'
import { analyzeCareer } from './persona'
import { RECOMMENDED_CITIES } from './cityData'

export interface CareerCityMarker {
  name: string
  lng: number
  lat: number
}

/**
 * 事业前程推荐城市 → 地图坐标。
 * 坐标来自 cityData 的推荐城市表；若名称是“北京”等旧写法，自动匹配“北京城区”。
 */
export function getCareerCityMarkers(result: AnalysisResult): CareerCityMarker[] {
  const career = analyzeCareer(result)
  const markers: CareerCityMarker[] = []

  for (const cityName of career.bestCities) {
    const hit = RECOMMENDED_CITIES.find((c) => c.name === cityName || c.name.startsWith(cityName))
    if (!hit) continue
    markers.push({
      name: cityName,
      lng: hit.lng,
      lat: hit.lat,
    })
  }

  return markers
}
