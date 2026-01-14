import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Map, Settings, Users, Bell, Search, Menu, LogOut, Zap, 
  Store, Check, Plus, Building2, ChevronUp, FileText, 
  Compass, MapPin, PieChart as PieChartIcon, AlertTriangle, Info, X, Clock,
  Filter, Download, ChevronRight, Layers, Target, MousePointer2, ChevronLeft, Loader2,
  Sparkles, Crosshair, ChevronDown, Hand, Trophy, Star, Database, Cpu, FileCheck, Save, ArrowRightCircle,
  TrendingUp, Activity, Smile, Frown, ShieldCheck, BarChart3
} from 'lucide-react';
import { TeamPage } from './TeamPage';
import { SettingsPage } from './SettingsPage';
import { MapBase } from '../components/map/MapBase';
import { Merchant, Report, EvaluationResult, RecommendationResult, RecommendationItem, StrategicPoint } from '../types';
import * as mockService from '../services/mockAuthService';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie, AreaChart, Area, CartesianGrid, LineChart, Line
} from 'recharts';

// 视图定义
type ViewType = 'dashboard' | 'evaluation' | 'recommendation' | 'report' | 'team' | 'settings';

// 定义哪些视图是基于地图的模式
const MAP_MODES: ViewType[] = ['dashboard', 'evaluation', 'recommendation', 'report'];

// 消息类型定义
interface Notification {
  id: string;
  title: string;
  content: string;
  time: string;
  type: 'alert' | 'info';
  read: boolean;
}

// --- 辅助函数：将推荐项转换为评估结果格式 ---
const mapRecToEval = (item: RecommendationItem): EvaluationResult => {
  return {
    score: item.score,
    locationName: item.name,
    tags: item.tags,
    dimensions: [
      { subject: '商业成熟度', A: Math.round(item.score), fullMark: 100 },
      { subject: '客群与客流', A: Math.round(item.score - 2), fullMark: 100 },
      { subject: '行业发展趋势', A: Math.round(item.score - 1), fullMark: 100 },
      { subject: '竞争格局评估', A: Math.round(item.score + 1), fullMark: 100 },
      { subject: '发展潜力评估', A: Math.round(item.score), fullMark: 100 },
    ],
    detailScores: [
      { label: '商业成熟度', score: Math.round(item.score), stars: 4.5 },
      { label: '客群与客流', score: Math.round(item.score - 2), stars: 4 },
      { label: '行业发展趋势', score: Math.round(item.score - 1), stars: 4 },
      { label: '竞争格局评估', score: Math.round(item.score + 1), stars: 4.5 },
      { label: '发展潜力评估', score: Math.round(item.score), stars: 4.5 },
    ],
    aiSummary: `${item.matchReason}。根据${item.name}的各项指标分析，该区域非常适合您的开店需求，尤其在客流稳定性和竞争优势方面表现突出。`,
    geoData: {
      center: item.center,
      radius: 500, // 默认显示范围
      pois: []
    }
  };
};

// --- 子组件提取：导航项 ---
const NavItem = ({ icon, label, view, currentView, onClick }: { icon: React.ReactNode, label: string, view: ViewType, currentView: ViewType, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex flex-col items-center justify-center gap-1.5 py-3.5 px-2 transition-all duration-200 group relative my-1 ${
      currentView === view 
        ? 'text-white' 
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {currentView === view && (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50"></div>
    )}
    {currentView === view && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-brand-500 rounded-r-full shadow-[0_0_12px_#10b981]"></div>
    )}
    <div className={`transition-transform duration-200 ${currentView === view ? 'text-brand-400 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'group-hover:scale-105'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-medium tracking-wide text-center leading-none ${currentView === view ? 'text-white font-bold' : ''}`}>{label}</span>
  </button>
);

// --- 子组件提取：评估报告详情视图 (重构版) ---
const EvaluationReportView = ({ result, onClose, onSave, isSaved, isSaving, backLabel }: any) => {
  const [activeTab, setActiveTab] = useState('overview');
  const scrollRef = useRef<HTMLDivElement>(null);

  // 模拟各个板块的数据 (通常这些应该包含在 EvaluationResult 中)
  const mockData = {
    demographics: [
      { name: '18-25岁', value: 20 },
      { name: '26-35岁', value: 45 }, // 主力
      { name: '36-45岁', value: 25 },
      { name: '45岁+', value: 10 },
    ],
    competition: [
      { name: '瑞幸咖啡', value: 35, fill: '#0052d9' },
      { name: '星巴克', value: 25, fill: '#006241' },
      { name: 'Manner', value: 15, fill: '#555555' },
      { name: '其他', value: 25, fill: '#cccccc' },
    ],
    trend: [
      { month: '1月', value: 80 }, { month: '2月', value: 82 }, { month: '3月', value: 85 },
      { month: '4月', value: 89 }, { month: '5月', value: 92 }, { month: '6月', value: 96 },
    ]
  };

  const sections = [
    { id: 'overview', label: '综合评分' },
    { id: 'commercial', label: '商业成熟度' },
    { id: 'customer', label: '客群与客流' },
    { id: 'industry', label: '行业趋势' },
    { id: 'competition', label: '竞争格局' },
    { id: 'potential', label: '发展潜力' },
  ];

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const element = document.getElementById(`section-${id}`);
    if (element && scrollRef.current) {
      // 简单的滚动定位，减去头部高度
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!result) return null;

  return (
    <div className="flex flex-col h-full bg-white relative">
       {/* 1. 固定头部：标题与分数 */}
       <div className="p-4 border-b border-slate-100 bg-white z-20 flex justify-between items-start shrink-0">
          <div>
             <div className="flex items-center gap-2 mb-1">
                {backLabel && (
                  <button onClick={onClose} className="mr-2 text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{result.locationName}</h2>
                <Trophy size={18} className="text-yellow-500" fill="currentColor" />
             </div>
             <div className="flex gap-2">
                {result.tags?.map((tag: string, i: number) => (
                   <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                      {tag}
                   </span>
                ))}
             </div>
          </div>
          <div className="text-right">
             <div className="text-3xl font-extrabold text-brand-500 leading-none">{result.score}</div>
             <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">综合评分</div>
          </div>
          {!backLabel && (
             <button onClick={onClose} className="absolute top-4 right-4 text-slate-300 hover:text-slate-600">
                <X size={20} />
             </button>
          )}
       </div>

       {/* 2. 吸顶导航 Tab */}
       <div className="flex bg-white border-b border-slate-100 px-2 sticky top-0 z-10 overflow-x-auto no-scrollbar shrink-0">
          {sections.map((sec) => (
             <button
               key={sec.id}
               onClick={() => scrollToSection(sec.id)}
               className={`flex-shrink-0 px-4 py-3 text-xs font-bold transition-all border-b-2 ${
                 activeTab === sec.id 
                 ? 'text-brand-600 border-brand-500' 
                 : 'text-slate-500 border-transparent hover:text-slate-700'
               }`}
             >
                {sec.label}
             </button>
          ))}
       </div>

       {/* 3. 滚动内容区域 */}
       <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar scroll-smooth" ref={scrollRef}>
          <div className="p-4 space-y-4 pb-20">
             
             {/* Section 1: 综合概览 (图1) */}
             <div id="section-overview" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-brand-500" /> 综合评估概览</h3>
                   <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded">推荐指数: 极高</span>
                </div>
                
                {/* 雷达图 */}
                <div className="h-56 relative w-full flex justify-center mb-4">
                   <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={result.dimensions}>
                         <PolarGrid stroke="#e2e8f0" />
                         <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
                         <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                         <Radar
                            name="Score"
                            dataKey="A"
                            stroke="#10b981"
                            strokeWidth={2}
                            fill="#10b981"
                            fillOpacity={0.2}
                         />
                      </RadarChart>
                   </ResponsiveContainer>
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-600 font-extrabold text-2xl bg-white/80 px-2 rounded backdrop-blur-sm shadow-sm">
                      {result.score}
                   </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                   <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] font-bold">AI</div>
                      <span className="text-xs font-bold text-slate-600">智能选址建议</span>
                   </div>
                   <p className="text-xs text-slate-600 leading-relaxed text-justify">
                      {result.aiSummary}
                   </p>
                </div>
             </div>

             {/* Section 2: 商业成熟度 (图2) */}
             <div id="section-commercial" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Store size={18} className="text-blue-500" /> 商业成熟度</h3>
                   <span className="text-xl font-extrabold text-blue-500">96<span className="text-xs">分</span></span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-4">
                   <div className="bg-blue-50 p-3 rounded-xl">
                      <div className="text-xs text-blue-400 mb-1">周边写字楼</div>
                      <div className="text-lg font-bold text-blue-700">32<span className="text-xs font-normal">个</span></div>
                   </div>
                   <div className="bg-blue-50 p-3 rounded-xl">
                      <div className="text-xs text-blue-400 mb-1">大型商场</div>
                      <div className="text-lg font-bold text-blue-700">2<span className="text-xs font-normal">个</span></div>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">住宅小区</div>
                      <div className="text-lg font-bold text-slate-700">12<span className="text-xs font-normal">个</span></div>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl">
                      <div className="text-xs text-slate-400 mb-1">日均人流</div>
                      <div className="text-lg font-bold text-slate-700">5.2<span className="text-xs font-normal">万</span></div>
                   </div>
                </div>

                <div className="space-y-2">
                   <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                      <span className="text-slate-500">核心商圈距离</span>
                      <span className="font-bold text-slate-700">0.3km (核心区)</span>
                   </div>
                   <div className="flex justify-between text-xs border-b border-slate-50 pb-2">
                      <span className="text-slate-500">平均租金水平</span>
                      <span className="font-bold text-slate-700">¥18/天/㎡</span>
                   </div>
                   <div className="flex justify-between text-xs pb-1">
                      <span className="text-slate-500">空铺率</span>
                      <span className="font-bold text-green-600">2.1% (极低)</span>
                   </div>
                </div>
             </div>

             {/* Section 3: 客群与客流 (图3) */}
             <div id="section-customer" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-orange-500" /> 客群画像</h3>
                   <span className="text-xl font-extrabold text-orange-500">96<span className="text-xs">分</span></span>
                </div>

                <div className="mb-6">
                   <h4 className="text-xs font-bold text-slate-400 mb-2">年龄分布 (主力: 26-35岁)</h4>
                   <div className="h-32 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={mockData.demographics} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={60} tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                            <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} barSize={16} />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-2">性别比例</h4>
                      <div className="flex items-center gap-2 h-2 rounded-full overflow-hidden w-full">
                         <div className="bg-pink-400 h-full" style={{width: '60%'}}></div>
                         <div className="bg-blue-400 h-full" style={{width: '40%'}}></div>
                      </div>
                      <div className="flex justify-between text-[10px] mt-1 text-slate-500">
                         <span>女 60%</span>
                         <span>男 40%</span>
                      </div>
                   </div>
                   <div>
                      <h4 className="text-xs font-bold text-slate-400 mb-2">消费能力</h4>
                      <div className="flex items-center gap-1">
                         <span className="text-sm font-bold text-slate-700">高消费</span>
                         <div className="flex gap-0.5">
                            {[1,2,3,4].map(i => <div key={i} className="w-1.5 h-3 bg-orange-500 rounded-sm"></div>)}
                            <div className="w-1.5 h-3 bg-slate-200 rounded-sm"></div>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Section 4: 行业趋势 (图4) */}
             <div id="section-industry" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> 行业发展趋势</h3>
                   <span className="text-xl font-extrabold text-emerald-500">95<span className="text-xs">分</span></span>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-xl mb-4 border border-emerald-100">
                   <div className="text-xs text-emerald-800 leading-relaxed font-medium">
                      该区域餐饮行业正处于<span className="font-bold text-emerald-600">快速上升期</span>。过去半年新开店数量大于闭店数量，且平均存活周期延长。
                   </div>
                </div>

                <div className="h-40 w-full">
                   <h4 className="text-xs font-bold text-slate-400 mb-2">开店热度指数 (近半年)</h4>
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockData.trend}>
                         <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                         <XAxis dataKey="month" tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                         <Tooltip contentStyle={{borderRadius: '8px', fontSize: '12px'}} />
                         <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>

             {/* Section 5: 竞争格局 (图5) */}
             <div id="section-competition" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Target size={18} className="text-purple-500" /> 竞争格局评估</h3>
                   <span className="text-xl font-extrabold text-purple-500">96<span className="text-xs">分</span></span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                   <div className="w-1/2 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                               data={mockData.competition}
                               innerRadius={25}
                               outerRadius={45}
                               paddingAngle={2}
                               dataKey="value"
                            >
                               {mockData.competition.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                               ))}
                            </Pie>
                         </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                         份额
                      </div>
                   </div>
                   <div className="w-1/2 space-y-2">
                      {mockData.competition.map((item, i) => (
                         <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                               <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.fill}}></div>
                               <span className="text-slate-600">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800">{item.value}%</span>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 flex gap-3 items-start">
                   <AlertTriangle size={16} className="text-purple-500 shrink-0 mt-0.5" />
                   <div className="text-xs text-purple-800">
                      <strong>竞争预警：</strong> 瑞幸咖啡在500m范围内已有3家门店，市场趋于饱和，建议采取差异化选品策略。
                   </div>
                </div>
             </div>

             {/* Section 6: 发展潜力 (图6) */}
             <div id="section-potential" className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm scroll-mt-28">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><Map size={18} className="text-indigo-500" /> 发展潜力评估</h3>
                   <span className="text-xl font-extrabold text-indigo-500">96<span className="text-xs">分</span></span>
                </div>

                <ul className="space-y-3">
                   <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold shrink-0">
                         01
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-slate-800">地铁规划利好</h4>
                         <p className="text-xs text-slate-500 mt-0.5">距规划中地铁15号线站点仅200米，预计2026年通车。</p>
                      </div>
                   </li>
                   <li className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 font-bold shrink-0">
                         02
                      </div>
                      <div>
                         <h4 className="text-sm font-bold text-slate-800">人口流入预期</h4>
                         <p className="text-xs text-slate-500 mt-0.5">周边两个在建高端住宅项目将于明年交付，预计新增3000户高净值家庭。</p>
                      </div>
                   </li>
                </ul>
             </div>

          </div>
       </div>
       
       {/* 4. 底部操作栏 */}
       <div className="p-4 border-t border-slate-100 bg-white z-20 shadow-[0_-4px_10px_-5px_rgba(0,0,0,0.05)]">
          <button 
            onClick={onSave}
            disabled={isSaved || isSaving}
            className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              isSaved 
              ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 cursor-default' 
              : 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-600 hover:shadow-brand-500/40'
            }`}
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {isSaved ? '已保存至报告库' : '保存完整评估报告'}
          </button>
       </div>
    </div>
  );
};

// --- 子组件提取：推荐结果列表 ---
const RecommendationResultList = ({ items, onClose, onItemClick }: { items: RecommendationItem[], onClose: () => void, onItemClick: (item: RecommendationItem) => void }) => (
  <div className="flex flex-col h-full bg-white relative">
     <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          推荐位置 TOP {items.length}
        </h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <X size={20} />
        </button>
     </div>
     
     <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onItemClick(item)}
            className="group bg-white rounded-xl p-4 border border-slate-100 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
          >
             {/* Rank Badge */}
             <div className="absolute top-0 left-0 w-1 h-full bg-slate-200 group-hover:bg-orange-500 transition-colors"></div>
             
             <div className="flex justify-between items-start mb-2 pl-2">
                <div className="flex items-center gap-3">
                   <span className="text-xl font-extrabold text-slate-300 group-hover:text-orange-500 font-mono italic">
                      {item.rank}
                   </span>
                   <h4 className="font-bold text-slate-800 text-base">{item.name}</h4>
                </div>
                <div className="flex items-center gap-1 text-orange-500 font-extrabold">
                   <span className="text-lg">{item.score}</span>
                   <span className="text-xs font-medium self-end mb-1">分</span>
                </div>
             </div>

             <div className="pl-2 mb-3 flex flex-wrap gap-1.5">
                {item.tags.slice(0, 3).map((tag, i) => (
                   <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">
                      {tag}
                   </span>
                ))}
                <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                   开店热度高
                </span>
             </div>
             
             {/* Jump Icon */}
             <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRightCircle size={20} className="text-orange-400" />
             </div>
          </div>
        ))}
     </div>
  </div>
);

export const DashboardPage: React.FC = () => {
  const { user, merchant, logout, switchMerchant, getUserMerchants } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  
  // 核心逻辑：判断当前是否处于地图工作台模式
  const isMapMode = MAP_MODES.includes(currentView);
  
  // 商户切换菜单状态
  const [isMerchantMenuOpen, setMerchantMenuOpen] = useState(false);
  const [myMerchants, setMyMerchants] = useState<Merchant[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);

  // 消息通知状态
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: '系统更新', content: '选址地图数据已更新至2025 Q1版本。', time: '2小时前', type: 'info', read: false }
  ]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Toast 状态
  const [toastMsg, setToastMsg] = useState<{text: string, type: 'info' | 'success'} | null>(null);

  // --- 战略地图数据 ---
  const [strategicData, setStrategicData] = useState<StrategicPoint[]>([]);

  // --- 选址评估状态 ---
  const [evalForm, setEvalForm] = useState({
    address: '',
    radius: 1, // km
    industry: '',
    preferredBrands: '',
    avoidBrands: ''
  });
  const [isPinningMode, setIsPinningMode] = useState(false); // 是否处于地图扎点模式
  const [pinDialog, setPinDialog] = useState<{visible: boolean, lat: number, lng: number, name: string} | null>(null);
  
  // 评估执行状态
  const [evalStatus, setEvalStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [loadingStage, setLoadingStage] = useState(0); // 0:提取, 1:计算, 2:生成
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  
  // 报告保存相关状态
  const [isReportSaved, setIsReportSaved] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- 选址推荐状态 ---
  const [recStatus, setRecStatus] = useState<'idle' | 'submitting' | 'processing' | 'success'>('idle');
  const [recProgress, setRecProgress] = useState(0); // 0-100
  const [recResult, setRecResult] = useState<RecommendationResult | null>(null);
  const [selectedRecItem, setSelectedRecItem] = useState<RecommendationItem | null>(null); // 新增：当前选中的推荐项
  const [recForm, setRecForm] = useState({
    scopeType: 'district', // 'city' | 'district'
    scopeValue: '',
    locationTypePreference: 'none', // 'none' | 'aoi' | 'poi'
    siteTypes: [] as string[], // for AOI
    poiType: '', // for POI
    poiRadius: 500, // for POI
    industry: '',
    preferredBrands: '',
    avoidBrands: ''
  });

  const toggleSiteType = (type: string) => {
    setRecForm(prev => {
        const exists = prev.siteTypes.includes(type);
        if (exists) return { ...prev, siteTypes: prev.siteTypes.filter(t => t !== type) };
        return { ...prev, siteTypes: [...prev.siteTypes, type] };
    });
  };

  // --- 报告管理状态 ---
  const [reports, setReports] = useState<Report[]>([]);
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'all' | 'generating' | 'completed'>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // 临时：报告查看时生成的Mock数据
  const [activeReportRecResult, setActiveReportRecResult] = useState<RecommendationResult | null>(null);

  // 监听视图切换，加载不同数据
  useEffect(() => {
    if (currentView === 'report') {
       mockService.getReportsAPI().then(setReports);
    } else if (currentView === 'dashboard') {
       // 加载战略地图数据
       mockService.getStrategicMapDataAPI('mock_id').then(setStrategicData);
    } else {
      setSelectedReport(null);
      setActiveReportRecResult(null);
      setSelectedRecItem(null);
    }
  }, [currentView]);

  useEffect(() => {
    if (isMerchantMenuOpen) {
      getUserMerchants().then(setMyMerchants);
    }
  }, [isMerchantMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMerchantMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 扎点模式开启
  const startPinning = () => {
    setIsPinningMode(true);
    setToastMsg({ text: '请在地图上选择点位，补充点位信息后确认添加', type: 'info' });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // 地图点击回调
  const handleMapClick = (lat: number, lng: number) => {
    if (isPinningMode) {
      setPinDialog({ visible: true, lat, lng, name: '' });
    }
  };

  // 确认扎点
  const confirmPin = () => {
    if (pinDialog && pinDialog.name) {
      setEvalForm({ ...evalForm, address: pinDialog.name });
      setPinDialog(null);
      setIsPinningMode(false);
      setToastMsg({ text: '点位已添加', type: 'success' });
      setTimeout(() => setToastMsg(null), 2000);
    } else {
      alert("请输入点位名称");
    }
  };

  // 执行评估
  const handleStartEvaluation = async () => {
    if (!evalForm.address) {
       setToastMsg({ text: '请先输入地址或在地图选点', type: 'info' });
       return;
    }
    if (!user) return;

    try {
       // 1. 检查额度
       const quotaCheck = await mockService.checkQuotaAPI(user.id, 'siteEvaluationLimit');
       if (!quotaCheck.allowed) {
          alert(quotaCheck.message);
          return;
       }

       setEvalStatus('loading');
       setLoadingStage(0);
       setIsReportSaved(false); // 重置保存状态

       // 模拟进度条文案切换
       const timer = setInterval(() => {
          setLoadingStage(prev => {
             if (prev >= 2) {
                clearInterval(timer);
                return 2;
             }
             return prev + 1;
          });
       }, 1000); 

       // 2. 调用API
       const result = await mockService.runEvaluationAPI(user.id, evalForm);
       
       setEvalResult(result);
       setEvalStatus('success');
       clearInterval(timer);
       setToastMsg({ text: '评估报告生成成功', type: 'success' });

    } catch (e: any) {
       setEvalStatus('idle');
       alert(e.message);
    }
  };

  // 尝试关闭评估报告
  const tryCloseEvaluation = () => {
    if (evalStatus === 'success' && !isReportSaved) {
      setShowExitConfirm(true);
    } else {
      resetEvaluation();
    }
  };

  // 确认不保存直接退出
  const confirmExitEvaluation = () => {
    setShowExitConfirm(false);
    resetEvaluation();
  };

  // 重置评估
  const resetEvaluation = () => {
    setEvalStatus('idle');
    setEvalResult(null);
    setIsReportSaved(false);
  };

  // 保存报告
  const handleSaveReport = async () => {
    if (!user) return;
    // 需要根据当前上下文保存（推荐详情 或 独立评估）
    const targetResult = (currentView === 'recommendation' && selectedRecItem) 
        ? mapRecToEval(selectedRecItem) 
        : evalResult;

    if (!targetResult) return;

    setIsSaving(true);
    try {
      await mockService.saveReportAPI(user.id, targetResult);
      setIsReportSaved(true);
      setToastMsg({ text: '报告与地图快照保存成功', type: 'success' });
    } catch(e) {
      setToastMsg({ text: '保存失败', type: 'info' });
    } finally {
      setIsSaving(false);
    }
  };

  // --- 推荐逻辑 ---
  const handleStartRecommendation = async () => {
    if (!user) return;
    setRecStatus('submitting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setRecStatus('processing');
      setRecProgress(0);

      const progressTimer = setInterval(() => {
        setRecProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressTimer);
            return 95;
          }
          return prev + Math.floor(Math.random() * 5);
        });
      }, 200);

      const result = await mockService.runRecommendationAPI(user.id, recForm);
      
      clearInterval(progressTimer);
      setRecProgress(100);
      setRecResult(result);
      setRecStatus('success');
      
    } catch (e: any) {
      setRecStatus('idle');
      alert(e.message);
    }
  };

  // 点击推荐列表项：进入子详情页
  const handleViewRecDetail = (item: RecommendationItem) => {
    setSelectedRecItem(item);
    setIsReportSaved(false); // 新查看的报告未保存
  };

  // 从推荐详情返回列表
  const handleBackToRecList = () => {
    setSelectedRecItem(null);
  };

  const resetRecommendation = () => {
    setRecStatus('idle');
    setRecResult(null);
    setSelectedRecItem(null);
  };

  // 处理报告点击
  const handleReportClick = async (report: Report) => {
    setSelectedReport(report);
    if (report.type === 'recommendation') {
        // 如果是推荐报告，生成 Mock 的推荐结果数据
        const mockRecResult = await mockService.runRecommendationAPI('mock', {});
        setActiveReportRecResult(mockRecResult);
    } else {
        setActiveReportRecResult(null);
    }
    // 重置子项选择
    setSelectedRecItem(null);
  };

  // 根据当前上下文计算 EvaluationResult（用于地图渲染和评估详情显示）
  const getCurrentEvaluationData = () => {
    // 1. 实时评估结果
    if (currentView === 'evaluation' && evalResult) return evalResult;
    
    // 2. 实时推荐选中的子项
    if (currentView === 'recommendation' && selectedRecItem) return mapRecToEval(selectedRecItem);
    
    // 3. 报告查看：选中的评估报告
    if (currentView === 'report' && selectedReport?.type === 'evaluation') {
        return {
            score: selectedReport.score || 90,
            locationName: selectedReport.address || selectedReport.name,
            tags: ['历史报告', '已保存'],
            dimensions: [
                { subject: '商业成熟度', A: 88, fullMark: 100 },
                { subject: '客群与客流', A: 92, fullMark: 100 },
                { subject: '行业发展趋势', A: 85, fullMark: 100 },
                { subject: '竞争格局评估', A: 90, fullMark: 100 },
                { subject: '发展潜力评估', A: 88, fullMark: 100 },
            ],
            detailScores: [],
            aiSummary: "这是一份历史评估报告的存档数据。",
            geoData: {
                center: [22.5431, 113.9585], 
                radius: 1000,
                pois: []
            }
        } as EvaluationResult;
    }

    // 4. 报告查看：推荐报告中选中的子项
    if (currentView === 'report' && selectedReport?.type === 'recommendation' && selectedRecItem) {
        return mapRecToEval(selectedRecItem);
    }

    return null;
  };

  const currentOverlayData = getCurrentEvaluationData()?.geoData || null;
  
  // 决定何时显示推荐围栏
  const currentRecommendationData = (() => {
      // 1. 实时推荐成功且未选中子项
      if (currentView === 'recommendation' && recStatus === 'success' && !selectedRecItem) {
          return recResult?.items;
      }
      // 2. 查看推荐报告且未选中子项
      if (currentView === 'report' && selectedReport?.type === 'recommendation' && activeReportRecResult && !selectedRecItem) {
          return activeReportRecResult.items;
      }
      return null;
  })();

  const handleNavItemClick = (view: ViewType) => {
    if (currentView === 'evaluation' && evalStatus === 'success' && !isReportSaved) {
       if (!window.confirm("当前评估报告未保存，切换视图将丢失数据。确认离开？")) return;
       resetEvaluation();
    }
    // 切换视图时清空推荐选中状态
    if (view !== 'recommendation') {
        setSelectedRecItem(null);
    }
    setCurrentView(view); 
    setSidebarOpen(false); 
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.name.includes(reportSearch) || r.creatorName.includes(reportSearch);
    const matchesStatus = reportStatusFilter === 'all' || r.status === reportStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 1. 侧边栏 */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-24 bg-dark-950 text-white flex flex-col transition-transform duration-300 transform border-r border-white/5 shadow-2xl shrink-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-24 flex flex-col items-center justify-center border-b border-white/5 shrink-0">
           <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer hover:scale-105 transition-transform">
             <Zap size={22} fill="currentColor" />
           </div>
        </div>
        
        {/* 导航 */}
        <nav className="flex-1 overflow-y-auto custom-scrollbar py-4 flex flex-col gap-2">
          <div className="space-y-1">
            <NavItem onClick={() => handleNavItemClick('dashboard')} icon={<Map size={24} />} label="战略地图" view="dashboard" currentView={currentView} />
            <NavItem onClick={() => handleNavItemClick('evaluation')} icon={<MapPin size={24} />} label="选址评估" view="evaluation" currentView={currentView} />
            <NavItem onClick={() => handleNavItemClick('recommendation')} icon={<Compass size={24} />} label="选址推荐" view="recommendation" currentView={currentView} />
            <NavItem onClick={() => handleNavItemClick('report')} icon={<FileText size={24} />} label="报告管理" view="report" currentView={currentView} />
          </div>
          <div className="py-6 px-5 w-full flex items-center justify-center relative group">
             <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
             <div className="absolute w-1 h-1 rounded-full bg-slate-600 group-hover:bg-brand-500 transition-colors"></div>
          </div>
          <div className="space-y-1">
            <NavItem onClick={() => handleNavItemClick('team')} icon={<Users size={24} />} label="团队管理" view="team" currentView={currentView} />
            <NavItem onClick={() => handleNavItemClick('settings')} icon={<Settings size={24} />} label="企业设置" view="settings" currentView={currentView} />
          </div>
        </nav>

        {/* 底部功能 */}
        <div className="pb-6 pt-2 flex flex-col items-center justify-center gap-5 relative">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`relative p-2.5 rounded-full transition-all group ${isNotifOpen ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
               <Bell size={20} className={unreadCount > 0 ? "animate-pulse-slow" : ""} />
               {unreadCount > 0 && (
                 <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-dark-950 shadow-sm">
                   {unreadCount}
                 </span>
               )}
            </button>
            {/* Notification Dropdown (增强版) */}
            {isNotifOpen && (
              <div className="absolute bottom-2 left-full ml-4 w-80 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50 origin-bottom-left flex flex-col animate-fade-in">
                 <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-dark-900/50 backdrop-blur-sm">
                    <span className="text-sm font-bold text-white flex items-center gap-2"><Bell size={14} className="text-brand-500"/> 消息通知</span>
                    <button className="text-[10px] text-slate-400 hover:text-white transition-colors">全部已读</button>
                 </div>
                 <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group ${!n.read ? 'bg-white/5' : ''}`}>
                           <div className="flex justify-between items-start mb-1.5">
                              <span className={`text-xs font-bold ${!n.read ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'}`}>{n.title}</span>
                              <span className="text-[10px] text-slate-600 whitespace-nowrap ml-2">{n.time}</span>
                           </div>
                           <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-300">{n.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center flex flex-col items-center gap-2">
                         <Bell size={24} className="text-slate-700" />
                         <span className="text-slate-500 text-xs">暂无新消息</span>
                      </div>
                    )}
                 </div>
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button onClick={() => setMerchantMenuOpen(!isMerchantMenuOpen)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${isMerchantMenuOpen ? 'ring-2 ring-brand-500 scale-105' : 'hover:ring-2 hover:ring-slate-600'}`}>
               <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-lg border border-white/10">{user?.name?.[0] || 'U'}</div>
               <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-dark-950 rounded-full"></span>
            </button>
             {/* Merchant Menu (增强版) */}
             {isMerchantMenuOpen && (
                <div className="absolute bottom-4 left-full ml-4 w-72 bg-dark-800 rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50 origin-bottom-left animate-fade-in flex flex-col">
                  {/* Header: Current Info */}
                  <div className="p-4 border-b border-white/5 bg-gradient-to-r from-dark-800 to-dark-900">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                           {user?.name?.[0] || 'U'}
                        </div>
                        <div className="overflow-hidden">
                           <div className="text-sm font-bold text-white truncate">{user?.name}</div>
                           <div className="text-xs text-slate-400 truncate">{user?.phone}</div>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/5">
                        <Building2 size={14} className="text-brand-400 shrink-0" />
                        <span className="text-xs font-medium text-slate-200 truncate">{merchant?.name || '未选择企业'}</span>
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded ml-auto shrink-0">当前</span>
                     </div>
                  </div>

                  {/* Merchant List */}
                  <div className="p-2 max-h-48 overflow-y-auto custom-scrollbar">
                     <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">切换企业主体</div>
                     {myMerchants.map(m => (
                        <button 
                           key={m.id}
                           onClick={() => { switchMerchant(m.id); setMerchantMenuOpen(false); }}
                           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${
                              m.id === merchant?.id 
                              ? 'bg-brand-500/10 text-brand-400 cursor-default' 
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                           }`}
                        >
                           <div className={`w-1.5 h-1.5 rounded-full ${m.id === merchant?.id ? 'bg-brand-500 shadow-[0_0_8px_#10b981]' : 'bg-slate-600'}`}></div>
                           <span className="truncate flex-1 text-left">{m.name}</span>
                           {m.id === merchant?.id && <Check size={14} />}
                        </button>
                     ))}
                     <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl border border-dashed border-slate-700 hover:border-slate-500 mt-2 transition-all group">
                        <div className="w-5 h-5 rounded-full border border-slate-500 flex items-center justify-center group-hover:border-white transition-colors">
                           <Plus size={12} />
                        </div>
                        创建或加入新企业
                     </button>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-2 border-t border-white/5 bg-dark-900/30">
                    <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all">
                       <LogOut size={14} /> 退出登录
                    </button>
                  </div>
                </div>
             )}
          </div>
        </div>
      </aside>

      {/* 2. 主内容区域 */}
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {/* ... (Unchanged Header) ... */}
        <button className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md text-slate-600" onClick={() => setSidebarOpen(true)}>
           <Menu size={20} />
        </button>

        {toastMsg && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] bg-dark-900/90 backdrop-blur text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 flex items-center gap-3 animate-slide-up">
            {toastMsg.type === 'success' ? <Check className="text-emerald-500" size={18} /> : <Info className="text-blue-500" size={18} />}
            <span className="text-sm font-medium">{toastMsg.text}</span>
          </div>
        )}

        {/* 选址推荐：悬浮进度条 (右下角) */}
        {recStatus === 'processing' && currentView === 'recommendation' && (
           <div className="absolute bottom-10 right-10 z-[1000] bg-dark-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 w-80 animate-slide-up">
              <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                    <Loader2 size={18} className="text-brand-500 animate-spin" />
                    <span className="text-sm font-bold">选址推荐计算中...</span>
                 </div>
                 <span className="text-sm font-mono text-brand-400">{recProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-dark-700 rounded-full overflow-hidden">
                 <div 
                    className="h-full bg-brand-500 transition-all duration-300" 
                    style={{ width: `${recProgress}%` }}
                 ></div>
              </div>
              <p className="text-xs text-slate-400 mt-2">正在进行全城网格扫描与POI热力分析</p>
           </div>
        )}

        {/* 未保存退出确认弹窗 */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-[1100] bg-black/40 backdrop-blur-sm flex items-center justify-center">
             <div className="bg-white rounded-2xl p-6 w-80 shadow-2xl animate-slide-up border border-slate-100 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mx-auto mb-4">
                   <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">确认退出？</h3>
                <p className="text-sm text-slate-500 mb-6">当前评估报告尚未保存，直接退出将导致分析数据丢失。</p>
                <div className="flex gap-3">
                   <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">取消</button>
                   <button onClick={confirmExitEvaluation} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-500/20">确认退出</button>
                </div>
             </div>
          </div>
        )}

        {/* 2.1 地图容器 */}
        <div className={`absolute inset-0 z-0`}>
           <MapBase 
             onMapClick={handleMapClick} 
             isPinning={isPinningMode} 
             overlayData={currentOverlayData}
             recommendationData={currentRecommendationData}
             focusedRecItem={selectedRecItem}
             strategicData={currentView === 'dashboard' ? strategicData : null} // 传递战略地图数据
           />
           
           {currentView === 'report' && selectedReport && !selectedRecItem && activeReportRecResult === null && (
             <div className="absolute inset-0 pointer-events-none z-0">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-brand-500 bg-brand-500/10 rounded-full animate-pulse-slow">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded shadow text-xs font-bold text-brand-700 whitespace-nowrap">
                     {selectedReport.address}
                  </div>
               </div>
             </div>
           )}
        </div>

        {/* 改进后的扎点跟随图标 */}
        {isPinningMode && (
          <div 
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[900] pointer-events-none flex flex-col items-center"
             style={{ marginTop: '-24px' }}
          >
             <div className="text-red-500 drop-shadow-xl animate-bounce">
                <MapPin size={48} fill="currentColor" stroke="white" strokeWidth={1.5} />
             </div>
             <div className="bg-dark-900/80 backdrop-blur text-white px-4 py-1.5 rounded-full shadow-xl flex items-center gap-2 mt-2">
                <span className="text-xs font-bold">请点击地图确定位置</span>
             </div>
          </div>
        )}

        {/* Pin Dialog Modal */}
        {pinDialog && pinDialog.visible && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
             <div className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-slide-up border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin size={18} className="text-blue-500"/> 确认点位信息</h3>
                   <button onClick={() => {setPinDialog(null); setIsPinningMode(false);}} className="text-slate-400 hover:text-slate-600"><X size={18}/></button>
                </div>
                <div className="space-y-4">
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs font-bold text-slate-500 mb-1">经纬度坐标</div>
                      <div className="text-sm font-mono font-bold text-slate-800">{pinDialog.lat.toFixed(6)}, {pinDialog.lng.toFixed(6)}</div>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">点位名称</label>
                      <input 
                        autoFocus
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none placeholder:font-normal placeholder:text-slate-400"
                        placeholder="请输入该点位名称"
                        value={pinDialog.name}
                        onChange={e => setPinDialog({...pinDialog, name: e.target.value})}
                      />
                   </div>
                   <div className="pt-2 flex gap-2">
                      <button onClick={() => {setPinDialog(null); setIsPinningMode(false);}} className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">取消</button>
                      <button onClick={confirmPin} className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/20">确认添加</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {!isMapMode && (
          <div className="absolute inset-0 z-10 bg-[#F8FAFC] overflow-auto animate-fade-in">
             {currentView === 'team' && <TeamPage />}
             {currentView === 'settings' && <SettingsPage />}
          </div>
        )}

        {isMapMode && (
          <div className="absolute inset-0 z-10 pointer-events-none">
             {/* Top Banner (Unchanged) */}
             <div className="absolute top-0 left-0 w-full p-4 pointer-events-none flex justify-center">
                <div className="bg-white/90 backdrop-blur-md shadow-lg border border-slate-200/50 rounded-full px-6 py-2 flex items-center gap-4 pointer-events-auto transition-all hover:scale-105">
                   <div className="flex items-center gap-2 text-slate-700 font-bold text-sm border-r border-slate-200 pr-4">
                      <Building2 size={14} className="text-brand-500" />
                      {merchant?.name}
                   </div>
                   <div className="text-xs text-slate-500 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      地图引擎就绪
                   </div>
                </div>
             </div>

             {/* 经营概览卡片 (Unchanged) */}
             {currentView === 'dashboard' && (
                <div className="absolute top-20 left-6 w-80 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-5 pointer-events-auto animate-slide-up">
                      <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-800 flex items-center gap-2">
                           <Map size={18} className="text-brand-500" /> 经营概览
                         </h3>
                         <span className="text-[10px] bg-brand-50 text-brand-600 px-2 py-0.5 rounded-full font-bold">2025 Q1</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">已开门店</div>
                            <div className="text-xl font-extrabold text-slate-800">128</div>
                         </div>
                         <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <div className="text-xs text-slate-400 mb-1">覆盖城市</div>
                            <div className="text-xl font-extrabold text-slate-800">15</div>
                         </div>
                      </div>
                </div>
             )}

             {/* === 场景 B: 选址评估 UI === */}
             {currentView === 'evaluation' && (
                <>
                   {/* 左侧容器：统一宽度 w-96 */}
                   <div className="absolute top-4 left-4 bottom-4 w-96 bg-white shadow-2xl rounded-2xl border border-slate-200 pointer-events-auto animate-slide-up flex flex-col overflow-hidden">
                      {/* State 1: 评估表单 */}
                      {evalStatus === 'idle' && (
                        <>
                          <div className="p-5 pb-2 border-b border-transparent">
                             <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic flex items-center gap-2">
                               <Sparkles size={20} className="text-blue-500" />
                               位置好不好，评估下就知道
                             </h2>
                          </div>

                          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                             {/* 1. 评估范围 */}
                             <div className="relative pl-4 border-l-4 border-blue-500">
                               <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                                  选择评估范围
                               </h3>
                               <div className="space-y-3">
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-2 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400"
                                        placeholder="输入搜索位置"
                                        value={evalForm.address}
                                        onChange={e => setEvalForm({...evalForm, address: e.target.value})}
                                      />
                                      <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                                    </div>
                                    <button 
                                      onClick={startPinning}
                                      className={`px-2 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all border shrink-0 ${
                                        isPinningMode 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                        : 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100'
                                      }`}
                                    >
                                       {isPinningMode ? <Crosshair size={14} className="animate-spin-slow" /> : <MapPin size={14} />}
                                       扎点
                                    </button>
                                  </div>

                                  <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                                     {[0.5, 1, 2, 3].map(r => (
                                        <button
                                          key={r}
                                          onClick={() => setEvalForm({...evalForm, radius: r})}
                                          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                             evalForm.radius === r
                                             ? 'bg-white text-blue-600 shadow-sm border border-slate-100' 
                                             : 'text-slate-400 hover:text-slate-600'
                                          }`}
                                        >
                                           {r}km
                                        </button>
                                     ))}
                                  </div>
                               </div>
                             </div>

                             {/* 2. 选择开店行业 */}
                             <div className="relative pl-4 border-l-4 border-blue-500">
                               <h3 className="text-sm font-bold text-slate-800 mb-3">选择开店行业</h3>
                               <div className="relative">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-700 cursor-pointer hover:border-blue-300 transition-colors"
                                    value={evalForm.industry}
                                    onChange={e => setEvalForm({...evalForm, industry: e.target.value})}
                                  >
                                     <option value="">请选择行业分类...</option>
                                     <option value="coffee">咖啡/茶饮</option>
                                     <option value="fastfood">中式快餐</option>
                                     <option value="retail">零售便利</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                               </div>
                             </div>

                             {/* 3. 偏好品牌 */}
                             <div className="relative pl-4 border-l-4 border-blue-500">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                   偏好品牌 
                                   <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(选填)</span>
                                </h3>
                                <div className="relative group">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-700 cursor-pointer hover:border-blue-300 transition-colors"
                                    value={evalForm.preferredBrands}
                                    onChange={e => setEvalForm({...evalForm, preferredBrands: e.target.value})}
                                  >
                                     <option value="">请选择偏好品牌...</option>
                                     <option value="starbucks">星巴克 (Starbucks)</option>
                                     <option value="luckin">瑞幸咖啡 (Luckin)</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>

                             {/* 4. 避开品牌 */}
                             <div className="relative pl-4 border-l-4 border-blue-500">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                   避开品牌
                                   <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(选填)</span>
                                </h3>
                                <div className="relative group">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm text-slate-700 cursor-pointer hover:border-blue-300 transition-colors"
                                    value={evalForm.avoidBrands}
                                    onChange={e => setEvalForm({...evalForm, avoidBrands: e.target.value})}
                                  >
                                     <option value="">请选择需要避开的竞品...</option>
                                     <option value="competitor_a">竞品 A</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>
                          </div>

                          {/* Footer */}
                          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-slate-400">预计消耗额度: 1 次</span>
                             </div>
                             <button 
                               onClick={handleStartEvaluation}
                               className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                             >
                                开始评估
                             </button>
                          </div>
                        </>
                      )}

                      {/* State 2: 更有趣的加载动画 */}
                      {evalStatus === 'loading' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                           {/* 动画容器 */}
                           <div className="w-48 h-48 relative mb-8 flex items-center justify-center">
                              {/* 雷达扫描效果 */}
                              <div className="absolute inset-0 border-2 border-blue-100 rounded-full animate-[ping_3s_linear_infinite]"></div>
                              <div className="absolute inset-4 border border-blue-200 rounded-full"></div>
                              <div className="absolute inset-12 border border-blue-300 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden">
                                  <div className="absolute inset-0 bg-blue-50/50"></div>
                                  {/* 阶段图标切换 */}
                                  <div className="relative z-10 transition-all duration-500 transform">
                                     {loadingStage === 0 && <Database size={40} className="text-blue-500 animate-pulse" />}
                                     {loadingStage === 1 && <Cpu size={40} className="text-purple-500 animate-pulse" />}
                                     {loadingStage === 2 && <FileCheck size={40} className="text-emerald-500 animate-bounce" />}
                                  </div>
                              </div>
                              {/* 扫描针 */}
                              <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 opacity-20 animate-spin"></div>
                           </div>

                           <div className="space-y-4 w-full px-4">
                              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                                {loadingStage === 0 ? "正在提取地理数据..." :
                                 loadingStage === 1 ? "AI模型正在演算..." : "正在生成评估报告..."}
                              </h3>
                              
                              {/* 进度条 */}
                              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000 ease-out"
                                    style={{ width: loadingStage === 0 ? '30%' : loadingStage === 1 ? '70%' : '95%' }}
                                 ></div>
                              </div>
                              
                              <p className="text-xs text-slate-400 font-medium">预计剩余时间: {3 - loadingStage}秒</p>
                           </div>
                        </div>
                      )}

                      {/* State 3: 评估结果报告 (独立评估模式) */}
                      {evalStatus === 'success' && evalResult && (
                        <EvaluationReportView 
                           result={evalResult} 
                           onClose={tryCloseEvaluation} 
                           onSave={handleSaveReport}
                           isSaved={isReportSaved}
                           isSaving={isSaving}
                        />
                      )}
                   </div>
                </>
             )}

             {/* === 场景 C: 选址推荐 UI (更新) === */}
             {currentView === 'recommendation' && (
                <>
                   {/* 左侧容器：统一宽度 w-96 */}
                   <div className="absolute top-4 left-4 bottom-4 w-96 bg-white shadow-2xl rounded-2xl border border-slate-200 pointer-events-auto animate-slide-up flex flex-col overflow-hidden">
                      
                      {/* 1. 推荐表单 (Idle State) */}
                      {recStatus === 'idle' && (
                        <>
                          <div className="p-5 pb-2 border-b border-transparent">
                             <h2 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 italic flex items-center gap-2">
                               <Compass size={20} className="text-purple-500" />
                               找不到好位置，推荐下
                             </h2>
                          </div>

                          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                             {/* 1. Range (Updated) */}
                             <div className="relative pl-4 border-l-4 border-purple-500">
                               <h3 className="text-sm font-bold text-slate-800 mb-3">选择开店范围</h3>
                               
                               {/* Scope Toggle */}
                               <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 mb-3">
                                  {(['district', 'city'] as const).map(type => (
                                    <button
                                       key={type}
                                       onClick={() => setRecForm({...recForm, scopeType: type, scopeValue: ''})}
                                       className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                          recForm.scopeType === type 
                                          ? 'bg-white text-purple-600 shadow-sm' 
                                          : 'text-slate-400 hover:text-slate-600'
                                       }`}
                                    >
                                       {type === 'city' ? '按城市' : '按行政区'}
                                    </button>
                                  ))}
                               </div>

                               <div className="relative">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-700"
                                    value={recForm.scopeValue}
                                    onChange={e => setRecForm({...recForm, scopeValue: e.target.value})}
                                  >
                                     <option value="">{recForm.scopeType === 'city' ? '选择城市...' : '选择行政区...'}</option>
                                     {recForm.scopeType === 'city' ? (
                                        <>
                                           <option value="shanghai">上海市</option>
                                           <option value="hangzhou">杭州市</option>
                                           <option value="shenzhen">深圳市</option>
                                        </>
                                     ) : (
                                        <>
                                           <option value="nanshan">深圳市-南山区</option>
                                           <option value="futian">深圳市-福田区</option>
                                           <option value="luohu">深圳市-罗湖区</option>
                                        </>
                                     )}
                                  </select>
                                  <ChevronDown className="absolute right-4 top-3 text-slate-400 pointer-events-none" size={16} />
                               </div>
                             </div>

                             {/* 2. Site Type (Updated Logic) */}
                             <div className="relative pl-4 border-l-4 border-purple-500">
                               <h3 className="text-sm font-bold text-slate-800 mb-3">选择开店店址类型</h3>
                               
                               {/* Preference Radio */}
                               <div className="flex gap-4 mb-3 flex-wrap">
                                  {[
                                    { id: 'none', label: '无偏好' },
                                    { id: 'aoi', label: '偏好AOI' },
                                    { id: 'poi', label: '偏好POI' }
                                  ].map(opt => (
                                     <label key={opt.id} className="flex items-center gap-1.5 cursor-pointer">
                                        <input 
                                          type="radio" 
                                          name="locTypePref"
                                          className="w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                                          checked={recForm.locationTypePreference === opt.id}
                                          onChange={() => setRecForm({...recForm, locationTypePreference: opt.id})}
                                        />
                                        <span className="text-xs text-slate-600">{opt.label}</span>
                                     </label>
                                  ))}
                               </div>

                               {/* Conditional Rendering */}
                               {recForm.locationTypePreference === 'aoi' && (
                                  <div className="grid grid-cols-2 gap-2 animate-fade-in bg-slate-50 p-2 rounded-xl border border-slate-100">
                                     {['住宅', '产业园区', '商场', '医院'].map(type => (
                                        <button
                                          key={type}
                                          onClick={() => toggleSiteType(type)}
                                          className={`py-2 px-2 rounded-lg text-xs font-bold transition-all border ${
                                             recForm.siteTypes.includes(type)
                                             ? 'bg-white text-purple-600 border-purple-200 shadow-sm'
                                             : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-200/50'
                                          }`}
                                        >
                                          {type}
                                        </button>
                                     ))}
                                  </div>
                               )}

                               {recForm.locationTypePreference === 'poi' && (
                                  <div className="space-y-3 animate-fade-in bg-slate-50 p-3 rounded-xl border border-slate-100">
                                     <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">POI 类型 (三级分类)</label>
                                        <div className="relative">
                                           <select 
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none text-slate-700"
                                              value={recForm.poiType}
                                              onChange={e => setRecForm({...recForm, poiType: e.target.value})}
                                           >
                                              <option value="">请选择类型...</option>
                                              <optgroup label="餐饮服务">
                                                 <option value="food_fast_chicken">餐饮 &gt; 小吃快餐 &gt; 炸鸡炸串</option>
                                                 <option value="food_drink_tea">餐饮 &gt; 咖啡茶饮 &gt; 奶茶果汁</option>
                                                 <option value="food_global_west">餐饮 &gt; 外国餐厅 &gt; 西餐</option>
                                              </optgroup>
                                              <optgroup label="购物服务">
                                                 <option value="shop_mall_general">购物 &gt; 商场 &gt; 综合商场</option>
                                                 <option value="shop_supermarket">购物 &gt; 超市 &gt; 大型超市</option>
                                              </optgroup>
                                              <optgroup label="生活服务">
                                                 <option value="life_bank_atm">生活 &gt; 金融 &gt; ATM</option>
                                                 <option value="life_hotel_star">生活 &gt; 酒店 &gt; 五星级酒店</option>
                                              </optgroup>
                                           </select>
                                           <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                     </div>
                                     <div>
                                        <label className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 block">辐射半径</label>
                                        <div className="relative">
                                           <select 
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-purple-500/20 appearance-none text-slate-700"
                                              value={recForm.poiRadius}
                                              onChange={e => setRecForm({...recForm, poiRadius: Number(e.target.value)})}
                                           >
                                              <option value={500}>500米</option>
                                              <option value={1000}>1km</option>
                                              <option value={2000}>2km</option>
                                              <option value={3000}>3km</option>
                                           </select>
                                           <ChevronDown className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={14} />
                                        </div>
                                     </div>
                                  </div>
                               )}
                             </div>

                             {/* 3. Industry */}
                             <div className="relative pl-4 border-l-4 border-purple-500">
                               <h3 className="text-sm font-bold text-slate-800 mb-3">选择开店行业</h3>
                               <div className="relative">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-700"
                                    value={recForm.industry}
                                    onChange={e => setRecForm({...recForm, industry: e.target.value})}
                                  >
                                     <option value="">请选择...</option>
                                     <option value="coffee">咖啡/茶饮</option>
                                     <option value="fastfood">中式快餐</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                               </div>
                             </div>

                             {/* 4. Preferred Brand */}
                             <div className="relative pl-4 border-l-4 border-purple-500">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                   偏好品牌 <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(选填)</span>
                                </h3>
                                <div className="relative group">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-700"
                                    value={recForm.preferredBrands}
                                    onChange={e => setRecForm({...recForm, preferredBrands: e.target.value})}
                                  >
                                     <option value="">请选择...</option>
                                     <option value="starbucks">星巴克</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>

                             {/* 5. Avoid Brand */}
                             <div className="relative pl-4 border-l-4 border-purple-500">
                                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                   避开品牌 <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">(选填)</span>
                                </h3>
                                <div className="relative group">
                                  <select 
                                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-sm text-slate-700"
                                    value={recForm.avoidBrands}
                                    onChange={e => setRecForm({...recForm, avoidBrands: e.target.value})}
                                  >
                                     <option value="">请选择...</option>
                                     <option value="comp_a">竞品 A</option>
                                  </select>
                                  <ChevronRight className="absolute right-4 top-3 rotate-90 text-slate-400 pointer-events-none" size={16} />
                                </div>
                             </div>
                          </div>

                          {/* Footer */}
                          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                             <div className="flex items-center justify-between mb-4">
                                <span className="text-xs text-slate-400">预计消耗额度: 5 次</span>
                             </div>
                             <button 
                               onClick={handleStartRecommendation}
                               className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-base"
                             >
                                开始推荐
                             </button>
                          </div>
                        </>
                      )}

                      {/* 2. 任务提交中 (Submitting State) */}
                      {recStatus === 'submitting' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                           <Loader2 size={48} className="text-purple-500 animate-spin mb-4" />
                           <h3 className="text-lg font-bold text-slate-800 mb-2">任务提交中</h3>
                           <p className="text-sm text-slate-500">正在为您创建全城扫描任务...</p>
                        </div>
                      )}

                      {/* 3. 处理中 (Processing State - 显示简单提示，主要看悬浮窗) */}
                      {recStatus === 'processing' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 relative overflow-hidden">
                           {/* 背景动画效果 */}
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-100/50 via-transparent to-transparent animate-pulse-slow"></div>
                           
                           <div className="relative z-10 bg-white p-6 rounded-2xl shadow-xl border border-purple-100 max-w-xs">
                              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Compass size={32} className="text-purple-500 animate-spin-slow" />
                              </div>
                              <h3 className="text-lg font-bold text-slate-800 mb-2">系统正在为您扫描全城</h3>
                              <p className="text-sm text-slate-500 mb-4">预计耗时 10-15 秒，请稍候...</p>
                              <div className="text-xs text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full inline-block font-medium">
                                 您可以在右下角查看实时进度
                              </div>
                           </div>
                        </div>
                      )}

                      {/* 4. 推荐结果列表 (Success State) */}
                      {recStatus === 'success' && recResult && !selectedRecItem && (
                        <RecommendationResultList 
                           items={recResult.items}
                           onClose={resetRecommendation}
                           onItemClick={handleViewRecDetail}
                        />
                      )}

                      {/* 5. 推荐结果详情 (子视图) */}
                      {recStatus === 'success' && selectedRecItem && (
                        <EvaluationReportView 
                           result={mapRecToEval(selectedRecItem)} 
                           onClose={handleBackToRecList} 
                           onSave={handleSaveReport}
                           isSaved={isReportSaved}
                           isSaving={isSaving}
                           backLabel="返回推荐列表"
                        />
                      )}
                   </div>
                </>
             )}

             {/* === 场景 D: 报告管理 UI (Updated) === */}
             {currentView === 'report' && (
                <>
                   <div className="absolute top-4 left-4 bottom-4 w-96 bg-white shadow-2xl rounded-2xl border border-slate-200 pointer-events-auto animate-slide-up flex flex-col overflow-hidden transition-all duration-300">
                      {!selectedReport ? (
                        <>
                           <div className="p-5 border-b border-slate-100 bg-white z-10">
                              <div className="flex justify-between items-center mb-4">
                                 <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                                   <FileText size={20} className="text-blue-500" /> 选址报告库
                                 </h3>
                                 <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs font-bold">{filteredReports.length}</span>
                              </div>
                              <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input type="text" placeholder="搜索名称" className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" value={reportSearch} onChange={(e) => setReportSearch(e.target.value)} />
                              </div>
                           </div>
                           
                           <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/50">
                              {filteredReports.map((report) => (
                                <div 
                                  key={report.id} 
                                  onClick={() => handleReportClick(report)}
                                  className="p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
                                >
                                   {/* 类型标识条 */}
                                   <div className={`absolute left-0 top-0 bottom-0 w-1 ${report.type === 'evaluation' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                   
                                   <div className="flex justify-between items-start mb-2 pl-2">
                                      <h4 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2">{report.name}</h4>
                                      {report.type === 'evaluation' ? (
                                         <MapPin size={16} className="text-blue-500 shrink-0 ml-2" />
                                      ) : (
                                         <Compass size={16} className="text-purple-500 shrink-0 ml-2" />
                                      )}
                                   </div>
                                   
                                   <div className="pl-2 space-y-1.5">
                                      <div className="flex items-center gap-2">
                                         <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            report.type === 'evaluation' 
                                            ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                            : 'bg-purple-50 text-purple-600 border-purple-100'
                                         }`}>
                                            {report.type === 'evaluation' ? '选址评估' : '选址推荐'}
                                         </span>
                                         <span className="text-xs text-slate-400">
                                            {new Date(report.createdAt).toLocaleDateString()}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </>
                      ) : (
                        // 报告详情视图：根据类型渲染不同组件
                        <>
                           {selectedReport.type === 'recommendation' && activeReportRecResult ? (
                              selectedRecItem ? (
                                <EvaluationReportView 
                                   result={mapRecToEval(selectedRecItem)} 
                                   onClose={handleBackToRecList} 
                                   onSave={() => alert("历史报告不支持重新保存")} 
                                   isSaved={true}
                                   backLabel="返回推荐列表"
                                />
                              ) : (
                                <RecommendationResultList 
                                   items={activeReportRecResult.items}
                                   onClose={() => setSelectedReport(null)}
                                   onItemClick={handleViewRecDetail}
                                />
                              )
                           ) : (
                              // 默认评估报告详情
                              <EvaluationReportView 
                                 result={getCurrentEvaluationData()} 
                                 onClose={() => setSelectedReport(null)} 
                                 onSave={() => {}}
                                 isSaved={true}
                              />
                           )}
                        </>
                      )}
                   </div>
                </>
             )}
          </div>
        )}
      </main>
    </div>
  );
};