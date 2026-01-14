
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// 数据权限范围
export type DataScope = 'ALL' | 'DEPT' | 'SELF';

// 具体的额度类型
export interface RoleQuota {
  siteEvaluationLimit: number;     // 选址评估次数 (-1 为无限)
  siteRecommendationLimit: number; // 选址推荐次数 (-1 为无限)
}

export interface Permission {
  code: string;
  name: string;
  module: string; // 'map' | 'analysis' | 'team' | 'settings'
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // 权限Code列表
  dataScope: DataScope;
  quota: RoleQuota;
  isSystem?: boolean; // 系统预置角色不可删除
}

export interface Department {
  id: string;
  parentId: string | null;
  name: string;
  managerId?: string; // 负责人ID
  children?: Department[]; // 树状结构辅助字段
}

export interface User {
  id: string; // Open Platform ID
  phone: string;
  name?: string;
  avatar?: string;
  currentMerchantId?: string | null;
  // SaaS 内部字段
  departmentId?: string;
  roleIds?: string[]; // 支持多角色
  status?: 'active' | 'disabled';
  
  // 模拟运行时字段
  usage?: {
    siteEvaluationCount: number;
  };
}

export interface Merchant {
  id: string;
  name: string;
  industry: string;
  logo?: string; // 企业Logo URL
  competitors?: string[]; // 竞品品牌列表
  status: 'active' | 'trial' | 'disabled';
  // 公司总额度池
  totalQuota: {
    siteEvaluationBalance: number; 
  };
}

export interface Report {
  id: string;
  name: string;
  type: 'evaluation' | 'recommendation';
  status: 'generating' | 'completed';
  createdAt: string; // ISO String
  creatorName: string;
  address?: string;
  score?: number; // 评分
}

// --- 评估结果接口 ---
export interface EvaluationResult {
  score: number;
  locationName: string;
  tags: string[];
  dimensions: {
    subject: string;
    A: number; // 当前点位得分
    fullMark: number;
  }[];
  detailScores: {
    label: string;
    score: number; // 0-100
    stars: number; // 0-5
  }[];
  aiSummary: string;
  // 地图渲染数据
  geoData: {
    center: [number, number];
    radius: number;
    pois: { lat: number; lng: number; type: 'residential' | 'office' | 'competitor' }[];
  };
}

// --- 新增：推荐结果接口 ---
export interface RecommendationItem {
  id: string;
  rank: number;
  name: string;
  score: number;
  tags: string[];
  matchReason: string; // 核心优势/匹配理由
  // 地图数据
  center: [number, number];
  polygon: [number, number][]; // 电子围栏坐标点集合
}

export interface RecommendationResult {
  taskId: string;
  items: RecommendationItem[];
}

// --- 新增：战略地图点位接口 ---
export interface StrategicPoint {
  id: string;
  lat: number;
  lng: number;
  name: string;
  type: 'own' | 'competitor'; // 自有门店 vs 竞品
  brand: string;
}

// --- 新增：战略地图聚合数据接口 ---
export interface StrategicCluster {
  id: string;
  lat: number;
  lng: number;
  regionName: string; // 行政区或商圈名
  ownCount: number;
  competitorCount: number;
  marketShare: number; // 0-100
}

export interface AuthState {
  user: User | null;
  merchant: Merchant | null; // 当前上下文的商户
  isAuthenticated: boolean;
  isLoading: boolean;
  checkUserStatus: () => Promise<void>;
  login: (phone: string, code: string) => Promise<void>;
  loginWithPassword: (phone: string, password: string) => Promise<void>;
  register: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  createMerchant: (data: Partial<Merchant>) => Promise<void>;
  updateMerchantProfile: (data: Partial<Merchant>) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  switchMerchant: (merchantId: string) => Promise<void>;
  getUserMerchants: () => Promise<Merchant[]>;
  acceptInvite: (token: string) => Promise<boolean>;
}

export interface InviteInfo {
  merchantId: string;
  merchantName: string;
  inviterName: string;
  expiresAt: number;
}