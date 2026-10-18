import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { palette } from '@/theme/tokens';

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  color: string;
}

interface Props {
  points: MapPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userLocation?: { lat: number; lng: number } | null;
  /** Re-centre request: bump the number to fly back to the data. */
  fitToken?: number;
  /** Space the floating UI covers, so fit/fly keep pins visible. */
  padding?: { top: number; bottom: number };
}

const HTML = `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{height:100%;margin:0;background:#dfeceb;font-family:-apple-system,Roboto,sans-serif}
  .leaflet-control-attribution{font-size:9px;background:rgba(255,255,255,.7)!important}
  .leaflet-control-zoom{display:none}
  .leaflet-tile-pane{filter:saturate(.8) contrast(.98) brightness(1.03)}
  .pinwrap{position:relative;width:0;height:0}
  .pin{position:absolute;left:-19px;top:-44px;width:38px;height:38px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
       border:3px solid #fff;box-shadow:0 4px 10px rgba(0,50,45,.38);animation:drop .55s cubic-bezier(.2,1.5,.4,1) both;
       transition:transform .25s cubic-bezier(.2,1.4,.4,1),box-shadow .25s}
  .pin i{position:absolute;left:50%;top:50%;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff}
  .pin.sel{transform:rotate(-45deg) scale(1.35);box-shadow:0 8px 18px rgba(0,50,45,.5);z-index:999}
  .halo{position:absolute;left:-26px;top:-26px;width:52px;height:52px;border-radius:50%;opacity:0;pointer-events:none}
  .halo.on{animation:pulse 1.6s ease-out infinite}
  .tag{position:absolute;left:50%;top:-86px;transform:translateX(-50%) translateY(6px);white-space:nowrap;background:#00665D;color:#fff;
       font:700 11px/1 Roboto,sans-serif;padding:7px 11px;border-radius:99px;opacity:0;transition:all .25s;pointer-events:none}
  .tag.on{opacity:1;transform:translateX(-50%) translateY(0)}
  .me{width:18px;height:18px;border-radius:50%;background:#2F80ED;border:3px solid #fff;box-shadow:0 0 0 8px rgba(47,128,237,.22)}
  @keyframes drop{from{transform:rotate(-45deg) translate(30px,-30px) scale(.3);opacity:0}to{transform:rotate(-45deg);opacity:1}}
  @keyframes pulse{0%{transform:scale(.5);opacity:.5}100%{transform:scale(1.4);opacity:0}}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var map = L.map('map',{zoomControl:false,attributionControl:true,zoomSnap:0.25}).setView([36.4,10.61],12.5);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
    maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
  var markers = {}, pts = {}, sel = null, me = null, pad = {top:150,bottom:220}, first = true;
  function post(o){ window.ReactNativeWebView.postMessage(JSON.stringify(o)); }
  function icon(p, on){
    return L.divIcon({className:'',iconSize:[0,0],html:
      '<div class="pinwrap"><div class="halo '+(on?'on':'')+'" style="background:'+p.color+'"></div>'+
      '<div class="tag '+(on?'on':'')+'">'+p.name.replace(/</g,'&lt;')+'</div>'+
      '<div class="pin '+(on?'sel':'')+'" style="background:'+p.color+'"><i></i></div></div>'});
  }
  window.setPad = function(t,b){ pad = {top:t,bottom:b}; };
  window.setData = function(list){
    Object.keys(markers).forEach(function(id){ map.removeLayer(markers[id]); }); markers = {}; pts = {};
    list.forEach(function(p, i){
      pts[p.id] = p;
      var m = L.marker([p.lat,p.lng],{icon:icon(p,false),riseOnHover:true}).addTo(map);
      m.on('click', function(){ post({type:'select',id:p.id}); });
      markers[p.id] = m;
      setTimeout(function(){ var el = m.getElement(); if(el){ el.style.animationDelay=(i*60)+'ms'; } }, 0);
    });
    sel = null; window.fit();
  };
  window.fit = function(){
    var ids = Object.keys(pts); if(!ids.length) return;
    var b = L.latLngBounds(ids.map(function(id){ return [pts[id].lat, pts[id].lng]; }));
    map.flyToBounds(b,{paddingTopLeft:[40,pad.top],paddingBottomRight:[40,pad.bottom],maxZoom:15,duration:first?0.01:1.0});
    first = false;
  };
  window.select = function(id){
    if(sel && markers[sel]) markers[sel].setIcon(icon(pts[sel],false));
    sel = id;
    if(id && markers[id]){
      markers[id].setIcon(icon(pts[id],true)); markers[id].setZIndexOffset(1000);
      var p = pts[id];
      var pt = map.project([p.lat,p.lng], 15.5);
      pt.y += (pad.bottom - pad.top)/2;
      map.flyTo(map.unproject(pt,15.5),15.5,{duration:0.9,easeLinearity:0.25});
    }
  };
  window.setUser = function(lat,lng){
    if(me) map.removeLayer(me);
    me = L.marker([lat,lng],{icon:L.divIcon({className:'',iconSize:[0,0],html:'<div class="me" style="margin:-9px 0 0 -9px"></div>'})}).addTo(map);
    map.flyTo([lat,lng],14.5,{duration:1});
  };
  map.on('click', function(){ post({type:'select',id:null}); });
  post({type:'ready'});
</script></body></html>`;

/**
 * Keyless interactive map (Leaflet + Carto tiles) in a WebView. Pins drop in,
 * the selected one grows and shows its name, and the camera flies to it.
 * Works in Expo Go without any Google Maps key.
 */
export function LeafletMap({ points, selectedId, onSelect, userLocation, fitToken = 0, padding }: Props) {
  const ref = useRef<WebView>(null);
  const ready = useRef(false);
  const latest = useRef({ points, selectedId, userLocation, padding });
  latest.current = { points, selectedId, userLocation, padding };

  const run = useCallback((js: string) => ref.current?.injectJavaScript(`try{${js}}catch(e){};true;`), []);

  const pushAll = useCallback(() => {
    const { points: pts, selectedId: sel, userLocation: loc, padding: pad } = latest.current;
    run(`setPad(${pad?.top ?? 150},${pad?.bottom ?? 220});`);
    run(`setData(${JSON.stringify(pts)});`);
    if (sel) run(`select(${JSON.stringify(sel)});`);
    if (loc) run(`setUser(${loc.lat},${loc.lng});`);
  }, [run]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data);
        if (msg.type === 'ready') {
          ready.current = true;
          pushAll();
        } else if (msg.type === 'select') {
          onSelect(msg.id ?? null);
        }
      } catch {
        /* ignore malformed messages */
      }
    },
    [onSelect, pushAll],
  );

  const key = useMemo(() => points.map((p) => p.id).join('|'), [points]);

  useEffect(() => {
    if (ready.current) pushAll();
  }, [key, pushAll]);

  useEffect(() => {
    if (ready.current) run(`select(${JSON.stringify(selectedId)});`);
  }, [selectedId, run]);

  useEffect(() => {
    if (ready.current && fitToken > 0) run('fit();');
  }, [fitToken, run]);

  useEffect(() => {
    if (ready.current && userLocation) run(`setUser(${userLocation.lat},${userLocation.lng});`);
  }, [userLocation, run]);

  return (
    <View style={styles.flex}>
      <WebView
        ref={ref}
        originWhitelist={['*']}
        source={{ html: HTML, baseUrl: 'https://localhost/' }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        style={styles.web}
        androidLayerType="hardware"
        containerStyle={styles.flex}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: palette.mint },
  web: { flex: 1, backgroundColor: 'transparent' },
});
