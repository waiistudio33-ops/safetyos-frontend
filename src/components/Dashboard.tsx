import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Row, Col, Statistic, Typography, List, Tag, Space, Avatar, Progress, Skeleton, Modal, Button, Image, Grid } from 'antd'; 
import { 
  ToolOutlined, CheckCircleOutlined, WarningOutlined, 
  DashboardOutlined, HistoryOutlined, QrcodeOutlined,
  FileTextOutlined, TeamOutlined, ThunderboltOutlined,
  EyeOutlined, DownloadOutlined, EnvironmentOutlined,
  ClockCircleOutlined, CloseOutlined // ✅ แก้บัค: เพิ่ม Import 2 ตัวนี้ที่ทำจอพัง
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;
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

  // 🔄 หน้าจอ Loading ระหว่างรอข้อมูล
  if (loading || !data) {
    return (
      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <Skeleton active avatar paragraph={{ rows: 2 }} className="mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Skeleton.Button active style={{ height: 120, width: '100%', borderRadius: 24 }} />
          <Skeleton.Button active style={{ height: 120, width: '100%', borderRadius: 24 }} />
          <Skeleton.Button active style={{ height: 120, width: '100%', borderRadius: 24 }} />
          <Skeleton.Button active style={{ height: 120, width: '100%', borderRadius: 24 }} />
        </div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  return (
    <div className="w-full pb-20">
      
      {/* 🚀 Header Section (Responsive จัดเรียงใหม่ในมือถือ) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-2xl shadow-lg shadow-blue-500/30">
            <DashboardOutlined className="text-2xl md:text-3xl text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">Safety Overview</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium m-0 mt-1">ศูนย์บัญชาการและสรุปสถิติความปลอดภัยแบบ Real-time</p>
          </div>
        </div>
        
        <div className="inline-flex items-center border border-blue-200 text-blue-600 px-4 py-2 rounded-full font-bold shadow-sm md:ml-0 bg-blue-50/50 text-xs md:text-sm">
          <ClockCircleOutlined className="mr-2" /> อัปเดตล่าสุด: {dayjs().format('HH:mm')} น.
        </div>
      </div>

      {/* 📊 ส่วนที่ 1: การ์ดตัวเลขสรุป (Modern Stat Cards - จัด Grid ให้สวยทั้งมือถือและคอม) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Card 1: Permits */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-t-4 border-t-blue-500 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start mb-2">
            <div className="z-10">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">ใบอนุญาตงานทั้งหมด</p>
              <h3 className="text-4xl font-black text-slate-800 m-0">{data.stats.totalPermits}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 z-10 group-hover:scale-110 transition-transform">
              <FileTextOutlined className="text-xl" />
            </div>
          </div>
          <div className="mt-4 z-10 relative">
            <Progress percent={Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0} status="active" strokeColor="#3b82f6" size="small" showInfo={false} className="mb-1" />
            <p className="text-xs text-slate-500 font-medium m-0 flex justify-between">
              <span>รอตรวจสอบ {data.stats.pendingPermits} ใบ</span>
              <span className="text-blue-600 font-bold">{Math.round((data.stats.pendingPermits / data.stats.totalPermits) * 100) || 0}%</span>
            </p>
          </div>
        </div>

        {/* Card 2: Incidents */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-t-4 border-t-red-500 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">จุดเสี่ยง (Open)</p>
              <h3 className="text-4xl font-black text-red-500 m-0">{data.stats.openIncidents}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-2xl text-red-500 group-hover:scale-110 transition-transform">
              <WarningOutlined className="text-xl" />
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-50">
            <p className="text-xs font-bold text-red-500 m-0 bg-red-50 inline-block px-2 py-1 rounded-md">⚠️ ต้องการการแก้ไขด่วน!</p>
          </div>
        </div>

        {/* Card 3: Equipment */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-t-4 border-t-orange-500 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">อุปกรณ์ชำรุด</p>
              <h3 className="text-4xl font-black text-orange-500 m-0">{data.stats.defectiveEquip}</h3>
            </div>
            <div className="bg-orange-50 p-3 rounded-2xl text-orange-500 group-hover:scale-110 transition-transform">
              <ToolOutlined className="text-xl" />
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-50">
            <p className="text-xs text-slate-500 font-medium m-0">รอทีมช่างดำเนินการซ่อมบำรุง</p>
          </div>
        </div>

        {/* Card 4: Users */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">พนักงานในพื้นที่</p>
              <h3 className="text-4xl font-black text-emerald-500 m-0">{data.stats.totalUsers}</h3>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600 group-hover:scale-110 transition-transform">
              <TeamOutlined className="text-xl" />
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-slate-50 flex items-center gap-2">
            <CheckCircleOutlined className="text-emerald-500" />
            <p className="text-xs text-slate-500 font-medium m-0">ยืนยันตัวตนผ่าน E-Passport</p>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 🚀 ส่วนที่ 2: รายงานจุดเสี่ยงล่าสุด (รายการปรับ UI ใหม่สวยขึ้น) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="bg-red-100 p-2 rounded-xl text-red-500"><WarningOutlined className="text-lg" /></div>
            <h2 className="text-lg font-bold text-slate-800 m-0">รายงานจุดเสี่ยงล่าสุด</h2>
          </div>
          <div className="p-4 flex-1">
            {data.recentIncidents.length > 0 ? data.recentIncidents.map((item: any) => (
              <div 
                key={item.id} 
                onClick={() => showIncidentDetail(item)}
                className="flex items-center gap-4 p-3 mb-2 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-200 group"
              >
                <Avatar src={item.image_url} icon={<WarningOutlined />} shape="square" className="bg-red-50 text-red-500 flex-shrink-0" style={{ width: 56, height: 56, borderRadius: '14px' }} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm md:text-base font-bold text-slate-800 truncate m-0 group-hover:text-blue-600 transition-colors">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 truncate"><TeamOutlined className="mr-1"/>{item.reporter?.full_name}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">{dayjs(item.created_at).fromNow()}</span>
                  </div>
                </div>
                <div className="bg-red-500 text-white px-2 py-1 rounded-md font-bold text-[10px] md:text-xs uppercase">Open</div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <CheckCircleOutlined className="text-4xl text-emerald-400 mb-2" />
                <p>ไม่มีรายงานจุดเสี่ยงใหม่ เยี่ยมมาก!</p>
              </div>
            )}
          </div>
        </div>

        {/* 🚀 ส่วนที่ 3: งานล่าสุด (รายการแบบการ์ดย่อยในมือถือ) */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600"><FileTextOutlined className="text-lg" /></div>
            <h2 className="text-lg font-bold text-slate-800 m-0">ใบอนุญาตทำงานล่าสุด</h2>
          </div>
          <div className="p-4 flex-1">
            {recentPermits.length > 0 ? recentPermits.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 mb-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="bg-blue-50 p-3 rounded-xl flex-shrink-0">
                    <ThunderboltOutlined className="text-xl text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm md:text-base font-bold text-slate-800 truncate m-0">{item.title}</h4>
                    <p className="text-xs font-semibold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded-md m-0 mt-1">{item.permit_type.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="w-full sm:w-auto flex justify-end">
                  {item.attached_file ? (
                    <Button type="primary" shape="round" icon={<DownloadOutlined />} href={item.attached_file} target="_blank" className="bg-indigo-600 border-none shadow-md shadow-indigo-500/30 font-bold w-full sm:w-auto">
                      เปิด JSA
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400 italic bg-slate-50 px-3 py-1.5 rounded-full">ไม่มีไฟล์แนบ</span>
                  )}
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileTextOutlined className="text-4xl mb-2" />
                <p>ยังไม่มีคิวงานในขณะนี้</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* =========================================================
          🔥 Immersive Modal (หน้าต่างดูรายละเอียดแบบ Modern Mobile-First)
         ========================================================= */}
      <Modal
        title={null} // ซ่อน Title เพื่อใช้รูปเต็มขอบ
        open={isIncidentModalOpen}
        onCancel={() => setIsIncidentModalOpen(false)}
        footer={null} 
        width={600} 
        centered
        styles={{ body: { padding: 0 } }} // ✅ แก้ Warning: เปลี่ยนจาก bodyStyle เป็น styles
        className="overflow-hidden rounded-3xl"
        closeIcon={<div className="bg-black/40 hover:bg-black/60 backdrop-blur-md text-white rounded-full p-2 mt-2 mr-2 transition-colors"><CloseOutlined /></div>}
      >
        {selectedIncident && (
          <div className="bg-slate-50 flex flex-col max-h-[90vh]">
            
            {/* Header / Cover Image */}
            <div className="relative h-48 md:h-64 bg-slate-900 w-full flex-shrink-0">
              {selectedIncident.image_url ? (
                <Image 
                  src={selectedIncident.image_url} 
                  alt="Incident" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }}
                  preview={{ mask: <div className="text-white"><EyeOutlined className="mr-2"/> ดูรูปเต็ม</div> }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-200">
                  <WarningOutlined className="text-4xl mb-2 text-slate-400"/>
                  <span>ไม่มีรูปภาพประกอบ</span>
                </div>
              )}
              {/* Gradient Overlay for Text */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex gap-2 mb-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded-md font-bold text-xs">OPEN</span>
                  <span className="bg-white/20 text-white px-2 py-1 rounded-md backdrop-blur-sm font-bold text-xs border border-white/30">{selectedIncident.type}</span>
                </div>
                <h2 className="text-white text-xl md:text-2xl font-bold m-0 drop-shadow-md leading-tight">{selectedIncident.title}</h2>
              </div>
            </div>

            {/* Content Body (Scrollable) */}
            <div className="p-6 overflow-y-auto">
              
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-4 flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-full text-blue-600"><EnvironmentOutlined className="text-lg" /></div>
                <div>
                  <p className="text-xs text-slate-400 font-bold m-0 uppercase tracking-wide">พิกัดสถานที่ (GPS)</p>
                  <p className="text-sm font-semibold text-slate-700 m-0">{selectedIncident.lat?.toFixed(5)}, {selectedIncident.lng?.toFixed(5)}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
                <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><FileTextOutlined className="text-blue-500" /> รายละเอียดที่พบ</h4>
                <p className="text-sm text-slate-600 leading-relaxed m-0 whitespace-pre-wrap">{selectedIncident.description}</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 mb-6 flex items-center gap-4">
                <Avatar icon={<TeamOutlined />} size="large" className="bg-blue-600 shadow-md shadow-blue-500/30" />
                <div className="flex-1">
                  <p className="text-xs text-slate-500 font-bold m-0 uppercase tracking-wide">ผู้แจ้งเหตุ</p>
                  <p className="text-base font-bold text-slate-800 m-0">{selectedIncident.reporter?.full_name}</p>
                </div>
              </div>

              {/* Action Button */}
              <Button type="primary" size="large" block className="h-14 rounded-2xl text-lg font-bold bg-slate-800 hover:bg-slate-900 border-none shadow-lg shadow-slate-900/20" onClick={() => setIsIncidentModalOpen(false)}>
                ปิดหน้าต่าง
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 