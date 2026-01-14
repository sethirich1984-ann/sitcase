import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { checkInviteTokenAPI } from '../services/mockAuthService';
import { useAuth } from '../context/AuthContext';
import { InviteInfo } from '../types';
import { Button } from '../components/ui/Button';
import { Check, X, Building2, User, ArrowRight, ShieldCheck } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export const InviteHandler: React.FC = () => {
  const query = useQuery();
  const token = query.get('token');
  const navigate = useNavigate();
  const { user, acceptInvite } = useAuth();
  
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('无效的邀请链接');
      return;
    }
    checkInviteTokenAPI(token)
      .then(setInviteInfo)
      .catch(() => setError('邀请链接已过期或无效'));
  }, [token]);

  const handleJoin = async () => {
    if (!token) return;
    setProcessing(true);
    const success = await acceptInvite(token);
    if (success) {
      navigate('/'); 
    } else {
      setError('加入失败，请稍后重试');
      setProcessing(false);
    }
  };

  // 1. 加载状态
  if (!inviteInfo && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950">
        <div className="flex flex-col items-center gap-6">
           {/* 自定义加载动画 */}
           <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-dark-800"></div>
              <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin"></div>
           </div>
           <p className="text-slate-500 text-sm font-medium tracking-widest uppercase animate-pulse">正在验证邀请信息...</p>
        </div>
      </div>
    );
  }

  // 2. 错误状态
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6">
         <div className="bg-dark-900 rounded-3xl shadow-2xl p-10 max-w-sm w-full text-center border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
               <X size={36} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">邀请无效</h3>
            <p className="text-slate-400 mb-8">{error}</p>
            <Button onClick={() => navigate('/')} variant="secondary" className="w-full rounded-xl">返回首页</Button>
         </div>
      </div>
    );
  }

  // 3. 成功确认状态
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 p-6 relative overflow-hidden font-sans">
      {/* 背景氛围 */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* 主卡片 */}
      <div className="bg-dark-900/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl shadow-black/60 max-w-lg w-full relative z-10 border border-white/10 overflow-hidden animate-slide-up transform hover:scale-[1.005] transition-transform duration-500">
        
        {/* 顶部视觉图 */}
        <div className="h-48 relative bg-gradient-to-b from-dark-800 to-dark-900 border-b border-white/5 flex items-center justify-center overflow-hidden">
           {/* 网格纹理 */}
           <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>
           
           {/* 连接线动画 */}
           <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent"></div>
           
           <div className="relative z-10 flex items-center gap-6 lg:gap-10">
              {/* 邀请人头像 */}
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 rounded-2xl bg-dark-800 border border-white/10 flex items-center justify-center text-slate-400 shadow-lg relative z-10">
                    <User size={28} />
                    <div className="absolute inset-0 bg-white/5 rounded-2xl animate-pulse"></div>
                 </div>
                 <div className="text-xs font-medium text-slate-500 bg-dark-950/50 px-2 py-1 rounded border border-white/5">邀请人</div>
              </div>
              
              {/* 动态箭头 */}
              <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 animate-float shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                 <ArrowRight size={20} />
              </div>

              {/* 企业 Logo */}
              <div className="flex flex-col items-center gap-3">
                 <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white shadow-[0_0_25px_rgba(16,185,129,0.3)] border border-white/10 relative z-10">
                    <Building2 size={28} />
                 </div>
                 <div className="text-xs font-medium text-brand-400 bg-brand-900/20 px-2 py-1 rounded border border-brand-500/20">目标团队</div>
              </div>
           </div>
        </div>

        {/* 内容区域 */}
        <div className="p-10 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">团队协作邀请</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
               <span className="text-white font-medium">{inviteInfo?.inviterName}</span> 邀请您加入 <br/>
               <span className="text-brand-400 font-bold text-lg">{inviteInfo?.merchantName}</span>
            </p>

            {/* 权限列表 */}
            <div className="bg-dark-950/50 rounded-2xl p-6 mb-8 border border-white/5 text-left">
               <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">您将获得以下权限：</h4>
               <ul className="space-y-4">
                  <li className="flex items-start gap-4 text-sm text-slate-300">
                     <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <Check size={12} strokeWidth={4} />
                     </div>
                     <span>访问 {inviteInfo?.merchantName} 的所有选址地图数据</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-slate-300">
                     <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <Check size={12} strokeWidth={4} />
                     </div>
                     <span>团队协作与审批流程权限</span>
                  </li>
                  <li className="flex items-start gap-4 text-sm text-slate-300">
                     <div className="mt-0.5 w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 shrink-0">
                        <Check size={12} strokeWidth={4} />
                     </div>
                     <span>企业级数据加密传输保障</span>
                  </li>
               </ul>
            </div>

            {user?.currentMerchantId && (
               <div className="mb-6 px-4 py-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200/80 text-xs text-left flex gap-3 items-start">
                  <ShieldCheck className="shrink-0 mt-0.5 text-yellow-500" size={14} />
                  <span>
                     <strong>注意：</strong> 您当前已在其他工作空间。接受邀请后，该企业将添加到您的账户，您可以在后台切换。
                  </span>
               </div>
            )}

            <div className="space-y-4">
               <Button 
                  onClick={handleJoin} 
                  isLoading={processing} 
                  className="w-full py-4 text-lg font-bold shadow-[0_4px_20px_-5px_rgba(16,185,129,0.5)] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
               >
                  确认并加入团队
               </Button>
               <Button 
                  onClick={() => navigate('/')} 
                  variant="ghost" 
                  className="w-full text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded-2xl"
               >
                  暂不加入，返回首页
               </Button>
            </div>
        </div>
      </div>
    </div>
  );
};