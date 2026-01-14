import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { 
  Users, Shield, Network, Plus, Search, 
  Folder, ChevronDown, Check, X,
  AlertCircle, Briefcase, UserPlus, Edit3, Trash2, Link as LinkIcon, Copy,
  Map, MapPin, Compass, FileText, Settings
} from 'lucide-react';
import * as mockService from '../services/mockAuthService';
import { Department, Role, User, Permission } from '../types';

type Tab = 'org' | 'roles' | 'staff';

export const TeamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('org');
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto h-full flex flex-col">
      {/* 顶部 Tab 切换 */}
      <div className="flex items-center gap-2 mb-6 bg-white p-1.5 rounded-2xl w-fit border border-slate-200 shadow-sm">
        <TabButton active={activeTab === 'org'} onClick={() => setActiveTab('org')} icon={<Network size={18} />} label="组织架构" />
        <TabButton active={activeTab === 'roles'} onClick={() => setActiveTab('roles')} icon={<Shield size={18} />} label="角色权限" />
        <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<Users size={18} />} label="员工管理" />
      </div>

      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex">
        {activeTab === 'org' && <OrgView />}
        {activeTab === 'roles' && <RolesView />}
        {activeTab === 'staff' && <StaffView />}
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
      active 
        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30' 
        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
    }`}
  >
    {icon}
    {label}
  </button>
);

// --- 1. 组织架构视图 ---
const OrgView = () => {
  const [depts, setDepts] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  
  // 新增部门 Modal 状态
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    name: '',
    parentId: '',
    managerId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const d = await mockService.getDepartmentsAPI();
    const e = await mockService.getEmployeesAPI('m_001'); // Mock Merchant ID
    setDepts(d);
    setEmployees(e);
    if (d.length > 0 && !selectedDeptId) setSelectedDeptId(d[0].id);
  };

  const handleOpenAddModal = () => {
    setDeptForm({
      name: '',
      parentId: selectedDeptId || (depts.length > 0 ? depts[0].id : ''),
      managerId: ''
    });
    setShowDeptModal(true);
  };

  const handleSubmitDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name) {
      alert("请输入部门名称");
      return;
    }
    try {
      await mockService.createDepartmentAPI({
        parentId: deptForm.parentId || null,
        name: deptForm.name,
        managerId: deptForm.managerId || undefined
      });
      setShowDeptModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if(!window.confirm("确定要删除该部门吗？")) return;
    try {
      await mockService.deleteDepartmentAPI(id);
      loadData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const renderTree = (parentId: string | null, level = 0) => {
    const children = depts.filter(d => d.parentId === parentId);
    if (children.length === 0) return null;
    return (
      <div className={`flex flex-col gap-1 ${level > 0 ? 'ml-4 pl-3 border-l border-slate-200' : ''}`}>
        {children.map(dept => (
          <div key={dept.id}>
             <div 
                onClick={() => setSelectedDeptId(dept.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors group ${
                  selectedDeptId === dept.id ? 'bg-brand-50 text-brand-700 font-medium' : 'hover:bg-slate-50 text-slate-600'
                }`}
             >
                <div className="flex items-center gap-2">
                   {dept.parentId === null ? <Briefcase size={16} /> : <Folder size={16} className={selectedDeptId === dept.id ? "text-brand-500" : "text-slate-400"} />}
                   <span className="text-sm truncate max-w-[140px]">{dept.name}</span>
                </div>
                {dept.parentId !== null && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteDept(dept.id); }} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                )}
             </div>
             {renderTree(dept.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const selectedEmployees = employees.filter(e => e.departmentId === selectedDeptId);
  const currentDept = depts.find(d => d.id === selectedDeptId);

  return (
    <div className="flex w-full h-full relative">
      {/* 左侧树 */}
      <div className="w-80 border-r border-slate-100 p-6 bg-slate-50/50 flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">部门结构</h3>
            <button 
              onClick={handleOpenAddModal} 
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:text-brand-500 transition-all shadow-sm text-xs font-medium text-slate-600"
            >
               <Plus size={14} /> 新增
            </button>
         </div>
         <div className="flex-1 overflow-auto pr-2">
            {renderTree(null)}
         </div>
      </div>
      
      {/* 右侧列表 */}
      <div className="flex-1 p-8 bg-white flex flex-col">
         <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                 {currentDept?.name || '所有成员'}
                 <span className="bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-brand-100">
                   {selectedEmployees.length} 人
                 </span>
              </h3>
              {currentDept?.managerId && (
                 <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                   <Shield size={12} /> 负责人: {employees.find(e => e.id === currentDept.managerId)?.name || '未知'}
                 </p>
              )}
            </div>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-auto content-start">
            {selectedEmployees.map(emp => (
              <div key={emp.id} className="p-5 rounded-2xl border border-slate-100 bg-white hover:shadow-lg hover:shadow-slate-200/50 hover:border-brand-200 transition-all group relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-50 to-slate-100 -mr-8 -mt-8 rounded-full z-0 group-hover:from-brand-50 group-hover:to-brand-100 transition-colors"></div>
                 <div className="relative z-10 flex items-start justify-between">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg shadow-inner group-hover:bg-brand-500 group-hover:text-white transition-all">
                          {emp.name?.[0]}
                       </div>
                       <div>
                          <div className="font-bold text-slate-800 text-base">{emp.name}</div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5">{emp.phone}</div>
                       </div>
                    </div>
                 </div>
                 <div className="relative z-10 mt-4 flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-500 border border-red-100'}`}>
                      {emp.status === 'active' ? '● 正常在职' : '● 账号禁用'}
                    </span>
                 </div>
              </div>
            ))}
            {selectedEmployees.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Users size={20} className="text-slate-300" />
                 </div>
                 <p>该部门暂无员工</p>
              </div>
            )}
         </div>
      </div>

      {/* 新增部门 Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">新增部门</h3>
              <button onClick={() => setShowDeptModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSubmitDept} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">上级部门</label>
                <div className="relative">
                   <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm text-slate-900" 
                      value={deptForm.parentId}
                      onChange={e => setDeptForm({ ...deptForm, parentId: e.target.value })}
                   >
                      <option value="">作为一级部门 (根节点)</option>
                      {depts.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.parentId ? '↳ ' : ''}{d.name}
                        </option>
                      ))}
                   </select>
                   <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">部门名称</label>
                <input
                  autoFocus
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm text-slate-900 placeholder:text-slate-400"
                  placeholder="例如：市场部、华东大区..."
                  value={deptForm.name}
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">部门负责人 (可选)</label>
                <div className="relative">
                   <select
                      className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-brand-500/20 outline-none text-sm text-slate-900"
                      value={deptForm.managerId}
                      onChange={e => setDeptForm({ ...deptForm, managerId: e.target.value })}
                   >
                      <option value="">未指定</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name} ({e.phone})</option>
                      ))}
                   </select>
                   <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowDeptModal(false)}>取消</Button>
                <Button type="submit" className="flex-1">确认创建</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. 角色权限视图 (已更新：按照业务模块分组) ---
const RolesView = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await mockService.getRolesAPI();
    setRoles(data);
    if (data.length > 0 && !selectedRole) setSelectedRole(data[0]);
  };

  const handleSave = async () => {
    if (selectedRole) {
       await mockService.saveRoleAPI(selectedRole);
       setIsEditing(false);
       loadRoles();
       alert("保存成功");
    }
  };

  const togglePermission = (code: string) => {
    if (!selectedRole) return;
    const current = selectedRole.permissions;
    const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    setSelectedRole({ ...selectedRole, permissions: next });
  };

  // 辅助函数：根据模块分组权限
  const groupPermissions = (perms: Permission[]) => {
    const groups: Record<string, Permission[]> = {
      'dashboard': [],
      'evaluation': [],
      'recommendation': [],
      'report': [],
      'team': [],
      'settings': []
    };
    perms.forEach(p => {
      if (groups[p.module]) {
        groups[p.module].push(p);
      }
    });
    return groups;
  };

  const permissionGroups = groupPermissions(mockService.PERMISSIONS);
  const moduleLabels: Record<string, { label: string, icon: React.ReactNode }> = {
    'dashboard': { label: '战略经营地图', icon: <Map size={16} /> },
    'evaluation': { label: '选址评估', icon: <MapPin size={16} /> },
    'recommendation': { label: '选址推荐', icon: <Compass size={16} /> },
    'report': { label: '报告管理', icon: <FileText size={16} /> },
    'team': { label: '团队管理', icon: <Users size={16} /> },
    'settings': { label: '企业设置', icon: <Settings size={16} /> }
  };

  return (
    <div className="flex w-full h-full">
      {/* 左侧角色列表 */}
      <div className="w-72 border-r border-slate-100 p-6 bg-slate-50/50 flex flex-col">
         <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">角色列表</h3>
            <button 
              onClick={() => {
                const newRole: Role = { 
                  id: '', name: '新角色', description: '', permissions: [], dataScope: 'SELF', quota: { siteEvaluationLimit: 10, siteRecommendationLimit: 0 } 
                };
                setSelectedRole(newRole);
                setIsEditing(true);
              }}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:border-brand-500 hover:text-brand-500 transition-colors shadow-sm"
            >
               <Plus size={16} />
            </button>
         </div>
         <div className="space-y-2">
            {roles.map(role => (
              <div 
                key={role.id}
                onClick={() => { setSelectedRole(role); setIsEditing(false); }}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  selectedRole?.id === role.id ? 'bg-white border-brand-500 shadow-md shadow-brand-500/10' : 'bg-transparent border-transparent hover:bg-slate-100'
                }`}
              >
                 <div className="font-bold text-slate-800 text-sm">{role.name}</div>
                 <div className="text-xs text-slate-500 mt-1 truncate">{role.description}</div>
              </div>
            ))}
         </div>
      </div>

      {/* 右侧编辑器 */}
      <div className="flex-1 p-8 bg-white overflow-auto">
         {selectedRole ? (
            <div className="max-w-4xl">
               <div className="flex justify-between items-start mb-8 pb-6 border-b border-slate-100">
                  <div className="flex-1 mr-8">
                    {isEditing ? (
                       <input 
                         className="text-2xl font-bold text-slate-900 border-b border-slate-300 focus:border-brand-500 outline-none bg-transparent w-full mb-2"
                         value={selectedRole.name}
                         onChange={e => setSelectedRole({...selectedRole, name: e.target.value})}
                         placeholder="角色名称"
                       />
                    ) : (
                       <h2 className="text-2xl font-bold text-slate-900">{selectedRole.name}</h2>
                    )}
                    <div className="text-slate-500">
                      {isEditing ? (
                        <input 
                          className="w-full border-b border-slate-300 focus:border-brand-500 outline-none text-sm bg-transparent text-slate-600"
                          value={selectedRole.description}
                          onChange={e => setSelectedRole({...selectedRole, description: e.target.value})}
                          placeholder="角色描述"
                        />
                      ) : selectedRole.description}
                    </div>
                  </div>
                  <div className="flex gap-3">
                     {isEditing ? (
                        <>
                          <Button variant="secondary" onClick={() => { setIsEditing(false); loadRoles(); }}>取消</Button>
                          <Button onClick={handleSave}>保存配置</Button>
                        </>
                     ) : (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>编辑角色</Button>
                     )}
                  </div>
               </div>

               {/* 1. 功能权限矩阵 (分组展示) */}
               <div className="mb-10">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Check size={16} className="text-brand-500" /> 功能权限配置
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.keys(permissionGroups).map(moduleKey => {
                      const group = permissionGroups[moduleKey];
                      const meta = moduleLabels[moduleKey] || { label: moduleKey, icon: null };
                      
                      if (group.length === 0) return null;

                      return (
                        <div key={moduleKey} className="bg-slate-50/50 rounded-xl border border-slate-100 p-4">
                           <div className="flex items-center gap-2 mb-3 text-slate-700 font-bold text-sm">
                              <span className="p-1.5 bg-white rounded-lg shadow-sm text-brand-500">{meta.icon}</span>
                              {meta.label}
                           </div>
                           <div className="space-y-2">
                              {group.map(p => (
                                <label key={p.code} className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                  selectedRole.permissions.includes(p.code) 
                                    ? 'bg-white border-brand-200 shadow-sm' 
                                    : isEditing ? 'bg-transparent border-transparent hover:bg-white hover:border-slate-200' : 'opacity-60 cursor-not-allowed'
                                }`}>
                                   <input 
                                      type="checkbox" 
                                      disabled={!isEditing}
                                      checked={selectedRole.permissions.includes(p.code)}
                                      onChange={() => togglePermission(p.code)}
                                      className="w-4 h-4 text-brand-500 rounded border-gray-300 focus:ring-brand-500"
                                   />
                                   <div className="text-sm text-slate-700 font-medium">{p.name}</div>
                                </label>
                              ))}
                           </div>
                        </div>
                      );
                    })}
                  </div>
               </div>

               {/* 2. 额度策略配置 */}
               <div className="mb-10 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                  <h4 className="text-sm font-bold text-orange-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <AlertCircle size={16} /> 额度策略限制 (每人/每月)
                  </h4>
                  <div className="grid grid-cols-2 gap-8">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">选址评估次数</label>
                        <div className="flex items-center gap-3">
                           <input 
                             type="number"
                             disabled={!isEditing}
                             value={selectedRole.quota.siteEvaluationLimit}
                             onChange={(e) => setSelectedRole({
                               ...selectedRole,
                               quota: { ...selectedRole.quota, siteEvaluationLimit: parseInt(e.target.value) }
                             })}
                             className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 disabled:bg-slate-100"
                           />
                           <span className="text-xs text-slate-400 whitespace-nowrap">(-1 为无限)</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">智能推荐次数</label>
                        <div className="flex items-center gap-3">
                           <input 
                             type="number"
                             disabled={!isEditing}
                             value={selectedRole.quota.siteRecommendationLimit}
                             onChange={(e) => setSelectedRole({
                               ...selectedRole,
                               quota: { ...selectedRole.quota, siteRecommendationLimit: parseInt(e.target.value) }
                             })}
                             className="bg-white border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-brand-500 focus:border-brand-500 block w-full p-2.5 disabled:bg-slate-100"
                           />
                           <span className="text-xs text-slate-400 whitespace-nowrap">(-1 为无限)</span>
                        </div>
                     </div>
                  </div>
                  <p className="text-xs text-orange-600/70 mt-4 leading-relaxed">
                     * 注意：该额度限制的是拥有该角色的“单个员工”的使用上限。同时受限于公司购买的总剩余额度。若公司总额度为0，即使个人有额度也无法使用。
                  </p>
               </div>
            </div>
         ) : (
           <div className="h-full flex items-center justify-center text-slate-400">请选择一个角色查看详情</div>
         )}
      </div>
    </div>
  );
};

// --- 3. 员工管理视图 (新增：邀请链接功能) ---
const StaffView = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [depts, setDepts] = useState<Department[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  
  // 邀请相关状态
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const e = await mockService.getEmployeesAPI('m_001');
    const r = await mockService.getRolesAPI();
    const d = await mockService.getDepartmentsAPI();
    setEmployees(e);
    setRoles(r);
    setDepts(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone || !formData.departmentId) {
      alert("请填写完整信息");
      return;
    }
    try {
      await mockService.createEmployeeAPI('m_001', formData);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateInvite = async () => {
    setGeneratingLink(true);
    try {
      const link = await mockService.generateInviteLinkAPI('m_001');
      setInviteLink(link);
      setShowInviteModal(true);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('邀请链接已复制到剪贴板');
  };

  return (
    <div className="flex-1 flex flex-col p-8 w-full bg-white">
       <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
             <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="搜索姓名或手机号" 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 w-64 text-slate-900" // 修复：增加 text-slate-900
                />
             </div>
          </div>
          <div className="flex gap-3">
             {/* 新增：邀请按钮 */}
             <Button variant="outline" onClick={handleGenerateInvite} isLoading={generatingLink}>
                <LinkIcon size={18} className="mr-2" /> 邀请成员
             </Button>
             <Button onClick={() => { setFormData({}); setShowModal(true); }}>
                <UserPlus size={18} className="mr-2" /> 新增员工
             </Button>
          </div>
       </div>

       <div className="flex-1 overflow-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">员工信息</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">归属部门</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">角色</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">已用额度(评估)</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {employees.map(emp => (
                 <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                       <div className="font-bold text-slate-800 text-sm">{emp.name}</div>
                       <div className="text-xs text-slate-400 font-mono">{emp.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                       {depts.find(d => d.id === emp.departmentId)?.name || '-'}
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                          {emp.roleIds?.map(rid => {
                             const r = roles.find(ro => ro.id === rid);
                             return r ? (
                               <span key={rid} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium border border-blue-100">
                                 {r.name}
                               </span>
                             ) : null;
                          })}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                       {emp.usage?.siteEvaluationCount || 0} 次
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-2 py-1 rounded text-xs font-bold ${emp.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                         {emp.status === 'active' ? '正常' : '禁用'}
                       </span>
                    </td>
                    <td className="px-6 py-4">
                       <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-brand-500 transition-colors">
                          <Edit3 size={16} />
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
       </div>

       {/* 新增员工弹窗 */}
       {showModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 animate-slide-up">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">新增员工</h3>
                  <button onClick={() => setShowModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
               </div>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">姓名</label>
                        <input 
                           required
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900 placeholder:text-slate-400" // 修复：增加 text-slate-900
                           value={formData.name || ''}
                           onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">手机号 (登录账号)</label>
                        <input 
                           required
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900 placeholder:text-slate-400" // 修复：增加 text-slate-900
                           value={formData.phone || ''}
                           onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                     </div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-2">归属部门</label>
                     <select 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900" // 修复：增加 text-slate-900
                        value={formData.departmentId || ''}
                        onChange={e => setFormData({...formData, departmentId: e.target.value})}
                     >
                        <option value="">请选择部门...</option>
                        {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-2">分配角色 (可多选)</label>
                     <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 max-h-32 overflow-auto">
                        {roles.map(r => (
                           <label key={r.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-brand-300">
                              <input 
                                type="checkbox"
                                checked={formData.roleIds?.includes(r.id)}
                                onChange={(e) => {
                                   const current = formData.roleIds || [];
                                   if (e.target.checked) setFormData({...formData, roleIds: [...current, r.id]});
                                   else setFormData({...formData, roleIds: current.filter(id => id !== r.id)});
                                }}
                                className="rounded text-brand-500 focus:ring-brand-500"
                              />
                              <span className="text-sm text-slate-700">{r.name}</span>
                           </label>
                        ))}
                     </div>
                  </div>
                  <div className="pt-4">
                     <Button className="w-full py-3">确认添加</Button>
                  </div>
               </form>
            </div>
         </div>
       )}

       {/* 邀请链接弹窗 */}
       {showInviteModal && (
         <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-slide-up">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-900">邀请成员加入</h3>
                  <button onClick={() => setShowInviteModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
               </div>
               <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700 leading-relaxed">
                     <p>链接有效期为 24 小时。接收者通过链接注册或登录后，将自动加入当前企业，默认角色为“普通员工”。</p>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 mb-2">邀请链接</label>
                     <div className="flex gap-2">
                        <input 
                           readOnly
                           className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none text-slate-600 text-sm font-mono truncate select-all"
                           value={inviteLink}
                        />
                        <Button variant="secondary" onClick={copyToClipboard} className="shrink-0 px-4">
                           <Copy size={16} />
                        </Button>
                     </div>
                  </div>
                  <Button onClick={() => setShowInviteModal(false)} className="w-full py-3">完成</Button>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};