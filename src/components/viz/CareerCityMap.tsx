import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { AnalysisResult } from '../../types'
import { getCareerCityMarkers } from '../../utils/careerCities'

/**
 * 事业前程推荐城市地图。
 * 使用第三方地图库 Leaflet 渲染，底图为高德公开瓦片服务（无需 API Key）。
 */
export function CareerCityMap({ result }: { result: AnalysisResult }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const markers = getCareerCityMarkers(result)
    const map = L.map(containerRef.current, {
      center: [34.5, 108.5],
      zoom: 4,
      zoomControl: true,
      attributionControl: true,
    })
    mapRef.current = map

    L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
      subdomains: ['1', '2', '3', '4'],
      maxZoom: 13,
      minZoom: 3,
      attribution: '© 高德地图',
    }).addTo(map)
    map.attributionControl.setPrefix(false)

    const layerGroup = L.layerGroup().addTo(map)
    for (const city of markers) {
      const icon = L.divIcon({
        className: 'career-city-marker',
        html: `<span class="career-city-pin">${city.name}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 10],
      })
      L.marker([city.lat, city.lng], { icon, title: city.name }).addTo(layerGroup)
    }

    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng] as [number, number]))
      map.fitBounds(bounds.pad(0.18))
    }

    // 在折叠章节展开动画结束后重新计算尺寸
    const timer = window.setTimeout(() => map.invalidateSize(), 250)
    return () => {
      window.clearTimeout(timer)
      map.remove()
      mapRef.current = null
    }
  }, [result])

  return <div ref={containerRef} className="career-city-map" aria-label="推荐发展城市地图" />
}
