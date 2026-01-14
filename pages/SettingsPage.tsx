import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Building2, Lock, Save, Camera, Plus, X, AlertCircle, Shield, KeyRound } from 'lucide-react';
import { Merchant } from '../types';

type Tab = 'enterprise' | 'security';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('enterprise');

  return (
    <div className="p-6 max-w-[1200px] mx-auto h-full flex flex-col">
       <h2 className="text-2xl font-bold text-slate-800 mb-6 tracking-tight">系统设置</h2>
       
       <div className="flex items-center gap-2 mb-6 border-b border-slate-200">
         <button
           onClick={() => setActiveTab('enterprise')}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
             activeTab === 'enterprise' 
               ? 'border-brand-500 text-brand-600' 
               : 'border-transparent text-slate-500 hover:text-slate-700'
           }`}
         >
           <span className="flex items-center gap-2"><Building2 size={16} /> 企业档案</span>
         </button>
         <button
           onClick={() => setActiveTab('security')}
           className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${
             activeTab === 'security' 
               ? 'border-brand-500 text-brand-600' 
               : 'border-transparent text-slate-500 hover:text-slate-700'
           }`}
         >
           <span className="flex items-center gap-2"><Lock size={16} /> 账号安全</span>
         </button>
       </div>

       <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-8 overflow-auto">
          {activeTab === 'enterprise' && <EnterpriseSettings />}
          {activeTab === 'security' && <SecuritySettings />}
       </div>
    </div>
  );
};

// --- 企业档案设置 ---
const EnterpriseSettings = () => {
  const { merchant, updateMerchantProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Merchant>>({
    name: '',
    industry: '',
    competitors: []
  });
  
  const [compInput, setCompInput] = useState('');

  useEffect(() => {
    if (merchant) {
      setFormData({
        name: merchant.name,
        industry: merchant.industry,
        competitors: merchant.competitors || []
      });
    }
  }, [merchant]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateMerchantProfile(formData);
      alert('企业信息已更新');
    } catch (e) {
      alert('更新失败');
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = () => {
    if (compInput.trim() && !formData.competitors?.includes(compInput.trim())) {
       setFormData({
         ...formData,
         competitors: [...(formData.competitors || []), compInput.trim()]
       });
       setCompInput('');
    }
  };

  const removeCompetitor = (tag: string) => {
    setFormData({
      ...formData,
      competitors: formData.competitors?.filter(c => c !== tag)
    });
  };

  if (!merchant) return <div className="p-10 text-center text-slate-400">正在加载企业信息...</div>;

  return (
    <div className="max-w-2xl animate-fade-in">
       <div className="flex items-start gap-8 mb-10">
          <div className="relative group cursor-pointer">
             <div className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 overflow-hidden">
                {merchant.logo ? (
                  <img src={merchant.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 size={32} />
                )}
             </div>
             <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" size={24} />
             </div>
             <input 
               type="file" 
               className="absolute inset-0 opacity-0 cursor-pointer" 
               onChange={() => alert("Logo上传功能暂未对接云存储，仅作演示")} 
             />
             <p className="text-xs text-center text-slate-500 mt-2">点击修改 Logo</p>
          </div>
          
          <div className="flex-1">
             <h3 className="text-lg font-bold text-slate-900 mb-1">{merchant.name}</h3>
             <p className="text-sm text-slate-500">ID: {merchant.id}</p>
             <div className="mt-4 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 inline-flex items-center gap-2">
                <AlertCircle size={14} />
                作为超级管理员，您可以维护企业的基础档案，这些信息将用于报表生成。
             </div>
          </div>
       </div>

       <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">企业/品牌名称</label>
            <input 
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900"
              value={formData.name || ''}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">所属行业</label>
            <div className="relative">
                <select 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900 appearance-none"
                value={formData.industry || ''}
                onChange={e => setFormData({...formData, industry: e.target.value})}
                >
                    <option value="catering">餐饮美食</option>
                    <option value="retail">零售百货</option>
                    <option value="service">生活服务</option>
                    <option value="other">其他</option>
                </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">主要竞品品牌 (用于地图分析)</label>
            <div className="flex flex-wrap gap-2 mb-3">
               {formData.competitors?.map(tag => (
                 <span key={tag} className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm font-medium border border-brand-100 flex items-center gap-1">
                   {tag}
                   <button type="button" onClick={() => removeCompetitor(tag)} className="hover:text-brand-900"><X size={14} /></button>
                 </span>
               ))}
            </div>
            <div className="flex gap-2">
               <input 
                 className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900 text-sm"
                 placeholder="输入竞品品牌名称，按回车或添加按钮"
                 value={compInput}
                 onChange={e => setCompInput(e.target.value)}
                 onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); }}}
               />
               <Button type="button" variant="secondary" onClick={addCompetitor} disabled={!compInput.trim()}>
                 <Plus size={16} className="mr-1" /> 添加
               </Button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
             <Button type="submit" isLoading={loading}>
                <Save size={18} className="mr-2" /> 保存更改
             </Button>
          </div>
       </form>
    </div>
  );
};

// --- 账号安全设置 ---
const SecuritySettings = () => {
  const { updateUserPassword } = useAuth();
  const [passwords, setPasswords] = useState({
    old: '',
    new: '',
    confirm: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdatePass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      alert("两次输入的新密码不一致");
      return;
    }
    if (passwords.new.length < 6) {
      alert("密码长度至少需6位");
      return;
    }
    
    setLoading(true);
    try {
      await updateUserPassword(passwords.new);
      alert("密码修改成功，下次请使用新密码登录");
      setPasswords({ old: '', new: '', confirm: '' });
    } catch (e) {
      alert("修改失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl animate-fade-in">
       <div className="mb-8">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="text-brand-500" size={20} />
            登录密码设置
          </h3>
          
          {/* 灰色字体标注的新场景说明 */}
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex items-start gap-3">
               <Shield size={16} className="text-slate-400 mt-1 shrink-0" />
               <div className="space-y-2">
                 <p className="text-sm font-bold text-slate-600">适用场景说明：</p>
                 <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 leading-relaxed">
                   <li>
                     <strong>初始设置：</strong> 若您注册时仅使用了手机验证码，默认无密码。设置初始密码后，支持使用“手机号+密码”登录。
                   </li>
                   <li>
                     <strong>定期轮换：</strong> 为了保障企业数据安全，建议每 90 天定期更新一次登录密码。
                   </li>
                 </ul>
               </div>
            </div>
          </div>
       </div>

       <form onSubmit={handleUpdatePass} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">当前密码</label>
            <input 
              type="password"
              placeholder="若未设置过密码，请输入 0000"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900"
              value={passwords.old}
              onChange={e => setPasswords({...passwords, old: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">新密码</label>
            <input 
              type="password"
              required
              placeholder="至少6位字符"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900"
              value={passwords.new}
              onChange={e => setPasswords({...passwords, new: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">确认新密码</label>
            <input 
              type="password"
              required
              placeholder="再次输入新密码"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-500/20 outline-none text-slate-900"
              value={passwords.confirm}
              onChange={e => setPasswords({...passwords, confirm: e.target.value})}
            />
          </div>

          <div className="pt-6">
             <Button type="submit" isLoading={loading} variant="primary">
                确认修改
             </Button>
          </div>
       </form>
    </div>
  );
};