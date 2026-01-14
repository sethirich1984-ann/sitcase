import React, { useState, useEffect } from 'react';
import { Plus, Minus, Layers, Compass, Locate } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { RecommendationItem, StrategicPoint, StrategicCluster } from '../../types';

// 深圳南山区前海坐标 (WGS84)
const SHENZHEN_QIANHAI: [number, number] = [22.5160, 113.8996];

// 修复 Leaflet 默认 Icon 路径问题
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// 自定义小圆点图标 (用于评估POI)
const createDotIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.4);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

// 战略地图：自有门店点位图标
const ownStoreIcon = L.divIcon({
  className: 'custom-store-icon',
  html: `<div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 50%; border: 3px solid rgba(16,185,129,0.3); box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// 战略地图：竞品门店点位图标
const competitorStoreIcon = L.divIcon({
  className: 'custom-comp-icon',
  html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

// 战略地图：聚合气泡图标
const createClusterIcon = (cluster: StrategicCluster) => {
  // 根据市场占有率决定颜色倾向
  const isDominant = cluster.marketShare >= 50;
  const bgColor = isDominant ? 'rgba(16, 185, 129, 0.9)' : 'rgba(59, 130, 246, 0.85)';
  const size = 60 + (cluster.ownCount + cluster.competitorCount) * 1.5; // 动态大小
  const finalSize = Math.min(size, 100); // 限制最大尺寸

  return L.divIcon({
    className: 'custom-cluster-icon',
    html: `
      <div style="
        background-color: ${bgColor}; 
        width: ${finalSize}px; 
        height: ${finalSize}px; 
        border-radius: 50%; 
        color: white; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        border: 2px solid rgba(255,255,255,0.8);
        transition: transform 0.2s;
      ">
        <div style="font-size: 10px; font-weight: bold; opacity: 0.9;">${cluster.regionName}</div>
        <div style="font-size: 14px; font-weight: 800;">${cluster.marketShare.toFixed(0)}%</div>
        <div style="font-size: 8px; opacity: 0.8;">占有率</div>
      </div>
    `,
    iconSize: [finalSize, finalSize],
    iconAnchor: [finalSize / 2, finalSize / 2]
  });
};

// 创建推荐排名的自定义 Icon (增强可见性)
const createRankIcon = (rank: number, name: string, score: number) => L.divIcon({
  className: 'custom-rank-icon',
  html: `
    <div class="flex flex-col items-center group">
      <div class="bg-orange-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg border-2 border-white shadow-lg relative z-10 transform group-hover:scale-110 transition-transform">
        ${rank}
      </div>
      <div class="bg-white/95 backdrop-blur px-2 py-1 rounded shadow-md text-[10px] font-bold text-slate-900 whitespace-nowrap -mt-2 pt-2 border border-slate-300">
        ${name} <span class="text-orange-600 font-extrabold">${score}</span>
      </div>
    </div>
  `,
  iconSize: [100, 60],
  iconAnchor: [50, 25]
});

const residentialIcon = createDotIcon('#ef4444'); // Red
const officeIcon = createDotIcon('#3b82f6');      // Blue

// 地图事件与状态同步组件
const MapEvents = ({ 
  onClick, 
  onZoomChange 
}: { 
  onClick?: (latlng: L.LatLng) => void;
  onZoomChange?: (zoom: number) => void;
}) => {
  const map = useMapEvents({
    click(e) {
      if (onClick) onClick(e.latlng);
    },
    zoomend() {
      if (onZoomChange) onZoomChange(map.getZoom());
    }
  });
  return null;
};

// 用于在地图内部监听状态或执行指令的子组件
const MapController = ({ resetFn, flyTo, zoomLevel }: { resetFn?: boolean, flyTo?: [number, number], zoomLevel?: number }) => {
  const map = useMap();
  useEffect(() => {
    if (resetFn) {
      map.flyTo(SHENZHEN_QIANHAI, 14);
    }
  }, [resetFn, map]);

  useEffect(() => {
    if (flyTo) {
      // 如果有指定缩放级别则使用，否则默认 15
      map.flyTo(flyTo, zoomLevel || 15, { duration: 1.5 });
    }
  }, [flyTo, zoomLevel, map]);

  return null;
};

interface MapBaseProps {
  onMapClick?: (lat: number, lng: number) => void;
  isPinning?: boolean; // 是否处于扎点模式
  overlayData?: {      // 评估结果的覆盖层数据
    center: [number, number];
    radius: number; // 米
    pois: { lat: number; lng: number; type: string }[];
  } | null;
  recommendationData?: RecommendationItem[] | null; // 推荐结果数据
  focusedRecItem?: RecommendationItem | null; // 当前聚焦的推荐项
  strategicData?: StrategicPoint[] | null; // 战略地图数据
}

export const MapBase: React.FC<MapBaseProps> = ({ 
  onMapClick, 
  isPinning, 
  overlayData, 
  recommendationData, 
  focusedRecItem,
  strategicData 
}) => {
  const [map, setMap] = useState<L.Map | null>(null);
  const [currentZoom, setCurrentZoom] = useState(14); // 默认缩放
  const [clusters, setClusters] = useState<StrategicCluster[]>([]);

  // 缩放控制
  const handleZoomIn = () => map?.zoomIn();
  const handleZoomOut = () => map?.zoomOut();
  
  // 复位到前海
  const handleReset = () => {
    map?.flyTo(SHENZHEN_QIANHAI, 14, { duration: 1.5 });
  };

  // 根据半径计算合适的缩放级别
  const getZoomByRadius = (r: number) => {
    if (r <= 500) return 16;
    if (r <= 1000) return 15;
    if (r <= 3000) return 14;
    return 13;
  };

  // 简单的网格聚合逻辑
  useEffect(() => {
    if (!strategicData || strategicData.length === 0) {
      setClusters([]);
      return;
    }

    // 简单模拟聚合：将数据按大致区域分组 (Lat/Lng 保留小数点后两位约等于1km范围)
    const groups: Record<string, { own: number, comp: number, latSum: number, lngSum: number, count: number }> = {};
    
    strategicData.forEach(p => {
      // 模拟行政区划分：
      // 南山: 22.51-22.55, 113.89-113.96
      // 福田: 22.53-22.56, 114.00-114.06
      let region = '其他区';
      if (p.lng < 113.98) region = '南山区';
      else if (p.lng >= 113.98 && p.lng < 114.08) region = '福田区';
      else region = '宝安区';

      if (!groups[region]) groups[region] = { own: 0, comp: 0, latSum: 0, lngSum: 0, count: 0 };
      
      if (p.type === 'own') groups[region].own++;
      else groups[region].comp++;
      
      groups[region].latSum += p.lat;
      groups[region].lngSum += p.lng;
      groups[region].count++;
    });

    const newClusters: StrategicCluster[] = Object.keys(groups).map(key => {
      const g = groups[key];
      const total = g.own + g.comp;
      return {
        id: key,
        regionName: key,
        lat: g.latSum / g.count,
        lng: g.lngSum / g.count,
        ownCount: g.own,
        competitorCount: g.comp,
        marketShare: total > 0 ? (g.own / total) * 100 : 0
      };
    });

    setClusters(newClusters);

  }, [strategicData]);

  let targetCenter: [number, number] | undefined = undefined;
  let targetZoom: number | undefined = undefined;

  // 优先级计算：聚焦项 > 评估结果 > 推荐列表默认 > 默认前海
  if (focusedRecItem) {
    targetCenter = focusedRecItem.center;
    targetZoom = 16; // 聚焦时放大
  } else if (overlayData) {
    targetCenter = overlayData.center;
    targetZoom = getZoomByRadius(overlayData.radius);
  } else if (recommendationData && recommendationData.length > 0) {
    // 推荐总览模式，视角稍微拉高
    targetCenter = recommendationData[0].center;
    targetZoom = 13; 
  }

  // 决定显示哪种战略视图
  const showStrategicView = strategicData && strategicData.length > 0;
  const showClusters = showStrategicView && currentZoom < 13; // 缩放小于13显示气泡
  const showPoints = showStrategicView && currentZoom >= 13;  // 缩放大于等于13显示散点

  return (
    <div className={`absolute inset-0 w-full h-full bg-[#e5e7eb] overflow-hidden z-0 ${isPinning ? 'cursor-crosshair' : ''}`}>
      
      {/* 真实 Leaflet 地图 */}
      <MapContainer 
        center={SHENZHEN_QIANHAI} 
        zoom={14} 
        scrollWheelZoom={true} 
        zoomControl={false} // 隐藏默认控件，使用自定义UI
        className="w-full h-full"
        ref={setMap}
      >
        {/* 使用高德地图瓦片服务 (国内访问快，数据全) */}
        <TileLayer
          attribution='&copy; <a href="https://www.amap.com/">Gaode</a>'
          url="https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}"
          subdomains={['1', '2', '3', '4']}
          maxZoom={18}
          minZoom={3}
        />

        <MapEvents 
          onClick={(latlng) => onMapClick && onMapClick(latlng.lat, latlng.lng)} 
          onZoomChange={setCurrentZoom}
        />
        
        {/* 控制器：处理自动跳转 */}
        <MapController 
          flyTo={targetCenter} 
          zoomLevel={targetZoom}
        />

        {/* 场景 A: 渲染选址评估结果 (圆形辐射区) */}
        {overlayData && (
          <>
             {/* 辐射圈 */}
             <Circle 
                center={overlayData.center} 
                radius={overlayData.radius} 
                pathOptions={{ 
                  color: '#2563eb', // 蓝色实线
                  weight: 3, 
                  fillColor: '#3b82f6', 
                  fillOpacity: 0.25,
                  stroke: true
                }} 
             />
             {/* 中心点 */}
             <Marker position={overlayData.center} icon={defaultIcon}>
               <Popup>
                 <div className="font-bold text-slate-800">评估中心点</div>
                 <div className="text-xs text-slate-500">辐射半径: {overlayData.radius}m</div>
               </Popup>
             </Marker>
             {/* 周边POI */}
             {overlayData.pois.map((poi, idx) => (
                <Marker 
                  key={idx} 
                  position={[poi.lat, poi.lng]} 
                  icon={poi.type === 'office' ? officeIcon : residentialIcon}
                >
                </Marker>
             ))}
          </>
        )}

        {/* 场景 B: 渲染选址推荐结果 (多边形围栏 + 排名) */}
        {recommendationData && recommendationData.map((item) => {
          // 如果当前有聚焦项，且不是当前项，则降低透明度
          const isFocused = focusedRecItem ? focusedRecItem.id === item.id : true;
          const opacity = isFocused ? 0.5 : 0.1; 
          const strokeColor = isFocused ? '#ea580c' : '#fdba74'; // Orange-600 vs Orange-300

          return (
            <React.Fragment key={item.id}>
               {/* 电子围栏 - 样式显著增强 */}
               <Polygon 
                  positions={item.polygon}
                  pathOptions={{
                    color: strokeColor, 
                    weight: isFocused ? 4 : 2,
                    fillColor: '#f97316', // Orange-500
                    fillOpacity: opacity,
                    dashArray: isFocused ? undefined : '5, 5', // 非聚焦时虚线
                    lineCap: 'round',
                    lineJoin: 'round'
                  }}
               />
               {/* 排名标签 Marker */}
               <Marker 
                  position={item.center} 
                  icon={createRankIcon(item.rank, item.name, item.score)}
                  zIndexOffset={isFocused ? 1000 : 0}
               >
               </Marker>
            </React.Fragment>
          );
        })}

        {/* 场景 C: 战略地图 - 聚合气泡 (City Level) */}
        {showClusters && clusters.map(cluster => (
           <Marker 
             key={cluster.id}
             position={[cluster.lat, cluster.lng]}
             icon={createClusterIcon(cluster)}
           >
             <Popup closeButton={false}>
               <div className="p-2 min-w-[120px]">
                  <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-1 mb-2">{cluster.regionName} 数据概览</h4>
                  <div className="space-y-1 text-sm">
                     <div className="flex justify-between">
                       <span className="text-slate-500">自有门店:</span>
                       <span className="font-bold text-brand-600">{cluster.ownCount} 家</span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-slate-500">竞品门店:</span>
                       <span className="font-bold text-red-500">{cluster.competitorCount} 家</span>
                     </div>
                     <div className="flex justify-between pt-1 mt-1 border-t border-slate-100">
                       <span className="text-slate-500">市场占有率:</span>
                       <span className="font-bold text-slate-800">{cluster.marketShare.toFixed(1)}%</span>
                     </div>
                  </div>
               </div>
             </Popup>
           </Marker>
        ))}

        {/* 场景 C: 战略地图 - 散点 (District Level) */}
        {showPoints && strategicData?.map(point => (
           <Marker
             key={point.id}
             position={[point.lat, point.lng]}
             icon={point.type === 'own' ? ownStoreIcon : competitorStoreIcon}
           >
             <Popup>
                <div className="font-bold text-slate-800 text-sm">{point.name}</div>
                <div className={`text-xs mt-1 ${point.type === 'own' ? 'text-brand-500' : 'text-red-500'}`}>
                   {point.brand}
                </div>
             </Popup>
           </Marker>
        ))}

        {/* 默认标记：在前海核心区 (仅在无任何覆盖层时显示) */}
        {!overlayData && !recommendationData && !showStrategicView && (
          <Marker position={SHENZHEN_QIANHAI} icon={defaultIcon}>
            <Popup>
              <div className="p-1 text-center">
                <div className="font-bold text-slate-800">前海嘉里中心</div>
                <div className="text-xs text-slate-500">SaaS 研发中心</div>
              </div>
            </Popup>
          </Marker>
        )}

      </MapContainer>

      {/* 3. 自定义悬浮地图控件 (Z-Index 调整为 30) */}
      <div className="absolute bottom-8 right-6 flex flex-col gap-2 z-[30]">
        <div className="bg-white rounded-lg shadow-lg border border-slate-100 divide-y divide-slate-100 flex flex-col">
          <button onClick={handleZoomIn} className="p-2 hover:bg-slate-50 text-slate-600 transition-colors rounded-t-lg" title="放大">
            <Plus size={20} />
          </button>
          <button onClick={handleZoomOut} className="p-2 hover:bg-slate-50 text-slate-600 transition-colors rounded-b-lg" title="缩小">
            <Minus size={20} />
          </button>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg border border-slate-100 p-2 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors" title="图层切换">
           <Layers size={20} />
        </div>
        
        <div 
          onClick={handleReset}
          className="bg-white rounded-lg shadow-lg border border-slate-100 p-2 hover:bg-slate-50 text-slate-600 cursor-pointer transition-colors" 
          title="复位至前海"
        >
           <Locate size={20} />
        </div>
      </div>
      
      {/* 4. 比例尺 (Z-Index 调整为 30) */}
      <div className="absolute bottom-8 left-6 bg-white/80 backdrop-blur px-2 py-0.5 text-[10px] text-slate-600 border border-slate-200 rounded shadow-sm select-none z-[30]">
         Leaflet Engine Active (Gaode) | Zoom: {currentZoom}
      </div>
    </div>
  );
};