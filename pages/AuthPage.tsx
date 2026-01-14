import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { checkAccountExists, checkInviteTokenAPI } from '../services/mockAuthService';
import { Button } from '../components/ui/Button';
import { QrCode, Lock, Smartphone, Check, ChevronRight, Zap, MapPin, BarChart3, ShieldCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { InviteInfo } from '../types';

type AuthMethod = 'code' | 'password' | 'wechat';

// Banner 图片资源
const BANNERS = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop", // 摩天大楼/城市
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop", // 数据地球/科技
  "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"  // 数据分析/图表
];

export const AuthPage: React.FC = () => {
  const { login, loginWithPassword, register } = useAuth();
  const location = useLocation();
  
  // 状态
  const [method, setMethod] = useState<AuthMethod>('code');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Banner 轮播索引
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  
  // 邀请信息
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);

  // 轮播定时器
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
    }, 5000); // 5秒切换
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');
    if (token) {
      checkInviteTokenAPI(token)
        .then(info => setInviteInfo(info))
        .catch(err => console.error("邀请链接无效", err));
    }
  }, [location.search]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'wechat') return;

    if (phone.length !== 11) {
      showToast("请输入有效的11位手机号");
      return;
    }
    if (!agreed) {
      showToast("请阅读并同意服务协议");
      return;
    }

    setLoading(true);
    try {
      if (method === 'password') {
        await loginWithPassword(phone, password);
      } else {
        const exists = await checkAccountExists(phone);
        if (exists) {
          await login(phone, code);
        } else {
          await register(phone, code);
          showToast("注册成功，正在登录...");
        }
      }
    } catch (err) {
      showToast("验证失败，请检查输入");
    } finally {
      setLoading(false);
    }
  };

  const handleWeChatScan = () => {
    setLoading(true);
    setTimeout(() => {
       login('13800000000', '0000').catch(() => {});
       setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex bg-dark-950 font-sans text-slate-200 overflow-hidden relative">
      {/* 提示框 */}
      {toastMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-8 py-3 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.4)] z-50 animate-fade-in flex items-center gap-3 backdrop-blur-md bg-opacity-90">
          <Check size={18} />
          <span className="font-medium tracking-wide">{toastMessage}</span>
        </div>
      )}

      {/* 左侧：视觉区域 (Banner 轮播 + 动态元素) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-20 z-10 overflow-hidden">
        
        {/* Banner 背景轮播层 */}
        {BANNERS.map((bannerUrl, index) => (
          <div 
            key={index}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1500ms] ease-in-out`}
            style={{ 
              backgroundImage: `url(${bannerUrl})`,
              opacity: currentBannerIndex === index ? 0.4 : 0, // 降低不透明度以突出文字
              transform: currentBannerIndex === index ? 'scale(1.05)' : 'scale(1)', // 细微缩放效果
              transition: 'opacity 1.5s ease-in-out, transform 8s ease-out'
            }}
          />
        ))}

        {/* 全局遮罩层 - 确保文字可读性 */}
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950/90 via-dark-950/70 to-dark-950/40 z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-brand-900/20 via-transparent to-transparent z-0"></div>

        {/* 悬浮装饰元素 */}
        <div className="absolute top-[25%] right-[20%] w-16 h-16 bg-brand-500/10 rounded-2xl rotate-12 backdrop-blur-sm border border-brand-500/20 animate-float flex items-center justify-center z-10">
            <MapPin className="text-brand-400 opacity-80" size={32} />
        </div>
        <div className="absolute bottom-[30%] left-[15%] w-20 h-20 bg-blue-500/10 rounded-full backdrop-blur-sm border border-blue-500/20 animate-float-delayed flex items-center justify-center z-10">
            <BarChart3 className="text-blue-400 opacity-80" size={36} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Zap size={22} fill="currentColor" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">选址参谋</span>
          </div>

          {inviteInfo ? (
             <div className="animate-slide-up max-w-xl">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
                  收到团队邀请
                </div>
                <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8 tracking-tight drop-shadow-2xl">
                  加入 <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-teal-400">{inviteInfo.merchantName}</span>
                </h1>
                <p className="text-xl text-slate-300 leading-relaxed border-l-4 border-brand-500/50 pl-8 font-light drop-shadow-md">
                  "{inviteInfo.inviterName} 邀请您加入团队工作空间。接受邀请后，您将获得商业选址数据的即时访问权限，并开启协作之旅。"
                </p>
             </div>
          ) : (
             <div className="animate-slide-up max-w-xl">
               <h1 className="text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-8 tracking-tight drop-shadow-2xl">
                 数据驱动，<br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-brand-400 to-teal-400">让决策更明智。</span>
               </h1>
               <div className="space-y-10">
                 <p className="text-xl text-slate-300 leading-relaxed font-light drop-shadow-md">
                   “选址参谋不仅是一个工具，更是连锁品牌扩张的智能大脑。整合海量数据，为您精准预测客流与营收，最大化每一家门店的商业价值。”
                 </p>
               </div>
             </div>
          )}
        </div>

        <div className="relative z-10 text-slate-400 text-sm flex gap-8">
           <span className="opacity-80">© 2025 选址参谋 Inc.</span>
           <a href="#" className="hover:text-brand-400 transition-colors opacity-80 hover:opacity-100">隐私政策</a>
           <a href="#" className="hover:text-brand-400 transition-colors opacity-80 hover:opacity-100">服务条款</a>
        </div>
      </div>

      {/* 右侧：表单区域 (增加呼吸感) */}
      <div className="w-full lg:w-1/2 bg-dark-950 flex flex-col justify-center items-center p-8 lg:p-16 relative z-20 border-l border-white/5 shadow-2xl">
        
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-12">
             <div className="lg:hidden flex items-center gap-3 mb-8">
                <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-white">
                  <Zap size={20} fill="currentColor" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white">选址参谋</span>
             </div>

             <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
               {inviteInfo ? '登录以接受邀请' : '开启您的选址之旅'}
             </h2>
             <p className="text-slate-400 text-lg">
               {inviteInfo ? `验证身份以加入 ${inviteInfo.merchantName}` : '在一个平台管理您的选址、任务和团队。'}
             </p>
          </div>

          {/* 登录方式切换 - 增加底部高亮条动画 */}
          <div className="flex gap-8 mb-10 border-b border-white/10 pb-1">
             <button 
               onClick={() => setMethod('code')}
               className={`pb-4 text-base font-medium transition-all relative ${method === 'code' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               验证码登录
               {method === 'code' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] rounded-full"></span>}
             </button>
             <button 
               onClick={() => setMethod('password')}
               className={`pb-4 text-base font-medium transition-all relative ${method === 'password' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               密码登录
               {method === 'password' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] rounded-full"></span>}
             </button>
             <button 
               onClick={() => setMethod('wechat')}
               className={`pb-4 text-base font-medium transition-all relative ${method === 'wechat' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
             >
               微信扫码
               {method === 'wechat' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] rounded-full"></span>}
             </button>
          </div>

          {method === 'wechat' ? (
             <div className="flex flex-col items-center py-10 bg-dark-900/50 rounded-3xl border border-white/5 cursor-pointer hover:border-brand-500/30 transition-all hover:bg-dark-900 group" onClick={handleWeChatScan}>
                <div className="w-52 h-52 bg-white p-3 rounded-2xl mb-6 relative overflow-hidden shadow-lg">
                   <QrCode className="w-full h-full text-dark-950" />
                   <div className="absolute inset-0 bg-brand-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <span className="text-white font-bold text-lg tracking-wider">点击模拟扫码</span>
                   </div>
                </div>
                <p className="text-slate-400 group-hover:text-brand-400 transition-colors">请使用微信扫一扫登录</p>
             </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-8">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">手机号码</label>
                <div className="relative group">
                  <input
                    type="tel"
                    className="w-full bg-dark-900/50 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-dark-700 text-lg group-hover:border-dark-600"
                    placeholder="138 0000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  {/* 修复：图标使用绝对居中 */}
                  <Smartphone className="absolute right-5 top-1/2 -translate-y-1/2 text-dark-600 group-focus-within:text-brand-500 transition-colors w-6 h-6" />
                </div>
              </div>

              {method === 'code' && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">验证码</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      className="flex-1 bg-dark-900/50 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all text-center tracking-[0.5em] font-mono text-lg font-bold"
                      placeholder="000000"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                    />
                    <Button type="button" variant="secondary" className="whitespace-nowrap px-8 rounded-2xl border-dark-700 hover:border-brand-500/50 hover:text-brand-400 h-auto">
                      获取验证码
                    </Button>
                  </div>
                </div>
              )}

              {method === 'password' && (
                <div className="space-y-3">
                  <div className="flex justify-between pl-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">密码</label>
                    <a href="#" className="text-xs text-brand-500 hover:text-brand-400 transition-colors">忘记密码？</a>
                  </div>
                  <div className="relative group">
                    <input
                      type="password"
                      className="w-full bg-dark-900/50 border border-dark-700 text-white px-5 py-4 rounded-2xl focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 outline-none transition-all placeholder:text-dark-700 text-lg group-hover:border-dark-600"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {/* 修复：图标使用绝对居中 */}
                    <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-dark-600 group-focus-within:text-brand-500 transition-colors w-6 h-6" />
                  </div>
                </div>
              )}

              <div className="pt-2">
                 <div className="flex items-start gap-3 mb-8 pl-1">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        id="agree" 
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-dark-700 bg-dark-900 checked:border-brand-500 checked:bg-brand-500 transition-all hover:border-brand-500/50"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                      />
                      <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 w-3.5 h-3.5" strokeWidth={4} />
                    </div>
                    <label htmlFor="agree" className="text-sm text-slate-500 leading-relaxed cursor-pointer select-none">
                      我已阅读并同意 <span className="text-slate-300 hover:text-brand-500 transition-colors underline decoration-slate-700 hover:decoration-brand-500">用户协议</span> 与 <span className="text-slate-300 hover:text-brand-500 transition-colors underline decoration-slate-700 hover:decoration-brand-500">隐私政策</span>，允许 SiteCast 处理我的账户数据。
                    </label>
                 </div>

                 <Button type="submit" className="w-full py-4 text-lg font-bold shadow-[0_4px_20px_-5px_rgba(16,185,129,0.5)] rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all" isLoading={loading}>
                   {inviteInfo ? '登录并加入团队' : '登 录'}
                 </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};