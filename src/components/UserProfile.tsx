import React, { useState } from 'react';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  IdcardOutlined, 
  SafetyCertificateOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  HistoryOutlined,
  CameraOutlined,
  EditOutlined,
  FileTextOutlined,
  EyeOutlined,
  ReadOutlined,
  ArrowRightOutlined,
  LogoutOutlined // นำเข้าปุ่ม Logout สำหรับ Negative Action
} from '@ant-design/icons';

interface UserProfileProps {
  currentUser: any;
  lineProfile: any;
}

export default function UserProfile({ currentUser, lineProfile }: UserProfileProps) {
  const [activeTab, setActiveTab] = useState('timeline');

  const getDisplayAvatar = () => {
    if (lineProfile && lineProfile.pictureUrl) return lineProfile.pictureUrl;
    if (currentUser && currentUser.profile_url) return currentUser.profile_url;
    return null;
  };

  return (
    <div className="animate-fade-in w-full max-w-7xl mx-auto pb-20 px-4 sm:px-6 lg:px-8">
      
      {/* 1. Header Banner & Avatar (RWD Optimized & Soft Shadow Applied) */}
      <div className="relative mt-4 mb-24 md:mb-32">
        {/* Banner with Mesh Gradient Style and Soft Shadow */}
        <div 
          className="h-44 sm:h-56 md:h-80 w-full rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.45) 0%, transparent 60%),
              radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 30% 90%, rgba(244, 63, 94, 0.35) 0%, transparent 60%),
              radial-gradient(circle at 90% 80%, rgba(234, 179, 8, 0.35) 0%, transparent 60%)
            `
          }}
        >
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]"></div>
          <button className="absolute top-6 right-6 p-3 bg-white/30 hover:bg-white/50 backdrop-blur-md rounded-2xl text-slate-700 border border-white/50 transition-all hidden sm:block shadow-sm">
            <CameraOutlined className="text-xl" />
          </button>
        </div>

        {/* Avatar Positioned with RWD and Correct Border Radius Math */}
        <div className="absolute -bottom-16 left-0 right-0 md:left-12 md:right-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            {/* Outer container radius accounts for padding to match inner radius */}
            <div className="p-2 bg-white rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden bg-slate-50 relative">
                {getDisplayAvatar() ? (
                  <img src={getDisplayAvatar()} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200 text-6xl">
                    <UserOutlined />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                  <CameraOutlined className="text-white text-3xl" />
                </div>
              </div>
            </div>
            {/* Interactive Edit Button */}
            <button className="absolute bottom-2 right-2 w-10 h-10 bg-[#2563eb] hover:bg-[#1d4ed8] border-4 border-white rounded-full shadow-md text-white flex items-center justify-center transition-transform hover:scale-110">
               <EditOutlined className="text-sm" />
            </button>
          </div>

          <div className="text-center md:text-left md:pb-6">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-[#1e293b] m-0 tracking-tight">
                {currentUser?.full_name || 'Safety Member'}
              </h1>
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-extrabold uppercase tracking-widest rounded-full shadow-sm">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[11px] mt-2 flex items-center justify-center md:justify-start gap-1.5">
              <IdcardOutlined /> Employee ID: {currentUser?.employee_id || currentUser?.username || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal Data (Soft Shadows & Clear Sections) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 border border-slate-50">
            
            {/* Section 1: About Me */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[18px] font-black text-slate-800 m-0">About Me</h3>
              <button className="text-blue-600 font-bold text-xs flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-xl">
                <EditOutlined /> Edit
              </button>
            </div>

            {/* Anatomy of UI Elements applied here (Clear Hierarchy) */}
            <div className="space-y-6">
              {[
                { icon: <IdcardOutlined />, label: "สังกัด / บริษัท", value: currentUser?.department || 'บริษัทรับเหมาคู่ค้า', bg: "bg-blue-50", text: "text-blue-600" },
                { icon: <SafetyCertificateOutlined />, label: "ระดับความปลอดภัย", value: "Level 4 (Gold Member)", bg: "bg-emerald-50", text: "text-emerald-600" },
                { icon: <PhoneOutlined />, label: "เบอร์โทรศัพท์", value: currentUser?.phone || '08x-xxx-xxxx', bg: "bg-orange-50", text: "text-orange-600" },
                { icon: <MailOutlined />, label: "อีเมลติดต่อ", value: currentUser?.email || 'member@safetyos.com', bg: "bg-purple-50", text: "text-purple-600" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group">
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} ${item.text} flex items-center justify-center text-xl shadow-sm transition-transform group-hover:scale-110`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest m-0 mb-0.5">{item.label}</p>
                    <p className="text-[14px] font-extrabold text-slate-700 m-0">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full h-px bg-slate-100 my-8"></div>

            {/* Section 2: Connection Status (Menu Sections Rule) */}
            <div>
              <h3 className="text-[18px] font-black text-slate-800 mb-5">Connections</h3>
              {lineProfile ? (
                <div className="bg-[#00C300]/5 border border-[#00C300]/20 p-4 rounded-[1.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#00C300] p-2.5 rounded-xl shadow-md shadow-emerald-500/20">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-slate-800 m-0 leading-tight">LINE Account</p>
                      <p className="text-[11px] text-emerald-600 font-bold m-0 mt-0.5">Connected Active</p>
                    </div>
                  </div>
                  <CheckCircleOutlined className="text-emerald-500 text-xl" />
                </div>
              ) : (
                <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-widest hover:border-[#00C300] hover:text-[#00C300] hover:bg-emerald-50/30 transition-all">
                  Connect LINE Official
                </button>
              )}
            </div>
            
            {/* ✨ Tip: Negative Action - Make destructive actions obvious but not loud */}
            <button className="w-full mt-6 py-4 rounded-2xl bg-rose-50 text-rose-600 font-bold text-[13px] hover:bg-rose-100 hover:shadow-sm transition-all flex items-center justify-center gap-2">
               <LogoutOutlined /> Sign Out
            </button>

          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Stats Grid - Adaptive RWD with Soft Shadows */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Permits", val: 24, icon: <FileTextOutlined />, color: "from-blue-600 to-indigo-600", shadow: "shadow-[0_16px_32px_rgba(37,99,235,0.2)]" },
              { label: "BBS Done", val: 8, icon: <EyeOutlined />, color: "from-emerald-500 to-teal-600", shadow: "shadow-[0_16px_32px_rgba(16,185,129,0.2)]" },
              { label: "Certs", val: 5, icon: <SafetyCertificateOutlined />, color: "from-orange-400 to-rose-500", shadow: "shadow-[0_16px_32px_rgba(249,115,22,0.2)]" },
              { label: "E-Learn", val: "98%", icon: <ReadOutlined />, color: "from-purple-600 to-indigo-700", shadow: "shadow-[0_16px_32px_rgba(147,51,234,0.2)]" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} ${stat.shadow} text-white transform transition-transform hover:-translate-y-1`}>
                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md shadow-inner text-xl">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-black mb-1 tracking-tight">{stat.val}</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-white/80">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Activity Section with Custom Tailwind Tabs */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] min-h-[500px] flex flex-col overflow-hidden border border-slate-50">
            {/* Tab Nav (Menu Sections styling applied) */}
            <div className="flex p-4 gap-2 bg-slate-50/50 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-3.5 text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-2xl ${activeTab === 'timeline' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              >
                <HistoryOutlined className="mr-1.5" /> Timeline
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3.5 text-[13px] font-extrabold uppercase tracking-wide transition-all rounded-2xl ${activeTab === 'settings' ? 'bg-white text-[#2563eb] shadow-[0_4px_12px_rgba(0,0,0,0.04)]' : 'text-slate-400 hover:bg-white/50 hover:text-slate-600'}`}
              >
                <SettingOutlined className="mr-1.5" /> Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8 flex-1">
              {activeTab === 'timeline' ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <HistoryOutlined className="text-4xl text-slate-300" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 m-0">No recent activity</h4>
                  <p className="text-slate-500 font-medium text-sm max-w-[280px] mt-2 leading-relaxed">เมื่อคุณทำกิจกรรมในระบบ เช่น ส่ง Permit หรือทำแบบทดสอบ ประวัติจะแสดงที่นี่</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Change Password", desc: "Update your security key", icon: <EditOutlined /> },
                    { title: "Notification Setup", desc: "Manage LINE alerts", icon: <CheckCircleOutlined /> },
                    { title: "Language", desc: "Switch to TH / EN", icon: <ArrowRightOutlined /> },
                    { title: "Active Sessions", desc: "Manage logged-in devices", icon: <UserOutlined /> },
                  ].map((opt, i) => (
                    <button key={i} className="p-6 bg-[#f8fafc] hover:bg-white hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:border-blue-100 rounded-[2rem] border border-transparent flex items-center justify-between transition-all group text-left">
                      <div>
                        <h5 className="font-extrabold text-[15px] text-slate-800 m-0">{opt.title}</h5>
                        <p className="text-[11px] text-slate-500 font-bold mt-1 m-0">{opt.desc}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shadow-sm">
                        {opt.icon}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}