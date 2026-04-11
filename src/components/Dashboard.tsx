import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Progress, Modal, Button, Image, Grid, Avatar, Tag, Tooltip, Steps, Divider } from 'antd'; 
import { 
  ToolOutlined, CheckCircleOutlined, WarningOutlined, 
  DashboardOutlined, HistoryOutlined, TeamOutlined, ThunderboltOutlined,
  EyeOutlined, DownloadOutlined, EnvironmentOutlined,
  ClockCircleOutlined, CloseOutlined, FileTextOutlined, SafetyCertificateOutlined,
  SyncOutlined, RightOutlined, UserOutlined, StopOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';
const { useBreakpoint } = Grid; 

interface DashboardProps {
  currentUser?: any;
}

export default function Dashboard({ currentUser }: DashboardProps) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [data, setData] = useState<any>({
    stats: { totalPermits: 0, pendingPermits: 0, openIncidents: 0, defectiveEquip: 0, totalUsers: 0 },
    recentPermits: [],
    recentIncidents: [],
    recentBbs: []
  });

  // State สำหรับ Modal จุดเสี่ยง
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // State สำหรับ Modal สรุปใบอนุญาตทำงาน
  const [isPermitModalOpen, setIsPermitModalOpen] = useState(false);
  const [selectedPermit, setSelectedPermit] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(true), 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setIsRefreshing(true);

    try {
      // 🟢 ดึงกุญแจจากกระเป๋า
      const token = localStorage.getItem('token');
      // 🟢 สร้าง Config สำหรับแนบกุญแจไปกับ Axios
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [resDash, resBbs, resPermits] = await Promise.all([
        axios.get(`${API_URL}/dashboard`, config).catch(() => ({ data: {} })), // 🟢 แนบกุญแจ
        axios.get(`${API_URL}/bbs`, config).catch(() => ({ data: [] })),       // 🟢 แนบกุญแจ
        axios.get(`${API_URL}/permits?limit=5`, config).catch(() => ({ data: { data: [] } })) // 🟢 แนบกุญแจ
      ]);

      const dashData = resDash.data || {};
      const permitList = resPermits.data?.data ? resPermits.data.data : (resPermits.data || []);

      setData({
        stats: {
          totalPermits: dashData.stats?.totalPermits || 0,
          pendingPermits: dashData.stats?.pendingPermits || 0,
          openIncidents: dashData.stats?.openIncidents || 0,
          defectiveEquip: dashData.stats?.defectiveEquip || 0,
          totalUsers: dashData.stats?.totalUsers || 'N/A' 
        },
        recentPermits: Array.isArray(permitList) ? permitList.slice(0, 5) : [],
        recentIncidents: Array.isArray(dashData.recentIncidents) ? dashData.recentIncidents : [],
        recentBbs: Array.isArray(resBbs.data) ? resBbs.data.slice(0, 4) : [] 
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const showIncidentDetail = (incident: any) => {
    setSelectedIncident(incident);
    setIsIncidentModalOpen(true);
  };

  const showPermitDetail = (permit: any) => {
    setSelectedPermit(permit);
    setIsPermitModalOpen(true);
  };

  // ฟังก์ชันหาขั้นตอนการอนุมัติ (สำหรับ Timeline)
  const getApprovalStep = (status: string) => {
    if (status === 'PENDING_AREA_OWNER') return 0;
    if (status === 'PENDING_SAFETY') return 1;
    if (status === 'APPROVED' || status === 'CLOSED') return 2;
    if (status === 'REJECTED' || status === 'REVOKED') return 1; // Error state
    return 0;
  };

  if (loading) {
    return (
      <div className="pb-20 w-full animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-slate-200 rounded-2xl"></div>
          <div className="h-6 bg-slate-200 rounded w-48 mt-1"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-36 flex flex-col justify-between">
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-12 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-80"><div className="h-full bg-slate-50 rounded-xl"></div></div>
             <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-64"><div className="h-full bg-slate-50 rounded-xl"></div></div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-[600px]"><div className="h-full bg-slate-50 rounded-xl"></div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20 animate-fade-in">
      
      {/* 🚀 Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white flex items-center justify-center">
            <DashboardOutlined className="text-2xl md:text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight leading-tight">Safety Overview</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium m-0 mt-0.5">
              ศูนย์บัญชาการความปลอดภัย {currentUser?.department ? `(${currentUser.department})` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Tooltip title="อัปเดตข้อมูลล่าสุด">
            <Button shape="circle" icon={<SyncOutlined spin={isRefreshing} />} onClick={() => fetchDashboardData(true)} className="bg-white border-slate-200 text-slate-500 shadow-sm" />
          </Tooltip>
          <div className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold shadow-sm bg-white text-[11px] md:text-xs">
            <ClockCircleOutlined className={isRefreshing ? "text-blue-500 animate-spin" : "text-blue-500"} /> 
            อัปเดตล่าสุด: {dayjs(lastUpdated).format('HH:mm')} น.
          </div>
        </div>
      </div>

      {/* 📊 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Card 1: Permits */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-blue-500/10 hover:ring-blue-200 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"><FileTextOutlined style={{ fontSize: '100px' }} /></div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ใบอนุญาตทำงาน</p>
              <h3 className="text-4xl font-black text-slate-800 m-0">{data.stats.totalPermits}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><FileTextOutlined className="text-2xl" /></div>
          </div>
          <div className="relative z-10">
            <Progress percent={Math.round((data.stats.pendingPermits / (data.stats.totalPermits || 1)) * 100) || 0} status="active" strokeColor={{ '0%': '#3b82f6', '100%': '#8b5cf6' }} trailColor="#f1f5f9" size="small" showInfo={false} className="mb-1.5" />
            <p className="text-[11px] md:text-xs text-slate-500 font-bold m-0 flex justify-between">
              <span>รอตรวจสอบ {data.stats.pendingPermits} ใบ</span>
              <span className="text-blue-600">{Math.round((data.stats.pendingPermits / (data.stats.totalPermits || 1)) * 100) || 0}%</span>
            </p>
          </div>
        </div>

        {/* Card 2: Incidents */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-rose-500/10 hover:ring-rose-200 transition-all duration-300 relative overflow-hidden group cursor-pointer" onClick={() => document.getElementById('incidents-section')?.scrollIntoView({ behavior: 'smooth' })}>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">จุดเสี่ยง (Open)</p>
              <h3 className="text-4xl font-black text-slate-800 m-0 group-hover:text-rose-600 transition-colors">{data.stats.openIncidents}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:rotate-12 transition-transform"><WarningOutlined className="text-2xl" /></div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10 flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold ${data.stats.openIncidents > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
              {data.stats.openIncidents > 0 ? (
                <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span>รอการแก้ไขด่วน!</>
              ) : (
                <><CheckCircleOutlined /> พื้นที่ปลอดภัย 100%</>
              )}
            </span>
          </div>
        </div>

        {/* Card 3: Equipment */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-amber-500/10 hover:ring-amber-200 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">อุปกรณ์ชำรุด</p>
              <h3 className="text-4xl font-black text-slate-800 m-0 group-hover:text-amber-500 transition-colors">{data.stats.defectiveEquip}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:-rotate-12 transition-transform"><ToolOutlined className="text-2xl" /></div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <p className="text-[11px] text-slate-500 font-bold m-0 flex items-center gap-1.5"><HistoryOutlined /> รอทีมช่างเข้าดำเนินการ</p>
          </div>
        </div>

        {/* Card 4: Users */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-emerald-500/10 hover:ring-emerald-200 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">พนักงานในพื้นที่</p>
              <h3 className="text-4xl font-black text-slate-800 m-0 group-hover:text-emerald-500 transition-colors">{data.stats.totalUsers || 'N/A'}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform"><TeamOutlined className="text-2xl" /></div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <p className="text-[11px] text-slate-500 font-bold m-0 flex items-center gap-1.5"><SafetyCertificateOutlined className="text-emerald-500 text-sm" /> ยืนยันตัวตนผ่านระบบแล้ว</p>
          </div>
        </div>

      </div>

      {/* 📋 Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (Permits & BBS) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Permits Box */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500"><FileTextOutlined className="text-lg" /></div>
              <h2 className="text-base md:text-lg font-extrabold text-slate-800 m-0 flex-1">ใบอนุญาตทำงานล่าสุด</h2>
              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border border-indigo-100 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span></span> Live
              </span>
            </div>
            
            <div className="p-4 bg-[#f8fafc]">
              {data.recentPermits.length > 0 ? (
                <div className="space-y-3">
                  {data.recentPermits.map((item: any) => (
                    <div 
                      key={item.id} 
                      onClick={() => showPermitDetail(item)}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-[1.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 group-hover:bg-indigo-50 transition-all">
                          <ThunderboltOutlined className="text-xl text-slate-400 group-hover:text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm md:text-base font-bold text-slate-800 truncate m-0 leading-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <p className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase tracking-widest m-0">
                              {item.permit_type.replace('_', ' ')}
                            </p>
                            <span className="text-[11px] font-semibold text-slate-400 flex items-center truncate max-w-[150px]"><EnvironmentOutlined className="mr-1"/>{item.location_detail}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end flex-shrink-0 border-t sm:border-t-0 border-slate-50 pt-3 sm:pt-0 mt-1 sm:mt-0 gap-3">
                        {item.status === 'APPROVED' ? (
                           <Tag color="green" className="m-0 rounded-lg font-bold border-green-200 px-3 py-1.5 flex items-center gap-1.5"><CheckCircleOutlined /> ดำเนินการ</Tag>
                        ) : item.status.includes('PENDING') ? (
                           <Tag color="orange" className="m-0 rounded-lg font-bold border-orange-200 px-3 py-1.5 flex items-center gap-1.5"><ClockCircleOutlined /> รอตรวจ</Tag>
                        ) : item.status === 'CLOSED' ? (
                           <Tag color="default" className="m-0 rounded-lg font-bold border-slate-200 px-3 py-1.5 text-slate-500 flex items-center gap-1.5"><HistoryOutlined /> ปิดงาน</Tag>
                        ) : (
                           <Tag color="red" className="m-0 rounded-lg font-bold border-rose-200 px-3 py-1.5 flex items-center gap-1.5"><WarningOutlined /> {item.status}</Tag>
                        )}
                        <Button type="text" shape="circle" icon={<RightOutlined className="text-slate-300 group-hover:text-indigo-500" />} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white m-2">
                  <FileTextOutlined className="text-5xl text-slate-300 mb-3" />
                  <p className="font-bold text-slate-500">ยังไม่มีการขอใบอนุญาตทำงาน</p>
                </div>
              )}
            </div>
          </div>
          
          {/* BBS Box */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center gap-3 bg-white">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500"><EyeOutlined className="text-lg" /></div>
              <h2 className="text-base md:text-lg font-extrabold text-slate-800 m-0">BBS Observation (ล่าสุด)</h2>
            </div>
            <div className="p-4 bg-[#f8fafc]">
               {data.recentBbs.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {data.recentBbs.map((bbs: any) => (
                     <div key={bbs.id} className="bg-white p-4.5 rounded-[1.5rem] border border-slate-100 shadow-sm flex items-start gap-3 hover:border-emerald-200 transition-colors">
                       {bbs.behavior_type === 'SAFE' ? (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0"><CheckCircleOutlined className="text-lg" /></div>
                       ) : (
                          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center flex-shrink-0 animate-pulse"><WarningOutlined className="text-lg" /></div>
                       )}
                       <div className="flex-1 min-w-0 pt-0.5">
                         <p className={`text-[10px] font-black uppercase tracking-widest m-0 mb-1 ${bbs.behavior_type === 'SAFE' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {bbs.behavior_type} BEHAVIOR
                         </p>
                         <p className="text-xs font-bold text-slate-700 m-0 line-clamp-2 leading-relaxed">{bbs.description}</p>
                         <p className="text-[10px] font-semibold text-slate-400 mt-2 m-0 flex items-center gap-1 truncate"><EnvironmentOutlined /> {bbs.location}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white m-2">
                    <EyeOutlined className="text-4xl text-slate-300 mb-2 block" />
                    <p className="font-bold m-0">ยังไม่มีรายงานพฤติกรรม (BBS)</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* 🚨 Right Column: Incidents */}
        <div id="incidents-section" className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full lg:max-h-[900px]">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><WarningOutlined className="text-lg" /></div>
              <h2 className="text-base md:text-lg font-extrabold text-slate-800 m-0">รายงานจุดเสี่ยง</h2>
            </div>
          </div>
          
          <div className="p-4 flex-1 bg-[#f8fafc] overflow-y-auto custom-scrollbar">
            {data.recentIncidents.length > 0 ? (
              <div className="space-y-3">
                {data.recentIncidents.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => showIncidentDetail(item)}
                    className="flex flex-col bg-white p-4 rounded-[1.5rem] cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg border border-slate-100 hover:border-rose-300 group"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar src={item.image_url} icon={<WarningOutlined />} shape="square" className="bg-rose-50 text-rose-400 flex-shrink-0 border border-slate-100" style={{ width: 56, height: 56, borderRadius: '14px' }} />
                      <div className="flex-1 min-w-0 pt-0.5">
                        <h4 className="text-[13px] md:text-sm font-bold text-slate-800 line-clamp-2 m-0 group-hover:text-blue-600 transition-colors leading-snug">{item.title}</h4>
                        <span className="text-[10px] font-medium text-slate-400 block mt-1 flex items-center gap-1"><ClockCircleOutlined /> {dayjs(item.created_at).fromNow()}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 flex items-center truncate max-w-[130px]"><TeamOutlined className="mr-1 text-slate-400"/>{item.reporter?.full_name?.split(' ')[0]}</span>
                      <span className="bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md font-extrabold text-[9px] uppercase tracking-widest border border-rose-100">Open</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 border-2 border-dashed border-emerald-200/50 rounded-3xl bg-emerald-50/20 m-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4"><CheckCircleOutlined className="text-3xl" /></div>
                <p className="font-bold text-slate-600 text-center m-0 text-base">ไม่มีรายงานจุดเสี่ยงใหม่</p>
                <span className="text-xs font-bold text-emerald-500 mt-1 uppercase tracking-widest">Safe Environment</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================
          🔥 Modal: Incident Details
         ========================================================= */}
      <Modal
        title={null}
        open={isIncidentModalOpen}
        onCancel={() => setIsIncidentModalOpen(false)}
        footer={null} 
        width={600} 
        centered
        styles={{ body: { padding: 0 } }} 
        className="overflow-hidden rounded-[2rem] modern-modal-wrapper"
        closeIcon={<div className="bg-black/30 hover:bg-black/60 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center mt-2 mr-2 transition-colors border border-white/20 z-50 absolute right-2 top-2 shadow-sm"><CloseOutlined className="text-xs" /></div>}
      >
        {selectedIncident && (
          <div className="bg-slate-50 flex flex-col max-h-[85vh] overflow-hidden rounded-[2rem]">
            <div className="relative h-64 md:h-80 bg-slate-900 w-full flex-shrink-0 overflow-hidden">
              {selectedIncident.image_url ? (
                <div className="absolute inset-0 w-full h-full">
                  <Image src={selectedIncident.image_url} alt="Incident" style={{ width: '100%', height: '100%', objectFit: 'cover' }} preview={{ mask: <div className="text-white font-bold"><EyeOutlined className="mr-2"/> ดูรูปเต็ม</div> }} className="w-full h-full object-cover opacity-80" />
                </div>
              ) : (
                <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-200">
                  <WarningOutlined className="text-6xl mb-3 text-slate-400"/>
                  <span className="font-bold">ไม่มีรูปภาพประกอบ</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/60 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10 flex flex-col justify-end">
                <div className="flex gap-2 mb-3">
                  <span className="bg-rose-500 text-white px-2.5 py-1 rounded-md font-bold text-[10px] tracking-widest shadow-sm">OPEN</span>
                  <span className="bg-white/20 text-white px-2.5 py-1 rounded-md backdrop-blur-md font-bold text-[10px] border border-white/30 tracking-widest uppercase">{selectedIncident.type}</span>
                </div>
                <h2 className="text-white text-xl md:text-3xl font-black m-0 drop-shadow-lg leading-snug line-clamp-3">{selectedIncident.title}</h2>
              </div>
            </div>

            <div className="p-5 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-slate-50 relative z-20">
              <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-slate-200 mb-5 flex items-center gap-4">
                <div className="bg-blue-50 w-12 h-12 rounded-xl text-blue-600 flex items-center justify-center flex-shrink-0"><EnvironmentOutlined className="text-2xl" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-1">พิกัดสถานที่ (GPS)</p>
                  <p className="text-sm md:text-base font-bold text-slate-700 m-0 font-mono bg-slate-50 px-2.5 py-1 rounded border border-slate-100 inline-block truncate max-w-full">
                    {selectedIncident.lat?.toFixed(5) || '0.000'}, {selectedIncident.lng?.toFixed(5) || '0.000'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileTextOutlined className="text-blue-500 text-base" /> รายละเอียดที่พบ</h4>
                <p className="text-sm md:text-base font-medium text-slate-700 leading-relaxed m-0 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              <div className="bg-slate-100/50 p-4 md:p-5 rounded-2xl border border-slate-200 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div className="flex items-center gap-3 min-w-0">
                  <Avatar icon={<TeamOutlined />} size="large" className="bg-white text-slate-400 border border-slate-200 shadow-sm flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-0.5">ผู้แจ้งเหตุ</p>
                    <p className="text-sm font-bold text-slate-800 m-0 truncate">{selectedIncident.reporter?.full_name || 'ไม่ระบุชื่อ'}</p>
                  </div>
                 </div>
                 <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-0.5">เวลาที่แจ้ง</p>
                    <p className="text-xs font-bold text-slate-600 m-0 bg-white px-2.5 py-1 rounded-md border border-slate-200 inline-block shadow-sm">
                      {dayjs(selectedIncident.created_at).format('DD/MM/YYYY HH:mm')}
                    </p>
                 </div>
              </div>

              <Button type="primary" size="large" block className="h-14 rounded-2xl text-base font-extrabold bg-slate-800 hover:bg-slate-900 border-none shadow-xl shadow-slate-900/20" onClick={() => setIsIncidentModalOpen(false)}>
                รับทราบ และปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =========================================================
          🔥 NEW Modal: Permit Summary Details
         ========================================================= */}
      <Modal
        title={null}
        open={isPermitModalOpen}
        onCancel={() => setIsPermitModalOpen(false)}
        footer={null}
        width={750}
        centered
        styles={{ body: { padding: 0 } }} 
        className="overflow-hidden rounded-[2rem] modern-modal-wrapper"
        closeIcon={<div className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full w-8 h-8 flex items-center justify-center mt-4 mr-4 transition-colors"><CloseOutlined className="text-xs" /></div>}
      >
        {selectedPermit && (
          <div className="bg-white flex flex-col max-h-[85vh] overflow-hidden rounded-[2rem]">
            
            {/* Header Permit */}
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0"><FileTextOutlined className="text-2xl" /></div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl md:text-2xl font-black text-slate-800 m-0 truncate pr-8">{selectedPermit.title}</h2>
                  <p className="text-sm font-bold text-slate-500 m-0 mt-1 flex items-center gap-2">
                    เลขที่: <span className="bg-white px-2 py-0.5 rounded border border-slate-200 font-mono text-indigo-600">{selectedPermit.permit_number}</span>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4">
                <Tag color="blue" className="px-3 py-1 rounded-lg font-bold text-xs uppercase border-blue-200 m-0">{selectedPermit.permit_type.replace('_', ' ')}</Tag>
                {selectedPermit.status === 'APPROVED' ? (
                   <Tag color="green" className="px-3 py-1 rounded-lg font-bold text-xs border-green-200 m-0 flex items-center gap-1"><CheckCircleOutlined /> อนุมัติแล้ว</Tag>
                ) : selectedPermit.status === 'REJECTED' ? (
                   <Tag color="red" className="px-3 py-1 rounded-lg font-bold text-xs border-red-200 m-0 flex items-center gap-1"><CloseOutlined /> ไม่อนุมัติ</Tag>
                ) : selectedPermit.status === 'REVOKED' ? (
                   <Tag color="red" className="px-3 py-1 rounded-lg font-bold text-xs border-red-200 m-0 flex items-center gap-1 bg-red-600 text-white"><StopOutlined /> ระงับงานฉุกเฉิน</Tag>
                ) : (
                   <Tag color="orange" className="px-3 py-1 rounded-lg font-bold text-xs border-orange-200 m-0 flex items-center gap-1"><ClockCircleOutlined /> {selectedPermit.status}</Tag>
                )}
              </div>
            </div>

            {/* Body Permit */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 relative">
              
              {/* Approval Timeline (โชว์แบบ Enterprise) */}
              <div className="mb-8 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5">สถานะการอนุมัติ (Approval Flow)</h4>
                <Steps
                  size="small"
                  current={getApprovalStep(selectedPermit.status)}
                  status={selectedPermit.status === 'REJECTED' || selectedPermit.status === 'REVOKED' ? 'error' : 'process'}
                  items={[
                    { title: <span className="font-bold text-xs">ยื่นคำร้อง</span>, description: <span className="text-[10px]">{dayjs(selectedPermit.created_at).format('DD/MM HH:mm')}</span> },
                    { title: <span className="font-bold text-xs">Area Owner</span>, description: <span className="text-[10px]">ตรวจสอบพื้นที่</span> },
                    { title: <span className="font-bold text-xs">Safety Engineer</span>, description: <span className="text-[10px]">อนุมัติขั้นสุดท้าย</span> },
                  ]}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><UserOutlined /> ผู้ขออนุญาต (ผู้รับเหมา)</h4>
                  <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-3">
                    <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 m-0">{selectedPermit.contractor_supervisor || selectedPermit.applicant?.full_name || 'ไม่ระบุชื่อ'}</p>
                      <p className="text-xs text-slate-500 m-0">{selectedPermit.contractor_company || 'ไม่ระบุบริษัท'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><EnvironmentOutlined /> สถานที่ปฏิบัติงาน</h4>
                  <div className="bg-white border border-slate-200 p-3 rounded-xl h-[58px] flex items-center">
                    <p className="text-sm font-bold text-slate-800 m-0 truncate">{selectedPermit.location_detail}</p>
                  </div>
                </div>
              </div>

              <Divider className="my-6 border-slate-100" />

              <div className="mb-8">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">รายละเอียดของงาน (Scope of Work)</h4>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                  <p className="text-sm font-medium text-slate-700 m-0 whitespace-pre-wrap">{selectedPermit.description || 'ไม่มีการระบุรายละเอียดเพิ่มเติม'}</p>
                </div>
              </div>

              {/* เอกสารแนบ (ถ้ามี) */}
              <div className="mb-4">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3">เอกสารแนบ (Attachments & JSA)</h4>
                {selectedPermit.attached_docs || selectedPermit.attached_file ? (
                  <div className="bg-white border-2 border-dashed border-slate-200 p-4 rounded-xl flex items-center justify-between hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500"><FileTextOutlined className="text-xl" /></div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 m-0">เอกสารแนบประกอบการทำงาน</p>
                        <p className="text-xs text-slate-500 m-0">คลิกเพื่อดู Job Safety Analysis (JSA)</p>
                      </div>
                    </div>
                    <Button type="primary" shape="round" icon={<DownloadOutlined />} href={selectedPermit.attached_docs || selectedPermit.attached_file} target="_blank" className="bg-indigo-600 hover:bg-indigo-700 border-none font-bold shadow-md shadow-indigo-500/20">
                      เปิดดูไฟล์
                    </Button>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center text-slate-400 text-sm font-medium">
                    ไม่มีไฟล์เอกสารแนบในระบบ
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </Modal>

      {/* Global Styles */}
      <style>{`
        .modern-modal-wrapper .ant-modal-content {
          padding: 0 !important;
          border-radius: 2rem !important;
          overflow: hidden;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
}