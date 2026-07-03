'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

// 서울 중심 (GPS 거부 시 fallback)
const SEOUL_LAT = 37.5326
const SEOUL_LNG = 126.9723

// Haversine 거리 계산 (km)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export type { Store }

interface MapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  /** 실시간 재계산된 거리(km)를 부모에 전달 */
  onDistancesUpdate?: (distances: Record<string, number>) => void
  className?: string
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export function NaverMap({ stores, selectedStoreId, onSelectStore, onDistancesUpdate, className }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const myMarkerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const leafletRef = useRef<any>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)

  // 최신 값을 클로저에서 안전하게 참조
  const storesRef = useRef(stores)
  const onSelectRef = useRef(onSelectStore)
  const onDistancesRef = useRef(onDistancesUpdate)
  storesRef.current = stores
  onSelectRef.current = onSelectStore
  onDistancesRef.current = onDistancesUpdate

  // ── 마커 SVG ──
  const makeStoreIcon = useCallback((store: Store, isSelected: boolean, L: any) => {
    const bg = isSelected ? '#6200EE' : store.isOpen ? '#22C55E' : '#475569'
    const border = isSelected ? '#BB86FC' : store.isOpen ? '#16A34A' : '#334155'
    const shadow = isSelected ? '0 0 0 4px rgba(98,0,238,0.35),' : ''
    const scale = isSelected ? 'scale(1.15)' : 'scale(1)'
    const html = `<div style="
      background:${bg};border:2px solid ${border};
      border-radius:10px 10px 10px 2px;padding:5px 10px;
      font-size:11px;font-weight:700;color:#fff;white-space:nowrap;
      box-shadow:${shadow}0 3px 12px rgba(0,0,0,0.55);
      transform:${scale};transform-origin:bottom left;
      letter-spacing:-0.3px;cursor:pointer;
      font-family:system-ui,-apple-system,sans-serif;
      transition:transform .15s;">${store.name}</div>`
    return L.divIcon({ html, className: '', iconAnchor: [0, 28] })
  }, [])

  const makeMyIcon = useCallback((L: any) => {
    const html = `<div style="
      width:22px;height:22px;background:#F59E0B;
      border:3px solid #fff;border-radius:50%;
      box-shadow:0 0 0 6px rgba(245,158,11,0.25),0 2px 8px rgba(0,0,0,0.5);
      position:relative;">
      <div style="
        position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:7px;height:7px;background:rgba(255,255,255,0.9);border-radius:50%;">
      </div>
    </div>`
    return L.divIcon({ html, className: '', iconAnchor: [11, 11] })
  }, [])

  // ── Leaflet 초기화 ──
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return
      leafletRef.current = L.default ?? L

      const Lf = leafletRef.current

      // Leaflet 기본 마커 아이콘 경로 수정 (Next.js에서 필요)
      delete (Lf.Icon.Default.prototype as any)._getIconUrl
      Lf.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = Lf.map(containerRef.current, {
        center: [SEOUL_LAT, SEOUL_LNG],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      })

      // 다크 타일 (CartoDB Dark Matter)
      Lf.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      ).addTo(map)

      // attribution 우하단 커스텀
      Lf.control.attribution({ prefix: false, position: 'bottomright' }).addTo(map)

      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // ── 내 위치 실시간 추적 ──
  const startWatch = useCallback(() => {
    if (!navigator.geolocation) { setLocState('denied'); return }
    if (watchIdRef.current !== null) return
    setLocState('loading')

    watchIdRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const pos = { lat: coords.latitude, lng: coords.longitude }
        setMyPos(pos)
        setLocState('ok')

        // 거리 재계산 후 부모에 전달
        const distances: Record<string, number> = {}
        storesRef.current.forEach((s) => {
          distances[s.id] = Math.round(haversine(pos.lat, pos.lng, s.lat, s.lng) * 10) / 10
        })
        onDistancesRef.current?.(distances)

        const map = mapRef.current
        const Lf = leafletRef.current
        if (!map || !Lf) return

        const latlng: [number, number] = [pos.lat, pos.lng]

        // 내 위치 마커 업데이트
        if (myMarkerRef.current) {
          myMarkerRef.current.setLatLng(latlng)
        } else {
          myMarkerRef.current = Lf.marker(latlng, {
            icon: makeMyIcon(Lf),
            zIndexOffset: 1000,
          }).addTo(map)

          // 처음 위치 확인 시 지도 이동
          map.setView(latlng, 14, { animate: true })
        }

        // 정확도 원 업데이트
        if (accuracyCircleRef.current) {
          accuracyCircleRef.current.setLatLng(latlng)
          accuracyCircleRef.current.setRadius(coords.accuracy)
        } else {
          accuracyCircleRef.current = Lf.circle(latlng, {
            radius: coords.accuracy,
            color: '#F59E0B',
            fillColor: '#F59E0B',
            fillOpacity: 0.08,
            weight: 1.5,
            opacity: 0.4,
          }).addTo(map)
        }
      },
      () => setLocState('denied'),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    )
  }, [makeMyIcon])

  // 지도 준비되면 자동으로 위치 감시 시작
  useEffect(() => {
    if (mapReady && locState === 'idle') startWatch()
  }, [mapReady, locState, startWatch])

  // ── 매장 마커 렌더링 ──
  useEffect(() => {
    if (!mapReady || !mapRef.current || !leafletRef.current) return
    const Lf = leafletRef.current
    const map = mapRef.current

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    stores.forEach((store) => {
      const isSelected = store.id === selectedStoreId
      const marker = Lf.marker([store.lat, store.lng], {
        icon: makeStoreIcon(store, isSelected, Lf),
        zIndexOffset: isSelected ? 500 : 0,
      }).addTo(map)

      // 팝업
      const inStock = store.games.filter((g) => g.stockStatus !== 'sold-out').length
      const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
      const statusText = store.isOpen ? '영업 중' : '영업 종료'
      marker.bindPopup(
        `<div style="
          font-family:system-ui,-apple-system,sans-serif;
          min-width:180px;max-width:220px;">
          <p style="margin:0 0 3px;font-size:13px;font-weight:700;">${store.name}</p>
          <p style="margin:0 0 7px;font-size:11px;color:#64748B;line-height:1.4;">${store.address}</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:11px;font-weight:700;color:${statusColor}">${statusText}</span>
            <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
            <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStock}종</span>
          </div>
          ${store.phone ? `<p style="margin:5px 0 0;font-size:11px;color:#64748B;">${store.phone}</p>` : ''}
        </div>`,
        { maxWidth: 240, className: 'leaflet-popup-custom' }
      )

      marker.on('click', () => {
        onSelectRef.current(store.id)
      })

      markersRef.current.set(store.id, marker)
    })
  }, [mapReady, stores, selectedStoreId, makeStoreIcon])

  // ── 선택 매장 변경 시 지도 중심 이동 ──
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const store = stores.find((s) => s.id === selectedStoreId)
    if (store) {
      mapRef.current.setView([store.lat, store.lng], 15, { animate: true })
      // 해당 마커 팝업 열기
      const marker = markersRef.current.get(store.id)
      if (marker) marker.openPopup()
    }
  }, [selectedStoreId, mapReady, stores])

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ isolation: 'isolate' }}>
      {/* Leaflet CSS */}
      <style>{`
        .leaflet-container { background: #0B1220; }
        .leaflet-popup-content-wrapper {
          background: #1E293B !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.6) !important;
          color: #F8FAFC !important;
        }
        .leaflet-popup-tip { background: #1E293B !important; }
        .leaflet-popup-close-button { color: #64748B !important; top: 6px !important; right: 8px !important; }
        .leaflet-popup-content { margin: 12px 14px !important; }
        .leaflet-control-attribution {
          background: rgba(15,23,42,0.7) !important;
          color: #475569 !important;
          font-size: 9px !important;
          border-radius: 4px !important;
        }
        .leaflet-control-attribution a { color: #6366F1 !important; }
      `}</style>

      {/* 지도 컨테이너 */}
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 0 }} />

      {/* 로딩 오버레이 */}
      {!mapReady && (
        <div className="absolute inset-0 bg-[#0B1220] flex items-center justify-center gap-2.5 z-10">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground">지도 불러오는 중</span>
        </div>
      )}

      {/* 매장 수 배지 */}
      {mapReady && (
        <div className="absolute top-3 left-3 z-[400] bg-background/85 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1 flex items-center gap-1.5 pointer-events-none">
          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          <span className="text-[11px] font-bold text-foreground">게임샵 {stores.length}곳</span>
        </div>
      )}

      {/* 내 위치 확인 배지 */}
      {locState === 'ok' && mapReady && (
        <div className="absolute top-3 left-[50%] -translate-x-1/2 z-[400] bg-background/85 backdrop-blur-sm border border-amber-500/40 rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-amber-400">위치 확인됨</span>
        </div>
      )}

      {/* 위치 거부 배지 */}
      {locState === 'denied' && mapReady && (
        <div className="absolute top-3 left-[50%] -translate-x-1/2 z-[400] bg-background/85 backdrop-blur-sm border border-red-500/40 rounded-lg px-2.5 py-1 pointer-events-none">
          <span className="text-[10px] font-bold text-red-400">위치 권한 필요</span>
        </div>
      )}

      {/* 내 위치 버튼 */}
      {mapReady && (
        <button
          type="button"
          onClick={() => {
            if (locState === 'ok' && myPos && mapRef.current) {
              mapRef.current.setView([myPos.lat, myPos.lng], 14, { animate: true })
            } else {
              if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current)
                watchIdRef.current = null
              }
              setLocState('idle')
              startWatch()
            }
          }}
          aria-label="내 위치로 이동"
          className="absolute top-3 right-3 z-[400] w-9 h-9 rounded-xl bg-background/85 backdrop-blur-sm border border-border flex items-center justify-center shadow-md active:scale-95 transition-transform"
        >
          {locState === 'loading' ? (
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          ) : (
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke={locState === 'ok' ? '#F59E0B' : locState === 'denied' ? '#EF4444' : 'currentColor'}
              strokeWidth="2.5"
              className={locState === 'idle' ? 'text-muted-foreground' : ''}
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
          )}
        </button>
      )}

      {/* 줌 버튼 */}
      {mapReady && (
        <div className="absolute bottom-6 right-3 z-[400] flex flex-col gap-1">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            aria-label="확대"
            className="w-9 h-9 rounded-xl bg-background/85 backdrop-blur-sm border border-border flex items-center justify-center shadow-md active:scale-95 transition-transform text-foreground font-bold text-lg"
          >+</button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            aria-label="축소"
            className="w-9 h-9 rounded-xl bg-background/85 backdrop-blur-sm border border-border flex items-center justify-center shadow-md active:scale-95 transition-transform text-foreground font-bold text-lg"
          >−</button>
        </div>
      )}
    </div>
  )
}
