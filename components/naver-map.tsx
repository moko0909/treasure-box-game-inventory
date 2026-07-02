'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

// --- 네이버 지도 API 전역 타입 선언 ---
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (el: HTMLElement, opts: object) => NaverMapInstance
        LatLng: new (lat: number, lng: number) => NaverLatLng
        Marker: new (opts: object) => NaverMarker
        InfoWindow: new (opts: object) => NaverInfoWindow
        Event: {
          addListener: (target: object, event: string, cb: () => void) => void
          removeListener: (listener: object) => void
        }
        Size: new (w: number, h: number) => object
        Point: new (x: number, y: number) => object
      }
    }
  }
}
interface NaverMapInstance {
  setCenter: (coord: NaverLatLng) => void
  setZoom: (zoom: number) => void
  destroy: () => void
}
interface NaverLatLng { lat: () => number; lng: () => number }
interface NaverMarker {
  setMap: (map: NaverMapInstance | null) => void
  setIcon: (icon: object) => void
  getPosition: () => NaverLatLng
}
interface NaverInfoWindow {
  open: (map: NaverMapInstance, marker: NaverMarker) => void
  close: () => void
  setContent: (html: string) => void
}
// -----------------------------------------------

interface NaverMapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

const CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID

// 서울 중심 좌표 (API 키 없을 때 기본값)
const SEOUL_CENTER = { lat: 37.5400, lng: 126.9921 }

// 마커 SVG HTML 생성 헬퍼 (DOM에서 `innerHTML`로 사용)
function makeMarkerIcon(isOpen: boolean, isSelected: boolean, label: string) {
  const bg = isSelected ? '#4F46E5' : isOpen ? '#22C55E' : '#475569'
  const border = isSelected ? '#818CF8' : isOpen ? '#16A34A' : '#334155'
  const shadow = isSelected ? '0 0 0 3px rgba(79,70,229,0.35)' : 'none'
  return (
    `<div style="
      background:${bg};
      border:2px solid ${border};
      border-radius:10px 10px 10px 2px;
      padding:5px 8px;
      font-size:11px;
      font-weight:700;
      color:#fff;
      white-space:nowrap;
      box-shadow:0 2px 8px rgba(0,0,0,0.5),${shadow};
      cursor:pointer;
      transform:scale(${isSelected ? 1.15 : 1});
      transition:transform 0.15s;
      letter-spacing:-0.2px;
    ">${label}</div>`
  )
}

function makeMyLocationIcon() {
  return (
    `<div style="
      width:20px;height:20px;
      background:#F59E0B;
      border:3px solid #fff;
      border-radius:50%;
      box-shadow:0 0 0 4px rgba(245,158,11,0.3),0 2px 8px rgba(0,0,0,0.4);
    "></div>`
  )
}

function infoHtml(store: Store, inStockCount: number) {
  const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
  const statusText = store.isOpen ? '영업 중' : '영업 종료'
  return `
    <div style="
      background:#1E293B;
      border:1px solid #334155;
      border-radius:12px;
      padding:12px 14px;
      min-width:180px;
      font-family:system-ui,-apple-system,sans-serif;
    ">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#F8FAFC;">${store.name}</p>
      <p style="margin:0 0 6px;font-size:11px;color:#94A3B8;line-height:1.4;">${store.address}</p>
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:${statusColor};">${statusText}</span>
        <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
        <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStockCount}종</span>
      </div>
    </div>
  `
}

export function NaverMap({ stores, selectedStoreId, onSelectStore, className }: NaverMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<NaverMapInstance | null>(null)
  const markersRef = useRef<{ id: string; marker: NaverMarker }[]>([])
  const myLocMarkerRef = useRef<NaverMarker | null>(null)
  const infoWindowRef = useRef<NaverInfoWindow | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)
  const [initError, setInitError] = useState<string | null>(null)

  // --- 네이버 지도 스크립트 동적 로드 ---
  useEffect(() => {
    if (!CLIENT_ID) {
      setInitError('no-key')
      return
    }
    if (window.naver?.maps) {
      setMapReady(true)
      return
    }
    const existing = document.getElementById('naver-map-sdk')
    if (existing) {
      existing.addEventListener('load', () => setMapReady(true))
      return
    }
    const script = document.createElement('script')
    script.id = 'naver-map-sdk'
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${CLIENT_ID}`
    script.async = true
    script.onload = () => setMapReady(true)
    script.onerror = () => setInitError('load-error')
    document.head.appendChild(script)
  }, [])

  // --- 지도 초기화 ---
  useEffect(() => {
    if (!mapReady || !containerRef.current || mapRef.current) return
    const center = new window.naver.maps.LatLng(SEOUL_CENTER.lat, SEOUL_CENTER.lng)
    mapRef.current = new window.naver.maps.Map(containerRef.current, {
      center,
      zoom: 13,
      scaleControl: false,
      logoControl: true,
      mapDataControl: false,
      zoomControl: false,
      mapTypeControl: false,
    })
    infoWindowRef.current = new window.naver.maps.InfoWindow({
      content: '',
      borderWidth: 0,
      backgroundColor: 'transparent',
      disableAnchor: true,
      pixelOffset: new window.naver.maps.Point(0, -8),
    })
    // 지도 클릭 시 infoWindow 닫기
    window.naver.maps.Event.addListener(mapRef.current, 'click', () => {
      infoWindowRef.current?.close()
    })
  }, [mapReady])

  // --- 매장 마커 갱신 ---
  const updateMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map || !window.naver?.maps) return

    // 기존 마커 제거
    markersRef.current.forEach(({ marker }) => marker.setMap(null))
    markersRef.current = []

    stores.forEach((store) => {
      const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
      const isSelected = store.id === selectedStoreId
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(store.lat, store.lng),
        map,
        icon: {
          content: makeMarkerIcon(store.isOpen, isSelected, store.name),
          anchor: new window.naver.maps.Point(0, 32),
        },
        zIndex: isSelected ? 100 : 10,
      })
      window.naver.maps.Event.addListener(marker, 'click', () => {
        onSelectStore(store.id)
        infoWindowRef.current?.setContent(infoHtml(store, inStockCount))
        infoWindowRef.current?.open(map, marker)
      })
      markersRef.current.push({ id: store.id, marker })
    })
  }, [stores, selectedStoreId, onSelectStore])

  useEffect(() => { updateMarkers() }, [updateMarkers])

  // 선택된 매장이 바뀌면 해당 마커 아이콘 업데이트 + 지도 중심 이동
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.naver?.maps) return
    const selectedStore = stores.find((s) => s.id === selectedStoreId)
    markersRef.current.forEach(({ id, marker }) => {
      const store = stores.find((s) => s.id === id)
      if (!store) return
      marker.setIcon({
        content: makeMarkerIcon(store.isOpen, id === selectedStoreId, store.name),
        anchor: new window.naver.maps.Point(0, 32),
      })
    })
    if (selectedStore) {
      map.setCenter(new window.naver.maps.LatLng(selectedStore.lat, selectedStore.lng))
      map.setZoom(15)
    }
  }, [selectedStoreId, stores])

  // --- 내 위치 감지 ---
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) { setLocState('denied'); return }
    setLocState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setMyPos({ lat, lng })
        setLocState('ok')
        const map = mapRef.current
        if (!map || !window.naver?.maps) return
        // 내 위치 마커
        if (myLocMarkerRef.current) myLocMarkerRef.current.setMap(null)
        myLocMarkerRef.current = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map,
          icon: {
            content: makeMyLocationIcon(),
            anchor: new window.naver.maps.Point(10, 10),
          },
          zIndex: 200,
        })
        map.setCenter(new window.naver.maps.LatLng(lat, lng))
        map.setZoom(14)
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // 지도 로드되면 자동 위치 요청
  useEffect(() => {
    if (mapReady && locState === 'idle') locateMe()
  }, [mapReady, locState, locateMe])

  // --- cleanup ---
  useEffect(() => {
    return () => {
      markersRef.current.forEach(({ marker }) => marker.setMap(null))
      myLocMarkerRef.current?.setMap(null)
      mapRef.current?.destroy()
      mapRef.current = null
    }
  }, [])

  // --- API 키 없음 안내 ---
  if (initError === 'no-key') {
    return (
      <div className={`${className ?? ''} bg-[#1E293B] border border-[#334155] rounded-2xl flex flex-col items-center justify-center gap-3 px-6`}>
        <div className="w-10 h-10 rounded-full bg-[#263347] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-[#F8FAFC]">네이버 지도 API 키 필요</p>
          <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
            NCP 콘솔에서 발급 후<br />
            <code className="text-[#818CF8]">NEXT_PUBLIC_NAVER_MAP_CLIENT_ID</code><br />
            환경변수를 설정하세요.
          </p>
        </div>
      </div>
    )
  }

  if (initError === 'load-error') {
    return (
      <div className={`${className ?? ''} bg-[#1E293B] border border-[#334155] rounded-2xl flex items-center justify-center`}>
        <p className="text-sm text-[#EF4444]">지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
      </div>
    )
  }

  return (
    <div className={`relative rounded-2xl overflow-hidden ${className ?? ''}`}>
      {/* 실제 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#1E293B] flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          <span className="text-sm text-[#64748B]">지도 로딩 중…</span>
        </div>
      )}

      {/* 내 위치 버튼 */}
      <button
        type="button"
        onClick={locateMe}
        aria-label="내 위치로 이동"
        className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-xl bg-[#1E293B]/90 border border-[#334155] backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        {locState === 'loading' ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={locState === 'ok' ? '#F59E0B' : locState === 'denied' ? '#EF4444' : '#818CF8'}
            strokeWidth="2.5"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        )}
      </button>

      {/* 매장 수 배지 */}
      <div className="absolute top-3 left-3 z-10 bg-[#1E293B]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
        <span className="text-[11px] font-bold text-[#CBD5E1]">매장 {stores.length}곳</span>
      </div>

      {/* 내 위치 좌표 (성공 시) */}
      {locState === 'ok' && myPos && (
        <div className="absolute top-3 right-3 z-10 bg-[#1E293B]/90 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1">
          <span className="text-[10px] font-bold text-[#F59E0B]">내 위치 확인됨</span>
        </div>
      )}
    </div>
  )
}
