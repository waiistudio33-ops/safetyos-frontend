import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Progress, Skeleton, Modal, Button, Image, Grid, Avatar } from 'antd'; 
import { 
  ToolOutlined, CheckCircleOutlined, WarningOutlined, 
  DashboardOutlined, HistoryOutlined, QrcodeOutlined,
  FileTextOutlined, TeamOutlined, ThunderboltOutlined,
  EyeOutlined, DownloadOutlined, EnvironmentOutlined,
  ClockCircleOutlined, CloseOutlined, RightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { useBreakpoint } = Grid; 

export default function Dashboard() {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [recentPermits, setRecentPermits] = useState<any[]>([]);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const resDash = await axios.get('https://safetyos-backend.onrender.com/dashboard');
      setData(resDash.data);

      const resPermits = await axios.get('https://safetyos-backend.onrender.com/permits');
      setRecentPermits(resPermits.data.slice(0, 4)); 

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const showIncidentDetail = (incident: any) => {
    setSelectedIncident(incident);
    setIsIncidentModalOpen(true);
  };

  // 🔄 หน้าจอ Loading แบบ Modern Skeleton
  if (loading || !data) {
    return (
      <div className="pb-20">
        <div className="flex items-center gap-4 mb-8">
          <Skeleton.Avatar active size={56} shape="square" style={{ borderRadius: 16 }} />
          <Skeleton active paragraph={{ rows: 1 }} className="w-48 mt-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm"><Skeleton active title paragraph={{ rows: 1 }} /></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-64"><Skeleton active paragraph={{ rows: 4 }} /></div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-64"><Skeleton active paragraph={{ rows: 4 }} /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      
      {/* 🚀 Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white flex items-center justify-center">
            <DashboardOutlined className="text-2xl md:text-3xl" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight leading-tight">Safety Overview</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium m-0 mt-0.5">ศูนย์บัญชาการและสรุปสถิติความปลอดภัยแบบ Real-time</p>
          </div>
        </div>
        
        <div className="inline-flex items-center gap-2 border border-slate-200 text-slate-600 px-4 py-2 rounded-full font-bold shadow-sm bg-white text-[11px] md:text-xs">
          <ClockCircleOutlined className="text-blue-500" /> อัปเดตล่าสุด: {dayjs().format('HH:mm')} น.
        </div>
      </div>

      {/* 📊 ส่วนที่ 1: การ์ดตัวเลขสรุป (Modern Stat Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Card 1: Permits */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-blue-500/10 hover:ring-blue-200 transition-all duration-300 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-blue-50 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
            <FileTextOutlined style={{ fontSize: '100px' }} />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ใบอนุญาตทำงาน</p>
              <h3 className="text-4xl font-black text-slate-800 m-0">{data.stats.totalPermits}</h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
              <FileTextOutlined className="text-2xl" />
            </div>
          </div>
          <div className="relative z-10">
            <Progress 
              percent={Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0} 
              status="active" 
              strokeColor={{ '0%': '#3b82f6', '100%': '#8b5cf6' }}
              trailColor="#f1f5f9"
              size="small" 
              showInfo={false} 
              className="mb-1.5" 
            />
            <p className="text-[11px] md:text-xs text-slate-500 font-bold m-0 flex justify-between">
              <span>รอตรวจสอบ {data.stats.pendingPermits} ใบ</span>
              <span className="text-blue-600">{Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0}%</span>
            </p>
          </div>
        </div>

        {/* Card 2: Incidents */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-rose-500/10 hover:ring-rose-200 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">จุดเสี่ยง (Open)</p>
              <h3 className="text-4xl font-black text-slate-800 m-0 group-hover:text-rose-600 transition-colors">{data.stats.openIncidents}</h3>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:rotate-12 transition-transform">
              <WarningOutlined className="text-2xl" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span></span>
              รอการแก้ไขด่วน!
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
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 group-hover:-rotate-12 transition-transform">
              <ToolOutlined className="text-2xl" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <p className="text-[11px] text-slate-500 font-bold m-0 flex items-center gap-1.5">
              <HistoryOutlined /> รอทีมช่างดำเนินการซ่อมบำรุง
            </p>
          </div>
        </div>

        {/* Card 4: Users */}
        <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm ring-1 ring-inset ring-slate-100 hover:shadow-xl hover:shadow-emerald-500/10 hover:ring-emerald-200 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">พนักงานในพื้นที่</p>
              <h3 className="text-4xl font-black text-slate-800 m-0 group-hover:text-emerald-500 transition-colors">{data.stats.totalUsers}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
              <TeamOutlined className="text-2xl" />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 relative z-10">
            <p className="text-[11px] text-slate-500 font-bold m-0 flex items-center gap-1.5">
              <CheckCircleOutlined className="text-emerald-500" /> ยืนยันตัวตนผ่าน E-Passport แล้ว
            </p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🚀 ส่วนที่ 2: รายงานจุดเสี่ยงล่าสุด */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><WarningOutlined className="text-lg" /></div>
              <h2 className="text-base md:text-lg font-extrabold text-slate-800 m-0">รายงานจุดเสี่ยงล่าสุด</h2>
            </div>
          </div>
          
          <div className="p-4 flex-1 bg-slate-50/50">
            {data.recentIncidents.length > 0 ? (
              <div className="space-y-3">
                {data.recentIncidents.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => showIncidentDetail(item)}
                    className="flex items-center gap-4 bg-white p-3.5 rounded-2xl cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md border border-slate-100 hover:border-rose-200 group"
                  >
                    <Avatar src={item.image_url} icon={<WarningOutlined />} shape="square" className="bg-rose-50 text-rose-400 flex-shrink-0 border border-slate-100" style={{ width: 60, height: 60, borderRadius: '16px' }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm md:text-base font-bold text-slate-800 truncate m-0 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 flex items-center bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100 truncate max-w-[120px]"><TeamOutlined className="mr-1 text-slate-400"/>{item.reporter?.full_name}</span>
                        <span className="text-[10px] font-medium text-slate-400">{dayjs(item.created_at).fromNow()}</span>
                      </div>
                    </div>
                    <div className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg font-bold text-[10px] md:text-xs uppercase flex-shrink-0 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      Open
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white m-2">
                <CheckCircleOutlined className="text-5xl text-emerald-400 mb-3" />
                <p className="font-bold text-slate-500">ไม่มีรายงานจุดเสี่ยงใหม่</p>
                <span className="text-xs">พื้นที่ปลอดภัย 100%</span>
              </div>
            )}
          </div>
        </div>

        {/* 🚀 ส่วนที่ 3: งานล่าสุด */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500"><FileTextOutlined className="text-lg" /></div>
            <h2 className="text-base md:text-lg font-extrabold text-slate-800 m-0">ใบอนุญาตทำงานล่าสุด</h2>
          </div>
          
          <div className="p-4 flex-1 bg-slate-50/50">
            {recentPermits.length > 0 ? (
              <div className="space-y-3">
                {recentPermits.map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <ThunderboltOutlined className="text-xl text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm md:text-base font-bold text-slate-800 truncate m-0 leading-tight">{item.title}</h4>
                        <p className="text-[11px] font-bold text-indigo-600 bg-indigo-50/50 border border-indigo-100 inline-block px-2.5 py-0.5 rounded-md m-0 mt-1.5 uppercase tracking-wide">
                          {item.permit_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div className="w-full sm:w-auto flex justify-end flex-shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-1 sm:mt-0">
                      {item.attached_file ? (
                        <Button type="primary" shape="round" icon={<DownloadOutlined />} href={item.attached_file} target="_blank" className="bg-slate-800 hover:!bg-indigo-600 border-none shadow-md shadow-slate-800/20 font-bold w-full sm:w-auto transition-colors">
                          เปิด JSA
                        </Button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold italic bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 w-full sm:w-auto text-center">ไม่มีไฟล์แนบ</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white m-2">
                <FileTextOutlined className="text-5xl text-slate-300 mb-3" />
                <p className="font-bold text-slate-500">ยังไม่มีคิวงานในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================
          🔥 Immersive Modal (หน้าต่างดูรายละเอียดแบบ Modern Mobile-First)
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
        closeIcon={<div className="bg-black/30 hover:bg-black/60 backdrop-blur-md text-white rounded-full w-8 h-8 flex items-center justify-center mt-2 mr-2 transition-colors border border-white/20"><CloseOutlined className="text-xs" /></div>}
      >
        {selectedIncident && (
          <div className="bg-slate-50 flex flex-col max-h-[90vh]">
            
            {/* Header / Cover Image */}
            <div className="relative h-56 md:h-72 bg-slate-900 w-full flex-shrink-0">
              {selectedIncident.image_url ? (
                <Image 
                  src={selectedIncident.image_url} 
                  alt="Incident" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  preview={{ mask: <div className="text-white font-bold"><EyeOutlined className="mr-2"/> ดูรูปเต็ม</div> }}
                  className="opacity-90"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-200">
                  <WarningOutlined className="text-5xl mb-3 text-slate-400"/>
                  <span className="font-bold">ไม่มีรูปภาพประกอบ</span>
                </div>
              )}
              {/* Gradient Overlay for Text */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-full p-6 z-10">
                <div className="flex gap-2 mb-3">
                  <span className="bg-rose-500 text-white px-2.5 py-1 rounded-md font-bold text-[10px] tracking-widest shadow-sm">OPEN</span>
                  <span className="bg-white/20 text-white px-2.5 py-1 rounded-md backdrop-blur-md font-bold text-[10px] border border-white/30 tracking-widest uppercase">{selectedIncident.type}</span>
                </div>
                <h2 className="text-white text-xl md:text-2xl font-extrabold m-0 drop-shadow-lg leading-snug">{selectedIncident.title}</h2>
              </div>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-5 md:p-6 overflow-y-auto">
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 flex items-center gap-3.5">
                <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><EnvironmentOutlined className="text-xl" /></div>
                <div>
                  <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-0.5">พิกัดสถานที่ (GPS)</p>
                  <p className="text-sm font-bold text-slate-700 m-0 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                    {selectedIncident.lat?.toFixed(5) || '0.000'}, {selectedIncident.lng?.toFixed(5) || '0.000'}
                  </p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FileTextOutlined className="text-blue-500" /> รายละเอียดที่พบ</h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed m-0 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200 mb-6 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                  <Avatar icon={<TeamOutlined />} size="large" className="bg-white text-slate-400 border border-slate-200 shadow-sm" />
                  <div>
                    <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-0.5">ผู้แจ้งเหตุ</p>
                    <p className="text-sm font-bold text-slate-800 m-0">{selectedIncident.reporter?.full_name || 'ไม่ระบุชื่อ'}</p>
                  </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-extrabold m-0 uppercase tracking-widest mb-0.5">เวลาที่แจ้ง</p>
                    <p className="text-xs font-bold text-slate-600 m-0">{dayjs(selectedIncident.created_at).format('DD/MM/YYYY HH:mm')}</p>
                 </div>
              </div>

              {/* Action Button */}
              <Button type="primary" size="large" block className="h-12 md:h-14 rounded-2xl text-base font-bold bg-slate-800 hover:bg-slate-900 border-none shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2" onClick={() => setIsIncidentModalOpen(false)}>
                รับทราบ และปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        /* ทำให้ Modal มุมโค้งสวยงาม */
        .modern-modal-wrapper .ant-modal-content {
          padding: 0 !important;
          border-radius: 2rem !important;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}