'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import type { Store } from '@/lib/data'

interface GoogleMapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// 서울 중심 좌표 (기본값)
const SEOUL: google.maps.LatLngLiteral = { lat: 37.5326, lng: 126.9723 }

// 다크 테마 맵 스타일
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#263347' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1929' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#172033' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#122a1a' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#172033' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
]

function makeMarkerEl(store: Store, isSelected: boolean): HTMLElement {
  const bg = isSelected ? '#4F46E5' : store.isOpen ? '#22C55E' : '#475569'
  const border = isSelected ? '#818CF8' : store.isOpen ? '#16A34A' : '#334155'
  const el = document.createElement('div')
  el.style.cssText = `
    background:${bg};
    border:2px solid ${border};
    border-radius:10px 10px 10px 2px;
    padding:5px 9px;
    font-size:11px;
    font-weight:700;
    color:#fff;
    white-space:nowrap;
    box-shadow:0 3px 10px rgba(0,0,0,0.6)${isSelected ? ',0 0 0 3px rgba(79,70,229,0.4)' : ''};
    cursor:pointer;
    transform:${isSelected ? 'scale(1.15)' : 'scale(1)'};
    letter-spacing:-0.2px;
    font-family:system-ui,-apple-system,sans-serif;
    transition:transform 0.15s;
  `
  el.textContent = store.name
  return el
}

function makeMyLocEl(): HTMLElement {
  const el = document.createElement('div')
  el.style.cssText = `
    width:20px;height:20px;
    background:#F59E0B;
    border:3px solid #fff;
    border-radius:50%;
    box-shadow:0 0 0 5px rgba(245,158,11,0.25),0 2px 8px rgba(0,0,0,0.5);
  `
  return el
}

function infoContent(store: Store): string {
  const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
  const statusText = store.isOpen ? '영업 중' : '영업 종료'
  return `
    <div style="
      background:#1E293B;
      border:1px solid #334155;
      border-radius:12px;
      padding:12px 14px;
      min-width:190px;
      max-width:240px;
      font-family:system-ui,-apple-system,sans-serif;
      box-shadow:0 4px 20px rgba(0,0,0,0.6);
    ">
      <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#F8FAFC;">${store.name}</p>
      <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;line-height:1.4;">${store.address}</p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:${statusColor};">${statusText}</span>
        <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
        <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStockCount}종</span>
      </div>
      ${store.phone ? `<p style="margin:6px 0 0;font-size:11px;color:#64748B;">${store.phone}</p>` : ''}
    </div>
  `
}

export function NaverMap({ stores, selectedStoreId, onSelectStore, className }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const myMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)
  const infoRef = useRef<google.maps.InfoWindow | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<google.maps.LatLngLiteral | null>(null)

  // --- 지도 초기화 ---
  useEffect(() => {
    if (!API_KEY || !containerRef.current || mapRef.current) return

    setOptions({ key: API_KEY, v: 'weekly', language: 'ko', region: 'KR' })

    ;(async () => {
      const { Map, InfoWindow } = await importLibrary('maps') as google.maps.MapsLibrary
      if (!containerRef.current) return
      mapRef.current = new Map(containerRef.current, {
        center: SEOUL,
        zoom: 13,
        mapId: 'TREASURE_BOX_DARK',
        styles: DARK_STYLE,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        clickableIcons: false,
      })
      infoRef.current = new InfoWindow({ content: '', disableAutoPan: false })
      mapRef.current.addListener('click', () => infoRef.current?.close())
      setMapReady(true)
    })()

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  // --- 내 위치 실시간 추적 ---
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setLocState('denied'); return }
    if (watchIdRef.current !== null) return // 이미 감시 중
    setLocState('loading')
    watchIdRef.current = navigator.geolocation.watchPosition(
      async ({ coords }) => {
        const pos: google.maps.LatLngLiteral = { lat: coords.latitude, lng: coords.longitude }
        setMyPos(pos)
        setLocState('ok')
        const map = mapRef.current
        if (!map) return
        const { AdvancedMarkerElement } = await importLibrary('marker') as google.maps.MarkerLibrary
        if (myMarkerRef.current) {
          myMarkerRef.current.position = pos
        } else {
          myMarkerRef.current = new AdvancedMarkerElement({
            map, position: pos,
            content: makeMyLocEl(),
            zIndex: 200, title: '내 위치',
          })
          map.panTo(pos)
          map.setZoom(14)
        }
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, maximumAge: 5000 },
    )
  }, [])

  // 지도 준비되면 자동 위치 추적
  useEffect(() => {
    if (mapReady && locState === 'idle') startWatch()
  }, [mapReady, locState, startWatch])

  // --- 매장 마커 렌더링 ---
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    ;(async () => {
      const { AdvancedMarkerElement } = await importLibrary('marker') as google.maps.MarkerLibrary
      const map = mapRef.current!
      markersRef.current.forEach((m) => { m.map = null })
      markersRef.current.clear()

      for (const store of stores) {
        const isSelected = store.id === selectedStoreId
        const marker = new AdvancedMarkerElement({
          map,
          position: { lat: store.lat, lng: store.lng },
          content: makeMarkerEl(store, isSelected),
          zIndex: isSelected ? 100 : 10,
          title: store.name,
        })
        marker.addListener('click', () => {
          onSelectStore(store.id)
          infoRef.current?.setContent(infoContent(store))
          infoRef.current?.open({ map, anchor: marker })
        })
        markersRef.current.set(store.id, marker)
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, stores, selectedStoreId])

  // 선택 매장 변경 시 지도 중심 이동
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const store = stores.find((s) => s.id === selectedStoreId)
    if (store) {
      mapRef.current.panTo({ lat: store.lat, lng: store.lng })
      mapRef.current.setZoom(15)
    }
  }, [selectedStoreId, mapReady, stores])

  // --- API 키 없음 안내 ---
  if (!API_KEY) {
    return (
      <div className={`${className ?? ''} bg-[#1E293B] border border-[#334155] rounded-2xl flex flex-col items-center justify-center gap-3 px-6`}>
        <div className="w-10 h-10 rounded-full bg-[#263347] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#F8FAFC]">Google Maps API 키 필요</p>
          <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
            Google Cloud Console에서 발급 후<br />
            <code className="text-[#818CF8] text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code><br />
            환경변수를 설정하세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className ?? ''}`}>
      {/* 실제 지도 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center gap-2.5">
          <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          <span className="text-sm text-[#64748B]">지도 불러오는 중…</span>
        </div>
      )}

      {/* 매장 수 배지 */}
      {mapReady && (
        <div className="absolute top-3 left-3 z-10 bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] flex-shrink-0" />
          <span className="text-[11px] font-bold text-[#CBD5E1]">게임샵 {stores.length}곳</span>
        </div>
      )}

      {/* 내 위치 확인 배지 */}
      {locState === 'ok' && myPos && mapReady && (
        <div className="absolute top-3 right-12 z-10 bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-[#F59E0B]">내 위치 확인됨</span>
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
            startWatch()
            if (myPos && mapRef.current) {
              mapRef.current.panTo(myPos)
              mapRef.current.setZoom(14)
            }
          }}
          aria-label="내 위치로 이동"
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          {locState === 'loading' ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          ) : (
            <svg
              width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke={locState === 'ok' ? '#F59E0B' : locState === 'denied' ? '#EF4444' : '#818CF8'}
              strokeWidth="2.5" aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}
