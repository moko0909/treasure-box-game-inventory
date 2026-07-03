'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { Store } from '@/lib/data'

interface TmapProps {
  stores: Store[]
  selectedStoreId: string
  onSelectStore: (id: string) => void
  className?: string
}

const API_KEY = process.env.NEXT_PUBLIC_TMAP_API_KEY

// 서울 중심 좌표 (기본값)
const SEOUL_LAT = 37.5326
const SEOUL_LNG = 126.9723

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Tmapv2: any
  }
}

// ── TMAP SDK 로더 (한 번만 로드, 준비될 때까지 폴링) ──
let sdkState: 'idle' | 'loading' | 'ready' = 'idle'
const sdkWaiters: Array<() => void> = []

function whenTmapReady(cb: () => void, deadline = Date.now() + 8000) {
  if (window.Tmapv2?.LatLng && window.Tmapv2?.Map) { cb(); return }
  if (Date.now() > deadline) return
  setTimeout(() => whenTmapReady(cb, deadline), 100)
}

function finishLoad() {
  sdkState = 'ready'
  const waiters = sdkWaiters.splice(0)
  waiters.forEach((w) => whenTmapReady(w))
}

function failLoad() {
  sdkState = 'idle'
  sdkWaiters.length = 0
}

// TMAP SDK는 2단계 로드:
//  1) 부트스트랩(jsv2, appKey 포함)이 `_getScriptLocation`을 정의하고
//     원래는 document.write로 실제 SDK를 주입하지만, 동적 로드 환경에서는
//     document.write가 무시되므로 우리가 직접 모듈 스크립트를 주입한다.
//  2) tmapjs2.min.js (LatLng/Map/Marker 등 실제 클래스)
function loadTmapSdk(cb: () => void) {
  if (sdkState === 'ready') { whenTmapReady(cb); return }
  sdkWaiters.push(cb)
  if (sdkState === 'loading') return
  sdkState = 'loading'

  const boot = document.createElement('script')
  boot.src = `https://apis.openapi.sk.com/tmap/jsv2?version=1&appKey=${API_KEY}`
  boot.async = true
  boot.onload = () => {
    // 부트스트랩이 정의한 실제 SDK 위치를 사용해 모듈을 직접 주입
    const base = window.Tmapv2?._getScriptLocation?.() ?? 'https://topopentile1.tmap.co.kr/scriptSDKV2/'
    const mod = document.createElement('script')
    mod.src = `${base}tmapjs2.min.js?version=20231206`
    mod.async = true
    mod.onload = finishLoad
    mod.onerror = failLoad
    document.head.appendChild(mod)
  }
  boot.onerror = failLoad
  document.head.appendChild(boot)
}

// 매장 마커 HTML (핀 형태 라벨)
function markerHtml(store: Store, isSelected: boolean): string {
  const bg = isSelected ? '#4F46E5' : store.isOpen ? '#22C55E' : '#475569'
  const border = isSelected ? '#818CF8' : store.isOpen ? '#16A34A' : '#334155'
  const ring = isSelected ? ',0 0 0 3px rgba(79,70,229,0.4)' : ''
  const scale = isSelected ? 'scale(1.12)' : 'scale(1)'
  return `<div style="
    background:${bg};border:2px solid ${border};
    border-radius:10px 10px 10px 2px;padding:5px 9px;
    font-size:11px;font-weight:700;color:#fff;white-space:nowrap;
    box-shadow:0 3px 10px rgba(0,0,0,0.6)${ring};
    transform:${scale};letter-spacing:-0.2px;
    font-family:system-ui,-apple-system,sans-serif;
    cursor:pointer;">${store.name}</div>`
}

// 내 위치 마커 HTML
function myLocHtml(): string {
  return `<div style="
    width:20px;height:20px;background:#F59E0B;
    border:3px solid #fff;border-radius:50%;
    box-shadow:0 0 0 5px rgba(245,158,11,0.25),0 2px 8px rgba(0,0,0,0.5);"></div>`
}

// 인포윈도우 HTML
function infoHtml(store: Store): string {
  const inStock = store.games.filter((g) => g.stockStatus === 'in-stock').length
  const statusColor = store.isOpen ? '#22C55E' : '#94A3B8'
  const statusText = store.isOpen ? '영업 중' : '영업 종료'
  return `<div style="
    background:#1E293B;border:1px solid #334155;border-radius:12px;
    padding:12px 14px;min-width:190px;max-width:240px;
    font-family:system-ui,-apple-system,sans-serif;
    box-shadow:0 4px 20px rgba(0,0,0,0.6);">
    <p style="margin:0 0 3px;font-size:13px;font-weight:700;color:#F8FAFC;">${store.name}</p>
    <p style="margin:0 0 8px;font-size:11px;color:#94A3B8;line-height:1.4;">${store.address}</p>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:${statusColor};">${statusText}</span>
      <span style="font-size:11px;color:#64748B;">${store.distance}km</span>
      <span style="font-size:11px;color:#22C55E;font-weight:600;">재고 ${inStock}종</span>
    </div>
    ${store.phone ? `<p style="margin:6px 0 0;font-size:11px;color:#64748B;">${store.phone}</p>` : ''}
  </div>`
}

export function NaverMap({ stores, selectedStoreId, onSelectStore, className }: TmapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const myMarkerRef = useRef<any>(null)
  const infoRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)

  // 최신 props를 이벤트 클로저에서 참조하기 위한 ref
  const storesRef = useRef(stores)
  const onSelectRef = useRef(onSelectStore)
  storesRef.current = stores
  onSelectRef.current = onSelectStore

  const [mapReady, setMapReady] = useState(false)
  const [locState, setLocState] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle')
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null)

  // ── 지도 초기화 ──
  useEffect(() => {
    if (!API_KEY || !containerRef.current || mapRef.current) return
    let cancelled = false

    loadTmapSdk(() => {
      if (cancelled || !containerRef.current || mapRef.current) return
      const T = window.Tmapv2
      const map = new T.Map(containerRef.current, {
        center: new T.LatLng(SEOUL_LAT, SEOUL_LNG),
        width: '100%',
        height: '100%',
        zoom: 13,
      })
      // 다크(야간) 스킨 적용 (지원 시)
      try { map.setMapType?.(T.MapType?.MAP_NIGHT ?? 'MAP_NIGHT') } catch {}
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      cancelled = true
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
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
        const map = mapRef.current
        const T = window.Tmapv2
        if (!map || !T) return
        const latlng = new T.LatLng(pos.lat, pos.lng)
        if (myMarkerRef.current) {
          myMarkerRef.current.setPosition(latlng)
        } else {
          myMarkerRef.current = new T.Marker({
            position: latlng, map,
            iconHTML: myLocHtml(), zIndex: 200,
          })
          map.setCenter(latlng)
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

  // ── 매장 마커 렌더링 ──
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const T = window.Tmapv2
    const map = mapRef.current

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current.clear()

    for (const store of stores) {
      const isSelected = store.id === selectedStoreId
      const marker = new T.Marker({
        position: new T.LatLng(store.lat, store.lng),
        map,
        iconHTML: markerHtml(store, isSelected),
        zIndex: isSelected ? 100 : 10,
      })
      marker.addListener('click', () => {
        const s = storesRef.current.find((x) => x.id === store.id) ?? store
        onSelectRef.current(s.id)
        infoRef.current?.setMap(null)
        infoRef.current = new T.InfoWindow({
          position: new T.LatLng(s.lat, s.lng),
          content: infoHtml(s),
          type: 2,
          map,
        })
      })
      markersRef.current.set(store.id, marker)
    }
  }, [mapReady, stores, selectedStoreId])

  // ── 선택 매장 변경 시 지도 중심 이동 ──
  useEffect(() => {
    if (!mapReady || !mapRef.current) return
    const store = stores.find((s) => s.id === selectedStoreId)
    if (store) {
      const T = window.Tmapv2
      mapRef.current.setCenter(new T.LatLng(store.lat, store.lng))
      mapRef.current.setZoom(15)
    }
  }, [selectedStoreId, mapReady, stores])

  // ── API 키 없음 안내 ──
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
          <p className="text-sm font-bold text-[#F8FAFC]">TMAP API 키 필요</p>
          <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">
            SK TMAP Developers에서 발급 후<br />
            <code className="text-[#818CF8] text-[10px]">NEXT_PUBLIC_TMAP_API_KEY</code><br />
            환경변수를 설정하세요.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className ?? ''}`} style={{ isolation: 'isolate' }}>
      {/* 실제 지도 */}
      <div ref={containerRef} className="w-full h-full" style={{ zIndex: 0 }} />

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
              const T = window.Tmapv2
              mapRef.current.setCenter(new T.LatLng(myPos.lat, myPos.lng))
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
