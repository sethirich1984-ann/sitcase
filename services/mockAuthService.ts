
import { User, Merchant, InviteInfo, Department, Role, Permission, RoleQuota, Report, EvaluationResult, RecommendationResult, RecommendationItem, StrategicPoint } from '../types';

// --- 初始化 Mock 数据 (注意定义顺序) ---

// 1. 权限定义 - 基于新业务架构重构
export const PERMISSIONS: Permission[] = [
  // 1. 战略经营地图
  { code: 'dashboard:view', name: '查看经营概览', module: 'dashboard' },
  { code: 'dashboard:financial', name: '查看营收敏感数据', module: 'dashboard' },

  // 2. 选址评估
  { code: 'evaluation:view', name: '进入评估地图', module: 'evaluation' },
  { code: 'evaluation:execute', name: '执行选址评估', module: 'evaluation' }, // 消耗额度

  // 3. 选址推荐
  { code: 'recommendation:view', name: '查看推荐任务', module: 'recommendation' },
  { code: 'recommendation:create', name: '创建智能推荐', module: 'recommendation' },

  // 4. 报告管理
  { code: 'report:view', name: '查看报告列表', module: 'report' },
  { code: 'report:export', name: '导出/下载报告', module: 'report' }, // 消耗额度

  // 5. 团队管理
  { code: 'team:view', name: '查看通讯录', module: 'team' },
  { code: 'team:manage', name: '成员管理 (增删改/邀请)', module: 'team' },
  { code: 'team:roles', name: '角色权限设置', module: 'team' },

  // 6. 企业设置
  { code: 'settings:view', name: '查看企业档案', module: 'settings' },
  { code: 'settings:edit', name: '编辑企业信息', module: 'settings' },
];

// 2. 角色定义 (使用 let 以便支持修改)
let MOCK_ROLES: Role[] = [
  {
    id: 'r_admin',
    name: '超级管理员',
    description: '拥有企业所有功能与数据权限',
    permissions: PERMISSIONS.map(p => p.code),
    dataScope: 'ALL',
    quota: { siteEvaluationLimit: -1, siteRecommendationLimit: -1 }, // 无限
    isSystem: true
  },
  {
    id: 'r_manager',
    name: '选址经理',
    description: '负责团队管理与审批，可查看所有数据',
    permissions: [
      'dashboard:view', 'dashboard:financial',
      'evaluation:view', 'evaluation:execute',
      'recommendation:view', 'recommendation:create',
      'report:view', 'report:export',
      'team:view', 'team:manage'
    ],
    dataScope: 'DEPT',
    quota: { siteEvaluationLimit: 200, siteRecommendationLimit: 50 },
    isSystem: false
  },
  {
    id: 'r_staff',
    name: '选址专员',
    description: '负责具体的选址评估执行',
    permissions: [
      'dashboard:view',
      'evaluation:view', 'evaluation:execute',
      'report:view',
      'team:view'
    ],
    dataScope: 'SELF',
    quota: { siteEvaluationLimit: 50, siteRecommendationLimit: 0 },
    isSystem: false
  }
];

// 3. 部门定义 (使用 let 以便支持修改)
let MOCK_DEPTS: Department[] = [
  { id: 'd_root', parentId: null, name: '总部', managerId: 'u_001' },
  { id: 'd_market', parentId: 'd_root', name: '市场拓展部', managerId: 'u_001' },
  { id: 'd_ops', parentId: 'd_root', name: '运营部' },
];

// 4. 商户定义
const MOCK_MERCHANTS: Merchant[] = [
  { 
    id: 'm_001', 
    name: 'Starbucks China', 
    industry: 'catering', 
    logo: '',
    competitors: ['瑞幸咖啡', 'Manner', 'Tims'],
    status: 'active',
    totalQuota: { siteEvaluationBalance: 1000 } 
  },
  { 
    id: 'm_002', 
    name: 'Tea Life (测试企业)', 
    industry: 'catering', 
    status: 'trial',
    totalQuota: { siteEvaluationBalance: 50 } 
  }
];

// 5. 用户定义
const MOCK_USERS: User[] = [
  { 
    id: 'u_001', 
    phone: '13800000000', 
    name: 'Admin User', 
    currentMerchantId: 'm_001',
    departmentId: 'd_root',
    roleIds: ['r_admin'],
    status: 'active',
    usage: { siteEvaluationCount: 5 }
  },
  { 
    id: 'u_002', 
    phone: '13900000000', 
    name: 'John Staff', 
    currentMerchantId: 'm_001',
    departmentId: 'd_market',
    roleIds: ['r_staff'],
    status: 'active',
    usage: { siteEvaluationCount: 45 } 
  },
];

// 6. 报告定义
const MOCK_REPORTS: Report[] = [
  {
    id: 'rep_001',
    name: '上海静安寺商圈深度评估报告',
    type: 'evaluation',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
    creatorName: 'John Staff',
    address: '上海市静安区南京西路1618号',
    score: 92
  },
  {
    id: 'rep_002',
    name: '深圳市南山区智能选址推荐方案',
    type: 'recommendation',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
    creatorName: 'Admin User',
    address: '深圳市南山区',
    score: 85
  },
  {
    id: 'rep_003',
    name: '北京朝阳大悦城周边客流分析',
    type: 'evaluation',
    status: 'generating',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5分钟前
    creatorName: 'John Staff',
    address: '北京市朝阳区朝阳北路101号'
  },
  {
    id: 'rep_004',
    name: '广州天河路商圈竞品监测',
    type: 'evaluation',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2天前
    creatorName: 'Admin User',
    address: '广州市天河区天河路208号',
    score: 88
  }
];

// 6. 用户-商户关联表
const MOCK_USER_MERCHANTS: Record<string, string[]> = {
  'u_001': ['m_001', 'm_002'],
  'u_002': ['m_001']
};

const MOCK_TOKENS: Record<string, InviteInfo> = {
  'valid-token-123': {
    merchantId: 'm_001',
    merchantName: 'Starbucks China',
    inviterName: 'Admin User',
    expiresAt: Date.now() + 86400000
  }
};

// --- Auth API ---

export const checkAccountExists = async (phone: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_USERS.some(u => u.phone === phone);
};

export const loginAPI = async (phone: string, code: string): Promise<{ user: User, merchant: Merchant | null }> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const user = MOCK_USERS.find(u => u.phone === phone);
  if (!user) throw new Error('User not found');
  
  // 简单模拟 Session 更新
  localStorage.setItem('auth_token', JSON.stringify(user));
  
  // 获取当前商户
  const merchant = user.currentMerchantId 
    ? MOCK_MERCHANTS.find(m => m.id === user.currentMerchantId) || null 
    : null;
    
  return { user, merchant };
};

export const loginWithPasswordAPI = async (phone: string, password: string): Promise<{ user: User, merchant: Merchant | null }> => {
  return loginAPI(phone, '0000'); 
};

export const updatePasswordAPI = async (userId: string, password: string): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 800));
};

export const registerAPI = async (phone: string, code: string): Promise<{ user: User }> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newUser: User = { 
    id: `u_${Date.now()}`, 
    phone, 
    name: `User ${phone.slice(-4)}`, 
    currentMerchantId: null, 
    status: 'active', 
    roleIds: [], 
    usage: { siteEvaluationCount: 0 } 
  };
  MOCK_USERS.push(newUser);
  MOCK_USER_MERCHANTS[newUser.id] = [];
  localStorage.setItem('auth_token', JSON.stringify(newUser));
  return { user: newUser };
};

export const getSessionUser = (): User | null => {
  try {
    const stored = localStorage.getItem('auth_token');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    localStorage.removeItem('auth_token');
    return null;
  }
};

// --- Merchant API ---

export const createMerchantAPI = async (userId: string, data: Partial<Merchant>): Promise<{ user: User, merchant: Merchant }> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const newMerchant: Merchant = {
    id: `m_${Date.now()}`,
    name: data.name || '未命名企业',
    industry: data.industry || 'other',
    status: 'trial',
    logo: '',
    competitors: [],
    totalQuota: { siteEvaluationBalance: 100 }
  };
  MOCK_MERCHANTS.push(newMerchant);
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const user = MOCK_USERS[userIndex];
    user.currentMerchantId = newMerchant.id;
    user.roleIds = ['r_admin']; // 成为超管
    
    // 写入关联
    if (!MOCK_USER_MERCHANTS[userId]) MOCK_USER_MERCHANTS[userId] = [];
    MOCK_USER_MERCHANTS[userId].push(newMerchant.id);
    
    localStorage.setItem('auth_token', JSON.stringify(user));
    return { user: { ...user }, merchant: newMerchant };
  }
  throw new Error('User not found');
};

export const updateMerchantAPI = async (merchantId: string, data: Partial<Merchant>): Promise<Merchant> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const idx = MOCK_MERCHANTS.findIndex(m => m.id === merchantId);
  if (idx === -1) throw new Error("Merchant not found");
  
  MOCK_MERCHANTS[idx] = { ...MOCK_MERCHANTS[idx], ...data };
  return MOCK_MERCHANTS[idx];
};

export const getUserMerchantsAPI = async (userId: string): Promise<Merchant[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const ids = MOCK_USER_MERCHANTS[userId] || [];
  return MOCK_MERCHANTS.filter(m => ids.includes(m.id));
};

export const switchMerchantAPI = async (userId: string, merchantId: string): Promise<{ user: User, merchant: Merchant }> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const allowed = MOCK_USER_MERCHANTS[userId]?.includes(merchantId);
  if (!allowed) throw new Error("无权访问该企业");
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  const merchant = MOCK_MERCHANTS.find(m => m.id === merchantId);
  
  if (userIndex > -1 && merchant) {
    const user = MOCK_USERS[userIndex];
    user.currentMerchantId = merchantId;
    
    // 简单的角色重置逻辑
    if (user.id !== 'u_001') {
       user.roleIds = ['r_staff'];
    }
    
    localStorage.setItem('auth_token', JSON.stringify(user));
    return { user: { ...user }, merchant };
  }
  throw new Error("Switch failed");
};

// --- Invite API ---

export const checkInviteTokenAPI = async (token: string): Promise<InviteInfo> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const invite = MOCK_TOKENS[token];
  if (!invite) throw new Error('Invalid token');
  if (invite.expiresAt < Date.now()) throw new Error('Token expired');
  return invite;
};

export const generateInviteLinkAPI = async (merchantId: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const mockToken = `valid-token-123`;
  // Hash路由兼容
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/invite?token=${mockToken}`;
};

export const joinMerchantAPI = async (userId: string, merchantId: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  if (!MOCK_USER_MERCHANTS[userId]) MOCK_USER_MERCHANTS[userId] = [];
  if (!MOCK_USER_MERCHANTS[userId].includes(merchantId)) {
    MOCK_USER_MERCHANTS[userId].push(merchantId);
  }
  
  const userIndex = MOCK_USERS.findIndex(u => u.id === userId);
  if (userIndex > -1) {
    const user = MOCK_USERS[userIndex];
    user.currentMerchantId = merchantId;
    user.roleIds = ['r_staff'];
    localStorage.setItem('auth_token', JSON.stringify(user));
    return { ...user };
  }
  throw new Error("Join failed");
};

// --- Data API ---

export const getDepartmentsAPI = async (): Promise<Department[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...MOCK_DEPTS];
};

export const createDepartmentAPI = async (dept: Omit<Department, 'id'>): Promise<Department> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const newDept = { ...dept, id: `d_${Date.now()}` };
  MOCK_DEPTS.push(newDept);
  return newDept;
};

export const deleteDepartmentAPI = async (id: string): Promise<void> => {
  const hasChild = MOCK_DEPTS.some(d => d.parentId === id);
  const hasUser = MOCK_USERS.some(u => u.departmentId === id);
  if (hasChild) throw new Error('请先删除或转移子部门');
  if (hasUser) throw new Error('部门下存在员工，无法删除');
  MOCK_DEPTS = MOCK_DEPTS.filter(d => d.id !== id);
};

export const getRolesAPI = async (): Promise<Role[]> => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return [...MOCK_ROLES];
};

export const saveRoleAPI = async (role: Role): Promise<Role> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const idx = MOCK_ROLES.findIndex(r => r.id === role.id);
  if (idx > -1) {
    MOCK_ROLES[idx] = role;
    return role;
  } else {
    const newRole = { ...role, id: `r_${Date.now()}`, isSystem: false };
    MOCK_ROLES.push(newRole);
    return newRole;
  }
};

export const getEmployeesAPI = async (merchantId: string): Promise<User[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return MOCK_USERS.filter(u => u.currentMerchantId === merchantId);
};

export const updateEmployeeAPI = async (id: string, updates: Partial<User>): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 400));
  const idx = MOCK_USERS.findIndex(u => u.id === id);
  if (idx === -1) throw new Error('用户不存在');
  MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...updates };
  return MOCK_USERS[idx];
};

export const createEmployeeAPI = async (merchantId: string, data: Partial<User>): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  if (MOCK_USERS.some(u => u.phone === data.phone)) throw new Error('手机号已存在');
  
  const newUser: User = {
    id: `u_${Date.now()}`,
    phone: data.phone!,
    name: data.name || '新员工',
    currentMerchantId: merchantId,
    departmentId: data.departmentId,
    roleIds: data.roleIds || [],
    status: 'active',
    usage: { siteEvaluationCount: 0 } 
  };
  MOCK_USERS.push(newUser);
  if (!MOCK_USER_MERCHANTS[newUser.id]) MOCK_USER_MERCHANTS[newUser.id] = [];
  MOCK_USER_MERCHANTS[newUser.id].push(merchantId);
  
  return newUser;
};

// 修正：使用 keyof RoleQuota 允许动态的 key 检查
export const checkQuotaAPI = async (userId: string, type: keyof RoleQuota): Promise<{ allowed: boolean, message?: string }> => {
  const user = MOCK_USERS.find(u => u.id === userId);
  if (!user) throw new Error('User error');
  const merchant = MOCK_MERCHANTS.find(m => m.id === user.currentMerchantId);
  
  if (!merchant) return { allowed: true }; // 如果没有商户上下文，暂时允许或者报错
  
  if (merchant.totalQuota.siteEvaluationBalance <= 0) {
    return { allowed: false, message: '公司总额度不足' };
  }
  
  const userRoles = MOCK_ROLES.filter(r => user.roleIds?.includes(r.id));
  let maxLimit = 0;
  // 如果有任何一个角色是 -1 (无限)，则拥有无限权限
  if (userRoles.some(r => r.quota[type] === -1)) {
    maxLimit = -1;
  } else {
    // 防止 roles 为空时 maxLimit 为 -Infinity，取最大值
    maxLimit = userRoles.length > 0 ? Math.max(...userRoles.map(r => r.quota[type])) : 0;
  }

  const currentUsage = user.usage?.siteEvaluationCount || 0;
  // 注意：这里仅简单对比了 siteEvaluationCount，实际业务中应该有单独的 recommendationCount
  if (maxLimit !== -1 && currentUsage >= maxLimit) {
    return { allowed: false, message: `额度已用完 (上限: ${maxLimit})` };
  }
  
  return { allowed: true };
};

export const getReportsAPI = async (): Promise<Report[]> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return [...MOCK_REPORTS];
};

// 保存报告
export const saveReportAPI = async (userId: string, result: EvaluationResult): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  const user = MOCK_USERS.find(u => u.id === userId);
  const newReport: Report = {
    id: `rep_${Date.now()}`,
    name: `${result.locationName}选址评估报告`,
    type: 'evaluation',
    status: 'completed',
    createdAt: new Date().toISOString(),
    creatorName: user?.name || 'Unknown',
    address: result.locationName,
    score: result.score
  };
  MOCK_REPORTS.unshift(newReport);
};

// 运行评估
export const runEvaluationAPI = async (userId: string, params: any): Promise<EvaluationResult> => {
  // 1. 检查额度
  const check = await checkQuotaAPI(userId, 'siteEvaluationLimit');
  if (!check.allowed) throw new Error(check.message);

  // 2. 模拟耗时 (3秒)
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 3. 扣除额度 (Mock)
  const user = MOCK_USERS.find(u => u.id === userId);
  if(user && user.usage) {
     user.usage.siteEvaluationCount += 1;
  }

  // 4. 生成随机位置 (基于传入位置的微调或默认前海)
  // 如果是真实接口，会根据 params.address 解析经纬度。这里简化。
  const centerLat = 22.5431; // 万象天地大致坐标
  const centerLng = 113.9585;
  
  // 生成一些随机POI点
  const pois = [];
  for(let i=0; i<15; i++) {
     pois.push({
       lat: centerLat + (Math.random() - 0.5) * 0.01,
       lng: centerLng + (Math.random() - 0.5) * 0.01,
       type: Math.random() > 0.7 ? 'office' : 'residential'
     });
  }

  return {
    score: 95.6,
    locationName: params.address || "万象天地·商圈",
    tags: ["写字楼密集", "交通密集", "近小区", "开店热度高"],
    dimensions: [
      { subject: '商业成熟度', A: 96, fullMark: 100 },
      { subject: '客群与客流', A: 96, fullMark: 100 },
      { subject: '行业发展趋势', A: 95, fullMark: 100 },
      { subject: '竞争格局评估', A: 96, fullMark: 100 },
      { subject: '发展潜力评估', A: 96, fullMark: 100 },
    ],
    detailScores: [
      { label: '商业成熟度', score: 96, stars: 4 },
      { label: '客群与客流', score: 96, stars: 4 },
      { label: '行业发展趋势', score: 95, stars: 3.5 },
      { label: '竞争格局评估', score: 96, stars: 4 },
      { label: '发展潜力评估', score: 96, stars: 3.5 },
    ],
    aiSummary: "综合分析说明，商业繁华度和商业成熟度等角度判断万象天地·附近商业片区商圈环境，店址类型更偏向写字楼，商业环境成熟度较高。建议重点关注周末时段的营销策略。建议店铺面积 80-120㎡。",
    geoData: {
      center: [centerLat, centerLng],
      radius: (params.radius || 1) * 1000,
      pois: pois as any
    }
  };
};

// --- NEW: 运行推荐 ---
export const runRecommendationAPI = async (userId: string, params: any): Promise<RecommendationResult> => {
  // 1. 检查额度 (实际逻辑)
  // const check = await checkQuotaAPI(userId, 'siteRecommendationLimit');
  
  // 2. 模拟耗时 (假设前端有进度条，这里耗时可以稍微长一点模拟计算)
  await new Promise(resolve => setTimeout(resolve, 4000));

  // 3. 生成模拟数据 (围绕前海/南山区域)
  const items: RecommendationItem[] = [
    {
      id: 'rec_1',
      rank: 1,
      name: '万象天地·商圈',
      score: 95.6,
      tags: ['写字楼密集', '交通密集', '近小区', '开店热度高'],
      matchReason: '客流稳定性极高，白领消费能力强',
      center: [22.5428, 113.9576],
      polygon: [
        [22.5458, 113.9556], [22.5458, 113.9596], [22.5408, 113.9596], [22.5408, 113.9556]
      ]
    },
    {
      id: 'rec_2',
      rank: 2,
      name: '花样年花乡·商圈',
      score: 95.6,
      tags: ['写字楼密集', '交通密集', '近小区', '开店热度高'],
      matchReason: '居住密度高，社区商业氛围成熟',
      center: [22.5288, 113.9306],
      polygon: [
        [22.5318, 113.9286], [22.5318, 113.9326], [22.5258, 113.9336], [22.5258, 113.9296]
      ]
    },
    {
      id: 'rec_3',
      rank: 3,
      name: '海岸城·商圈',
      score: 95.6,
      tags: ['写字楼密集', '交通密集', '近小区', '开店热度高'],
      matchReason: '顶级购物中心辐射，周末客流爆发',
      center: [22.5188, 113.9366],
      polygon: [
        [22.5218, 113.9346], [22.5218, 113.9386], [22.5158, 113.9386], [22.5158, 113.9346]
      ]
    },
    {
      id: 'rec_4',
      rank: 4,
      name: '科技园·中区',
      score: 95.6,
      tags: ['写字楼密集', '交通密集', '近小区', '开店热度高'],
      matchReason: '工作日外卖订单量全区第一',
      center: [22.5400, 113.9450],
      polygon: [
        [22.5420, 113.9430], [22.5420, 113.9470], [22.5380, 113.9470], [22.5380, 113.9430]
      ]
    },
    {
      id: 'rec_5',
      rank: 5,
      name: '前海·壹方城',
      score: 95.6,
      tags: ['写字楼密集', '交通密集', '近小区', '开店热度高'],
      matchReason: '新兴商业中心，未来增长潜力大',
      center: [22.5530, 113.8980],
      polygon: [
        [22.5550, 113.8960], [22.5550, 113.9000], [22.5510, 113.9000], [22.5510, 113.8960]
      ]
    }
  ];

  return {
    taskId: `task_${Date.now()}`,
    items
  };
};

// --- NEW: 战略地图数据 ---
export const getStrategicMapDataAPI = async (merchantId: string): Promise<StrategicPoint[]> => {
  await new Promise(resolve => setTimeout(resolve, 800)); // 模拟网络延迟

  const points: StrategicPoint[] = [];
  const startLat = 22.53;
  const startLng = 113.93;

  // 生成20家自有门店
  for(let i=0; i<20; i++) {
    points.push({
      id: `own_${i}`,
      lat: startLat + (Math.random() - 0.5) * 0.08,
      lng: startLng + (Math.random() - 0.5) * 0.12,
      name: `直营店 #${i+1}`,
      type: 'own',
      brand: 'My Brand'
    });
  }

  // 生成30家竞品门店
  for(let i=0; i<30; i++) {
    points.push({
      id: `comp_${i}`,
      lat: startLat + (Math.random() - 0.5) * 0.08,
      lng: startLng + (Math.random() - 0.5) * 0.12,
      name: `竞品店 #${i+1}`,
      type: 'competitor',
      brand: 'Competitor'
    });
  }

  return points;
};
