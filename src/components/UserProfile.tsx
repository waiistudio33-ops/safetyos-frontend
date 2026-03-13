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
  ArrowRightOutlined
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
      
      {/* 1. Header Banner & Avatar (RWD Optimized) */}
      <div className="relative mt-4 mb-24 md:mb-32">
        {/* Banner with Mesh Gradient Style */}
        <div 
          className="h-44 sm:h-56 md:h-80 w-full rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500"
          style={{
            backgroundColor: '#ffffff',
            backgroundImage: `
              radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.6) 0%, transparent 50%),
              radial-gradient(circle at 80% 10%, rgba(16, 185, 129, 0.5) 0%, transparent 50%),
              radial-gradient(circle at 30% 90%, rgba(244, 63, 94, 0.5) 0%, transparent 50%),
              radial-gradient(circle at 90% 80%, rgba(234, 179, 8, 0.5) 0%, transparent 50%)
            `
          }}
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
          <button className="absolute top-6 right-6 p-3 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white border border-white/30 transition-all hidden sm:block">
            <CameraOutlined className="text-xl" />
          </button>
        </div>

        {/* Avatar Positioned with RWD */}
        <div className="absolute -bottom-16 left-0 right-0 md:left-12 md:right-auto flex flex-col md:flex-row items-center md:items-end gap-6">
          <div className="relative group">
            <div className="p-1.5 bg-white rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.1)] ring-8 ring-white/50">
              <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-white bg-slate-50 relative">
                {getDisplayAvatar() ? (
                  <img src={getDisplayAvatar()} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-200 text-6xl">
                    <UserOutlined />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                  <CameraOutlined className="text-white text-3xl" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-2 right-2 w-6 h-6 sm:w-8 sm:h-8 bg-emerald-500 border-4 border-white rounded-full shadow-lg"></div>
          </div>

          <div className="text-center md:text-left md:pb-6">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 m-0 tracking-tight">
                {currentUser?.full_name || 'Safety Member'}
              </h1>
              <span className="px-4 py-1 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-md shadow-blue-600/20">
                {currentUser?.role || 'User'}
              </span>
            </div>
            <p className="text-slate-400 font-bold tracking-widest uppercase text-[11px] mt-2">
              <IdcardOutlined className="mr-2" /> Employee ID: {currentUser?.employee_id || currentUser?.username || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Personal Data */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 border border-slate-50">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-800 m-0">About Me</h3>
              <button className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:underline">
                <EditOutlined /> Edit
              </button>
            </div>

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
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest m-0">{item.label}</p>
                    <p className="text-[15px] font-bold text-slate-700 m-0">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-slate-50">
              <h4 className="text-sm font-black text-slate-800 mb-5 uppercase tracking-widest">Connect</h4>
              {lineProfile ? (
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#00C300] p-2 rounded-xl shadow-lg shadow-emerald-500/20">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="white"><path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 3.938 8.91 9.388 9.62.367.082.868.256.996.584.115.294.074.755.035 1.053-.053.407-.246 1.488-.299 1.748-.087.419.412.632.748.441 3.585-2.036 9.539-5.617 11.83-9.351C23.633 12.923 24 11.666 24 10.304z"/></svg>
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 m-0 leading-tight">LINE Connect</p>
                      <p className="text-[11px] text-emerald-600 font-bold m-0">Active</p>
                    </div>
                  </div>
                  <CheckCircleOutlined className="text-emerald-500 text-lg" />
                </div>
              ) : (
                <button className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest hover:border-[#00C300] hover:text-[#00C300] transition-all">
                  Connect LINE Official
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats & Activity */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Stats Grid - Adaptive RWD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "Permits", val: 24, icon: <FileTextOutlined />, color: "from-blue-600 to-indigo-600", shadow: "shadow-blue-500/20" },
              { label: "BBS Done", val: 8, icon: <EyeOutlined />, color: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20" },
              { label: "Certs", val: 5, icon: <SafetyCertificateOutlined />, color: "from-orange-400 to-rose-500", shadow: "shadow-orange-500/20" },
              { label: "E-Learn", val: "98%", icon: <ReadOutlined />, color: "from-purple-600 to-indigo-700", shadow: "shadow-purple-500/20" }
            ].map((stat, i) => (
              <div key={i} className={`p-6 rounded-[2rem] bg-gradient-to-br ${stat.color} ${stat.shadow} text-white shadow-xl transform transition-transform hover:scale-105 active:scale-95`}>
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  {stat.icon}
                </div>
                <div className="text-3xl font-black mb-1">{stat.val}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/70">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Activity Section with Custom Tailwind Tabs */}
          <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/40 min-h-[500px] flex flex-col overflow-hidden border border-slate-50">
            {/* Tab Nav */}
            <div className="flex border-b border-slate-50 p-4">
              <button 
                onClick={() => setActiveTab('timeline')}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === 'timeline' ? 'bg-slate-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <HistoryOutlined className="mr-2" /> Timeline
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-4 text-sm font-black uppercase tracking-widest transition-all rounded-2xl ${activeTab === 'settings' ? 'bg-slate-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <SettingOutlined className="mr-2" /> Settings
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-8 flex-1">
              {activeTab === 'timeline' ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                  <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-slate-50/50">
                    <HistoryOutlined className="text-4xl text-slate-200" />
                  </div>
                  <h4 className="text-lg font-black text-slate-400 m-0 uppercase tracking-tighter">No recent activity</h4>
                  <p className="text-slate-300 text-sm max-w-[240px] mt-2">เมื่อคุณใช้งานระบบ ประวัติกิจกรรมจะมาโชว์ที่นี่ครับ</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { title: "Password", desc: "Change security key", icon: <EditOutlined /> },
                    { title: "Notify", desc: "Line notification setup", icon: <CheckCircleOutlined /> },
                    { title: "Language", desc: "TH / EN Language", icon: <ArrowRightOutlined /> },
                    { title: "Session", desc: "Manage active devices", icon: <UserOutlined /> },
                  ].map((opt, i) => (
                    <button key={i} className="p-6 bg-slate-50/50 hover:bg-white hover:shadow-lg rounded-[2rem] border border-slate-100 flex items-center justify-between transition-all group">
                      <div className="text-left">
                        <h5 className="font-black text-slate-700 m-0">{opt.title}</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{opt.desc}</p>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
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