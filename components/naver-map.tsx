'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

interface MapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_TMAP_API_KEY ?? ''

declare global {
  interface Window {
    Tmapv2: {
      Map: new (el: HTMLElement, opts: Record<string, unknown>) => TmapMap
      Marker: new (opts: Record<string, unknown>) => TmapMarker
      LatLng: new (lat: number, lng: number) => TmapLatLng
      InfoWindow: new (opts: Record<string, unknown>) => TmapInfoWindow
      Point: new (x: number, y: number) => unknown
    }
  }
}

interface TmapLatLng { lat(): number; lng(): number }
interface TmapMap { setCenter(latlng: TmapLatLng): void; setZoom(z: number): void; destroy(): void }
interface TmapMarker { setMap(m: TmapMap | null): void; addListener(ev: string, fn: () => void): void }
interface TmapInfoWindow { setContent(html: string): void; setPosition(latlng: TmapLatLng): void; open(map: TmapMap): void; close(): void }

const SEOUL_LAT = 37.5326
const SEOUL_LNG = 126.9723

// SDK 로드 상태 — 모듈 수준 싱글톤 (HMR에서도 중복 로드 방지)
let sdkState: 'idle' | 'loading' | 'ready' = 'idle'
const sdkCallbacks: Array<() => void> = []

/** Tmapv2.LatLng가 실제로 노출될 때까지 최대 3초 polling 후 콜백 실행 */
function waitForTmapv2(onReady: () => void, deadline = Date.now() + 3000) {
  if (window.Tmapv2?.LatLng) { onReady(); return }
  if (Date.now() >= deadline) return
  setTimeout(() => waitForTmapv2(onReady, deadline), 100)
}

function loadTmapSdk(onReady: () => void) {
  if (sdkState === 'ready') { waitForTmapv2(onReady); return }
  sdkCallbacks.push(onReady)
  if (sdkState === 'loading') return
  sdkState = 'loading'
  const script = document.createElement('script')
  script.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${API_KEY}`
  script.async = true
  script.onload = () => {
    sdkState = 'ready'
    const pending = sdkCallbacks.splice(0)
    pending.forEach((cb) => waitForTmapv2(cb))
  }
  script.onerror = () => {
    sdkState = 'idle'
    sdkCallbacks.length = 0
  }
  document.head.appendChild(script)
}

// 마커·인포윈도우 HTML 생성 — 순수 함수이므로 컴포넌트 밖에 두어 재생성 비용 제거
function markerHtml(store: Store, isSelected: boolean): string {
  const bg = isSelected ? '#4F46E5' : store.isOpen ? '#22C55E' : '#475569'
  const border = isSelected ? '#818CF8' : store.isOpen ? '#16A34A' : '#334155'
  const shadow = isSelected ? ',0 0 0 3px rgba(79,70,229,0.4)' : ''
  return `<div style="background:${bg};border:2px solid ${border};border-radius:10px 10px 10px 2px;padding:5px 9px;font-size:11px;font-weight:700;color:#fff;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,0.6)${shadow};font-family:system-ui,-apple-system,sans-serif;cursor:pointer;">${store.name}</div>`
}

function infoHtml(store: Store): string {
  const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
  return `<div style="background:#1E293B;border:1px solid #334155;border-radius:12px;padding:12px 14px;min-width:190px;font-family:system-ui,-apple-system,sans-serif;pointer-events:none;">
    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#F8FAFC;">${store.name}</p>
    <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;line-height:1.4;">${store.address}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <span style="font-size:11px;font-weight:700;color:${statusColor};">${store.isOpen ? '영업 중' : '영업 종료'}</span>
      <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
      <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStockCount}종</span>
    </div>
  </div>`
}

export function NaverMap({ stores, selectedStoreId, onSelectStore, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<TmapMap | null>(null)
  const markersRef = useRef<Map<string, TmapMarker>>(new Map())
  const infoWinRef = useRef<TmapInfoWindow | null>(null)
  const myMarkerRef = useRef<TmapMarker | null>(null)
  const watchIdRef = useRef<number | null>(null)
  // stores/selectedStoreId를 ref로도 보관해 이벤트 클로저에서 최신값 참조
  const storesRef = useRef(stores)
  const onSelectRef = useRef(onSelectStore)
  useEffect(() => { storesRef.current = stores }, [stores])
  useEffect(() => { onSelectRef.current = onSelectStore }, [onSelectStore])

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<[number, number] | null>(null)
  const [noKey, setNoKey] = useState(false)

  // 지도 초기화 — 한 번만 실행
  useEffect(() => {
    if (!API_KEY) { setNoKey(true); return }
    if (typeof window === 'undefined' || !containerRef.current) return

    loadTmapSdk(() => {
      if (!containerRef.current || mapRef.current) return
      const T = window.Tmapv2
      if (!T) return

      const map = new T.Map(containerRef.current, {
        center: new T.LatLng(SEOUL_LAT, SEOUL_LNG),
        zoom: 13,
        width: '100%',
        height: '100%',
        mapType: 'NIGHT',
      })
      mapRef.current = map
      infoWinRef.current = new T.InfoWindow({
        position: new T.LatLng(SEOUL_LAT, SEOUL_LNG),
        content: '',
        border: '0px',
        background: 'transparent',
        offset: new T.Point(0, -8),
      })
      setMapReady(true)
    })

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      mapRef.current?.destroy()
      mapRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 내 위치 워치 시작 — mapReady 이후 한 번만
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setLocState('denied'); return }
    if (watchIdRef.current !== null) return
    setLocState('loading')
    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const T = window.Tmapv2
        if (!T || !mapRef.current) return
        const pos: [number, number] = [coords.latitude, coords.longitude]
        setMyPos(pos)
        setLocState('ok')
        const latlng = new T.LatLng(pos[0], pos[1])
        myMarkerRef.current?.setMap(null)
        myMarkerRef.current = new T.Marker({
          position: latlng,
          map: mapRef.current,
          iconHTML: `<div style="width:18px;height:18px;background:#F59E0B;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 2px 6px rgba(0,0,0,0.5);"></div>`,
          iconSize: new T.Point(18, 18),
          iconAnchor: new T.Point(9, 9),
        })
        mapRef.current.setCenter(latlng)
        mapRef.current.setZoom(14)
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, []) // 의존성 없음 — refs로 최신값 접근

  useEffect(() => {
    if (mapReady && locState === 'idle') startWatch()
  }, [mapReady, locState, startWatch])

  // 매장 마커 업데이트 — stores/selectedStoreId 변경 시만 실행
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const T = window.Tmapv2
    if (!T) return
    const map = mapRef.current

    // 변경된 마커만 교체 (전체 재생성 방지)
    const currentIds = new Set(stores.map((s) => s.id))

    // 삭제된 매장 마커 제거
    markersRef.current.forEach((m, id) => {
      if (!currentIds.has(id)) { m.setMap(null); markersRef.current.delete(id) }
    })

    // 추가/변경된 마커 업데이트
    for (const store of stores) {
      const isSelected = store.id === selectedStoreId
      const existing = markersRef.current.get(store.id)
      // 기존 마커 제거 후 재생성 (TMAP은 아이콘 변경 API 없음)
      existing?.setMap(null)
      const latlng = new T.LatLng(store.lat, store.lng)
      const marker = new T.Marker({
        position: latlng,
        map,
        iconHTML: markerHtml(store, isSelected),
        iconSize: new T.Point(120, 32),
        iconAnchor: new T.Point(0, 32),
        zIndex: isSelected ? 100 : 1,
      })
      marker.addListener('click', () => {
        onSelectRef.current(store.id)
        if (infoWinRef.current) {
          infoWinRef.current.setContent(infoHtml(store))
          infoWinRef.current.setPosition(latlng)
          infoWinRef.current.open(mapRef.current!)
        }
      })
      markersRef.current.set(store.id, marker)
    }
  }, [mapReady, stores, selectedStoreId])

  // 선택 매장 변경 시 지도 이동
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const T = window.Tmapv2
    if (!T) return
    const store = stores.find((s) => s.id === selectedStoreId)
    if (store) mapRef.current.setCenter(new T.LatLng(store.lat, store.lng))
  }, [selectedStoreId, mapReady, stores])

  const handleLocButton = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setLocState('idle')
    startWatch()
    if (myPos && mapRef.current) {
      const T = window.Tmapv2
      if (T) {
        mapRef.current.setCenter(new T.LatLng(myPos[0], myPos[1]))
        mapRef.current.setZoom(15)
      }
    }
  }, [myPos, startWatch])

  if (noKey) {
    return (
      <div className={`relative flex flex-col items-center justify-center gap-3 bg-[#0F172A] border border-[#334155] rounded-2xl ${className ?? ''}`}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="1.5" aria-hidden="true">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="2.5"/>
        </svg>
        <div className="text-center px-6">
          <p className="text-sm font-bold text-[#CBD5E1] mb-1">TMAP API 키 필요</p>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Settings → Vars에서<br/>
            <code className="text-[#818CF8]">NEXT_PUBLIC_TMAP_API_KEY</code>를 설정하세요
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <div ref={containerRef} className="w-full h-full" />

      {!mapReady && (
        <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center gap-2.5 z-10">
          <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          <span className="text-sm text-[#64748B]">지도 불러오는 중…</span>
        </div>
      )}

      {mapReady && (
        <div className="absolute top-3 left-3 z-[1100] bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
          <span className="text-[11px] font-bold text-[#CBD5E1]">게임샵 {stores.length}곳</span>
        </div>
      )}

      {mapReady && (
        <button
          type="button"
          onClick={handleLocButton}
          aria-label="내 위치로 이동"
          className="absolute top-3 right-3 z-[1100] w-8 h-8 rounded-lg bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] flex items-center justify-center shadow-md active:scale-95 transition-transform"
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

      {locState === 'ok' && mapReady && (
        <div className="absolute top-3 right-14 z-[1100] bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-[#F59E0B]">내 위치 확인됨</span>
        </div>
      )}
    </div>
  )
}
