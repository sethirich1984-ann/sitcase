import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Building2, Store, LogOut, ChevronRight, Briefcase, Users, Zap } from 'lucide-react';

export const EnterpriseInitPage: React.FC = () => {
  const { user, createMerchant, logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactName: user?.name || '',
    scale: '1-10'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createMerchant({
        name: formData.name,
        industry: formData.industry
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col relative overflow-hidden font-sans text-slate-200">
       {/* 背景装饰 */}
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 rounded-full blur-[100px] pointer-events-none"></div>

       {/* 顶部栏 */}
       <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-center z-20">
          <div className="flex items-center gap-3 text-white font-bold text-lg">
             <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                <Zap size={20} fill="currentColor" />
             </div>
             选址参谋
          </div>
          <button onClick={logout} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors bg-white/5 px-4 py-2 rounded-full backdrop-blur hover:bg-white/10 border border-white/5">
            <LogOut size={16} /> 退出账号
          </button>
       </div>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-2xl animate-slide-up">
           
           <div className="text-center mb-12">
              <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
                 欢迎来到选址参谋
              </h1>
              <p className="text-slate-400 text-lg">
                 仅需简单一步，为您创建专属的 <span className="text-brand-400 font-medium">企业工作空间</span>
              </p>
           </div>

          <div className="bg-dark-900 rounded-[2rem] shadow-2xl shadow-black/50 border border-white/10 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-600 to-teal-500"></div>
            
            <div className="bg-dark-800/50 p-8 border-b border-white/5 flex items-center gap-5">
              <div className="bg-dark-950 p-3.5 rounded-2xl border border-white/10 shadow-inner">
                 <Building2 className="text-brand-500 w-8 h-8" />
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white">企业/商户初始化</h2>
                 <p className="text-sm text-slate-500 mt-1">SaaS 系统将严格隔离不同商户的业务数据，保障信息安全。</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="col-span-2 space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 pl-1">
                    企业/商户名称 <span className="text-brand-500">*</span>
                  </label>
                  <div className="relative group">
                    <Store className="absolute left-5 top-4 text-slate-500 group-focus-within:text-brand-500 transition-colors w-5 h-5" />
                    <input
                      type="text"
                      required
                      className="w-full pl-14 pr-5 py-4 bg-dark-950 border border-dark-700 text-white rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-dark-700 text-lg"
                      placeholder="请输入您的品牌或公司名称"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <p className="text-xs text-slate-600 pl-1">系统将自动同步开放平台企业认证信息（如有）</p>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 pl-1">
                     所属行业 <span className="text-brand-500">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase size={18} className="absolute left-5 top-4 text-slate-500 pointer-events-none" />
                    <select 
                        className="w-full pl-12 pr-5 py-4 bg-dark-950 border border-dark-700 text-white rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none appearance-none cursor-pointer"
                        required
                        value={formData.industry}
                        onChange={e => setFormData({...formData, industry: e.target.value})}
                    >
                        <option value="">请选择行业分类</option>
                        <option value="catering">餐饮美食</option>
                        <option value="retail">零售百货</option>
                        <option value="service">生活服务</option>
                        <option value="other">其他</option>
                    </select>
                    <ChevronRight className="absolute right-5 top-4.5 rotate-90 text-slate-600 pointer-events-none w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 pl-1">
                     人员规模
                  </label>
                  <div className="relative">
                     <Users size={18} className="absolute left-5 top-4 text-slate-500 pointer-events-none" />
                     <select 
                        className="w-full pl-12 pr-5 py-4 bg-dark-950 border border-dark-700 text-white rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none appearance-none cursor-pointer"
                        value={formData.scale}
                        onChange={e => setFormData({...formData, scale: e.target.value})}
                     >
                        <option value="1-10">1-10人</option>
                        <option value="11-50">11-50人</option>
                        <option value="51-200">51-200人</option>
                        <option value="200+">200人以上</option>
                     </select>
                     <ChevronRight className="absolute right-5 top-4.5 rotate-90 text-slate-600 pointer-events-none w-4 h-4" />
                  </div>
                </div>
              </div>
              
              <div className="bg-brand-900/20 p-6 rounded-2xl border border-brand-500/10 flex gap-4 items-start">
                 <div className="bg-brand-500/20 p-1.5 rounded-full text-brand-400 mt-0.5 shrink-0">
                   <ChevronRight size={14} />
                 </div>
                 <div className="text-sm text-brand-100/80 leading-relaxed">
                   <strong className="block mb-1 font-semibold text-brand-300">超级管理员权限说明</strong>
                   创建后您将自动成为该商户的超级管理员。商户数据与您的个人账号绑定，但数据存储在SaaS私有空间，严格隔离。
                 </div>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full py-4 text-lg rounded-2xl shadow-[0_4px_20px_-5px_rgba(16,185,129,0.5)] font-bold hover:scale-[1.01] transition-transform" isLoading={loading}>
                  立即开通工作空间
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};