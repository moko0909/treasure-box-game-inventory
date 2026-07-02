'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

// Google Maps JS API 추가 전역 선언 (@types/google.maps 가 google 네임스페이스를 제공함)
declare global {
  interface Window {
    __googleMapsLoaded?: boolean
    __googleMapsCallbacks?: (() => void)[]
    initGoogleMaps?: () => void
  }
}

interface GoogleMapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

// 서울 중심 좌표 (기본값)
const SEOUL_CENTER = { lat: 37.5400, lng: 126.9921 }

// 커스텀 마커 SVG — 말풍선형
function makeMarkerSvg(isOpen: boolean, isSelected: boolean): string {
  const fill = isSelected ? '#4F46E5' : isOpen ? '#22C55E' : '#475569'
  const stroke = isSelected ? '#818CF8' : isOpen ? '#16A34A' : '#64748B'
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z"
        fill="${fill}" stroke="${stroke}" stroke-width="2"/>
      <circle cx="14" cy="14" r="5" fill="white" opacity="0.9"/>
    </svg>
  `
}

function makeMyLocationSvg(): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="white" stroke-width="3" opacity="0.95"/>
      <circle cx="12" cy="12" r="4" fill="white"/>
    </svg>
  `
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
}

function infoWindowContent(store: Store): string {
  const inStockCount = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
  const statusText = store.isOpen ? '영업 중' : '영업 종료'
  const ratingStars = '★'.repeat(Math.round(store.rating))
  return `
    <div style="
      background:#1E293B;
      border:1px solid #334155;
      border-radius:14px;
      padding:14px 16px;
      min-width:200px;
      max-width:240px;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      box-shadow:0 8px 24px rgba(0,0,0,0.4);
    ">
      <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#F8FAFC;line-height:1.3;">${store.name}</p>
      <p style="margin:0 0 8px;font-size:11px;color:#64748B;line-height:1.4;">${store.address}</p>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:${statusColor};">${statusText}</span>
        <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
        <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStockCount}종</span>
      </div>
      <div style="margin-top:6px;display:flex;align-items:center;gap:4px;">
        <span style="font-size:11px;color:#F59E0B;">${ratingStars}</span>
        <span style="font-size:11px;color:#94A3B8;">${store.rating} (${store.reviewCount}개 리뷰)</span>
      </div>
    </div>
  `
}

export function GoogleMap({ stores, selectedStoreId, onSelectStore, className }: GoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const myLocMarkerRef = useRef<google.maps.Marker | null>(null)
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)

  // Google Maps 스크립트 동적 로드
  useEffect(() => {
    if (!API_KEY) return

    // 이미 로드된 경우
    if (window.__googleMapsLoaded) {
      setMapReady(true)
      return
    }

    // 콜백 큐 초기화
    if (!window.__googleMapsCallbacks) {
      window.__googleMapsCallbacks = []
    }
    window.__googleMapsCallbacks.push(() => setMapReady(true))

    // 이미 스크립트 태그가 있으면 콜백만 등록
    if (document.getElementById('google-maps-sdk')) return

    // 전역 콜백 함수
    window.initGoogleMaps = () => {
      window.__googleMapsLoaded = true
      window.__googleMapsCallbacks?.forEach((cb) => cb())
      window.__googleMapsCallbacks = []
    }

    const script = document.createElement('script')
    script.id = 'google-maps-sdk'
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&callback=initGoogleMaps&language=ko&region=KR`
    script.async = true
    script.defer = true
    document.head.appendChild(script)
  }, [])

  // 지도 초기화
  useEffect(() => {
    if (!mapReady || !containerRef.current || mapRef.current) return

    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: SEOUL_CENTER,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#1E293B' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#94A3B8' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#0F172A' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1E293B' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#4F46E5' }, { lightness: -40 }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0F172A' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2940' }, { visibility: 'on' }] },
        { featureType: 'transit', stylers: [{ visibility: 'simplified' }] },
        { featureType: 'transit.station', elementType: 'labels.text.fill', stylers: [{ color: '#818CF8' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#334155' }] },
        { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#CBD5E1' }] },
      ],
    })

    infoWindowRef.current = new window.google.maps.InfoWindow({
      disableAutoPan: false,
    })

    // 지도 클릭 시 infoWindow 닫기
    mapRef.current.addListener('click', () => {
      infoWindowRef.current?.close()
    })
  }, [mapReady])

  // 매장 마커 갱신
  const updateMarkers = useCallback(() => {
    const map = mapRef.current
    if (!map || !window.google?.maps) return

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    stores.forEach((store) => {
      const isSelected = store.id === selectedStoreId
      const marker = new window.google.maps.Marker({
        position: { lat: store.lat, lng: store.lng },
        map,
        icon: {
          url: svgToDataUrl(makeMarkerSvg(store.isOpen, isSelected)),
          scaledSize: new window.google.maps.Size(isSelected ? 36 : 28, isSelected ? 46 : 36),
          anchor: new window.google.maps.Point(isSelected ? 18 : 14, isSelected ? 46 : 36),
        },
        zIndex: isSelected ? 100 : 10,
        title: store.name,
      })

      marker.addListener('click', () => {
        onSelectStore(store.id)
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(infoWindowContent(store))
          infoWindowRef.current.open(map, marker)
        }
      })

      markersRef.current.set(store.id, marker)
    })
  }, [stores, selectedStoreId, onSelectStore])

  useEffect(() => {
    updateMarkers()
  }, [updateMarkers])

  // 선택된 매장 변경 시 마커 아이콘 업데이트 + 지도 중심 이동
  useEffect(() => {
    const map = mapRef.current
    if (!map || !window.google?.maps) return

    stores.forEach((store) => {
      const marker = markersRef.current.get(store.id)
      if (!marker) return
      const isSelected = store.id === selectedStoreId
      marker.setIcon({
        url: svgToDataUrl(makeMarkerSvg(store.isOpen, isSelected)),
        scaledSize: new window.google.maps.Size(isSelected ? 36 : 28, isSelected ? 46 : 36),
        anchor: new window.google.maps.Point(isSelected ? 18 : 14, isSelected ? 46 : 36),
      })
      marker.setZIndex(isSelected ? 100 : 10)
    })

    const selectedStore = stores.find((s) => s.id === selectedStoreId)
    if (selectedStore) {
      map.panTo({ lat: selectedStore.lat, lng: selectedStore.lng })
      map.setZoom(15)
    }
  }, [selectedStoreId, stores])

  // 내 위치 감지
  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setLocState('denied')
      return
    }
    setLocState('loading')
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords
        setMyPos({ lat, lng })
        setLocState('ok')

        const map = mapRef.current
        if (!map || !window.google?.maps) return

        // 기존 내 위치 마커 제거
        if (myLocMarkerRef.current) myLocMarkerRef.current.setMap(null)

        myLocMarkerRef.current = new window.google.maps.Marker({
          position: { lat, lng },
          map,
          icon: {
            url: svgToDataUrl(makeMyLocationSvg()),
            scaledSize: new window.google.maps.Size(28, 28),
            anchor: new window.google.maps.Point(14, 14),
          },
          title: '내 위치',
          zIndex: 200,
        })

        map.panTo({ lat, lng })
        map.setZoom(14)
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }, [])

  // 지도 로드 시 자동으로 내 위치 요청
  useEffect(() => {
    if (mapReady && locState === 'idle') locateMe()
  }, [mapReady, locState, locateMe])

  // cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.setMap(null))
      myLocMarkerRef.current?.setMap(null)
      infoWindowRef.current?.close()
      mapRef.current = null
    }
  }, [])

  // API 키 없음
  if (!API_KEY) {
    return (
      <div
        className={`${className ?? ''} bg-[#1E293B] border border-[#334155] rounded-2xl flex flex-col items-center justify-center gap-3 px-6`}
      >
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
      {/* 실제 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" />

      {/* 로딩 오버레이 */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#1E293B] flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
          <span className="text-sm text-[#64748B]">지도 로딩 중...</span>
        </div>
      )}

      {/* 매장 수 배지 */}
      <div className="absolute top-3 left-3 z-10 bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
        <span className="text-[11px] font-bold text-[#CBD5E1]">게임샵 {stores.length}곳</span>
      </div>

      {/* 내 위치 확인 배지 */}
      {locState === 'ok' && myPos && (
        <div className="absolute top-3 right-12 z-10 bg-[#0F172A]/85 backdrop-blur-sm border border-[#334155] rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-[#F59E0B]">내 위치 확인됨</span>
        </div>
      )}

      {/* 내 위치 버튼 */}
      <button
        type="button"
        onClick={locateMe}
        aria-label="내 위치로 이동"
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-[#0F172A]/85 border border-[#334155] backdrop-blur-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        {locState === 'loading' ? (
          <div className="w-4 h-4 rounded-full border-2 border-[#4F46E5] border-t-transparent animate-spin" />
        ) : (
          <svg
            width="15"
            height="15"
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

      {/* 줌 컨트롤 */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col gap-1">
        <button
          type="button"
          aria-label="확대"
          onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 13) + 1)}
          className="w-8 h-8 rounded-lg bg-[#0F172A]/85 border border-[#334155] backdrop-blur-sm flex items-center justify-center text-[#CBD5E1] font-bold text-base active:scale-95 transition-transform"
        >
          +
        </button>
        <button
          type="button"
          aria-label="축소"
          onClick={() => mapRef.current?.setZoom((mapRef.current?.getZoom() ?? 13) - 1)}
          className="w-8 h-8 rounded-lg bg-[#0F172A]/85 border border-[#334155] backdrop-blur-sm flex items-center justify-center text-[#CBD5E1] font-bold text-base active:scale-95 transition-transform"
        >
          −
        </button>
      </div>
    </div>
  )
}
