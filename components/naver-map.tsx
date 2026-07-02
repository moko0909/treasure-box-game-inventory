'use client'

// Leaflet + CartoDB Dark Matter (API 키 불필요)
import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

interface MapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

// 서울 중심 좌표
const SEOUL: [number, number] = [37.5326, 126.9723]

export function NaverMap({ stores, selectedStoreId, onSelectStore, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const markersRef = useRef<Map<string, import('leaflet').Marker>>(new Map())
  const myMarkerRef = useRef<import('leaflet').CircleMarker | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<[number, number] | null>(null)

  // 마커 아이콘 생성
  const makeIcon = useCallback((store: Store, isSelected: boolean) => {
    if (typeof window === 'undefined') return undefined
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const bg = isSelected ? '#4F46E5' : store.isOpen ? '#22C55E' : '#475569'
    const border = isSelected ? '#818CF8' : store.isOpen ? '#16A34A' : '#334155'
    const scale = isSelected ? 1.15 : 1
    const html = `
      <div style="
        background:${bg};
        border:2px solid ${border};
        border-radius:10px 10px 10px 2px;
        padding:5px 9px;
        font-size:11px;
        font-weight:700;
        color:#fff;
        white-space:nowrap;
        box-shadow:0 3px 10px rgba(0,0,0,0.6)${isSelected ? ',0 0 0 3px rgba(79,70,229,0.4)' : ''};
        transform:scale(${scale});
        transform-origin:left bottom;
        letter-spacing:-0.2px;
        font-family:system-ui,-apple-system,sans-serif;
      ">${store.name}</div>`
    return L.divIcon({ html, className: '', iconAnchor: [0, 0] })
  }, [])

  // 인포팝업 HTML
  const infoHtml = useCallback((store: Store): string => {
    const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
    const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
    return `
      <div style="background:#1E293B;border:1px solid #334155;border-radius:12px;padding:12px 14px;min-width:190px;font-family:system-ui,-apple-system,sans-serif;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#F8FAFC;">${store.name}</p>
        <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;line-height:1.4;">${store.address}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
          <span style="font-size:11px;font-weight:700;color:${statusColor};">${store.isOpen ? '영업 중' : '영업 종료'}</span>
          <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
          <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStockCount}종</span>
        </div>
      </div>`
  }, [])

  // 지도 초기화 (클라이언트 전용)
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || mapRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')

    // Leaflet 기본 아이콘 경로 수정
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const map = L.map(containerRef.current, {
      center: SEOUL,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    })

    // CartoDB Dark Matter — API 키 불필요
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 19, subdomains: 'abcd' }
    ).addTo(map)

    // 작은 attribution
    L.control.attribution({ position: 'bottomright', prefix: false })
      .addTo(map)
      .setPrefix('<span style="color:#475569;font-size:9px">© CartoDB © OSM</span>')

    mapRef.current = map
    setMapReady(true)

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      map.remove()
      mapRef.current = null
    }
  }, [])

  // 내 위치 실시간 추적
  const startWatch = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) { setLocState('denied'); return }
    if (watchIdRef.current !== null) return
    setLocState('loading')
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        if (typeof window === 'undefined') return
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const L = require('leaflet') as typeof import('leaflet')
        const pos: [number, number] = [coords.latitude, coords.longitude]
        setMyPos(pos)
        setLocState('ok')
        const map = mapRef.current
        if (!map) return
        if (myMarkerRef.current) {
          myMarkerRef.current.setLatLng(pos)
        } else {
          myMarkerRef.current = L.circleMarker(pos, {
            radius: 9,
            fillColor: '#F59E0B',
            fillOpacity: 1,
            color: '#fff',
            weight: 3,
            className: 'my-loc-pulse',
          }).addTo(map)
          map.panTo(pos)
          map.setZoom(14)
        }
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [])

  useEffect(() => {
    if (mapReady && locState === 'idle') startWatch()
  }, [mapReady, locState, startWatch])

  // 매장 마커 업데이트
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet') as typeof import('leaflet')
    const map = mapRef.current

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    for (const store of stores) {
      const isSelected = store.id === selectedStoreId
      const icon = makeIcon(store, isSelected)
      const marker = L.marker([store.lat, store.lng], { icon, zIndexOffset: isSelected ? 1000 : 0 })
        .addTo(map)
        .bindPopup(infoHtml(store), {
          className: 'leaflet-dark-popup',
          closeButton: false,
          offset: [0, -4],
        })
        .on('click', () => {
          onSelectStore(store.id)
          marker.openPopup()
        })
      markersRef.current.set(store.id, marker)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, stores, selectedStoreId])

  // 선택 매장 변경 시 지도 이동
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const store = stores.find((s) => s.id === selectedStoreId)
    if (store) {
      mapRef.current.panTo([store.lat, store.lng])
    }
  }, [selectedStoreId, mapReady, stores])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      {/* 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center gap-2.5">
          <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          <span className="text-sm text-[#64748B]">지도 불러오는 중…</span>
        </div>
      )}

      {/* 게임샵 수 배지 */}
      {mapReady && (
        <div className="absolute top-3 left-3 z-[400] bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
          <span className="text-[11px] font-bold text-[#CBD5E1]">게임샵 {stores.length}곳</span>
        </div>
      )}

      {/* 내 위치 버튼 */}
      {mapReady && (
        <button
          type="button"
          onClick={() => {
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current)
              watchIdRef.current = null
            }
            setLocState('idle')
            startWatch()
            if (myPos && mapRef.current) {
              mapRef.current.panTo(myPos)
              mapRef.current.setZoom(15)
            }
          }}
          aria-label="내 위치로 이동"
          className="absolute top-3 right-3 z-[400] w-8 h-8 rounded-lg bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          {locState === 'loading' ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke={locState === 'ok' ? '#F59E0B' : locState === 'denied' ? '#EF4444' : '#818CF8'}
              strokeWidth="2.5" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
      )}

      {/* 내 위치 확인 배지 */}
      {locState === 'ok' && mapReady && (
        <div className="absolute top-3 right-14 z-[400] bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-[#F59E0B]">내 위치 확인됨</span>
        </div>
      )}
    </div>
  )
}
