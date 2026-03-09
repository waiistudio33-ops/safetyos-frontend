import React, { useState, useEffect } from 'react';
import { Typography, Avatar, Divider, Spin, Grid } from 'antd';
import { 
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyCertificateOutlined, IdcardOutlined, BookOutlined, ScanOutlined, QrcodeOutlined
} from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import dayjs from 'dayjs';

const { useBreakpoint } = Grid;

export default function EPassport({ currentUser, lineProfile }: { currentUser: any, lineProfile?: any }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [myCerts, setMyCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const res = await fetch('https://safetyos-backend.onrender.com/certificates');
        const data = await res.json();
        const approvedCerts = data.filter((c: any) => c.user_id === currentUser?.id && c.status === 'APPROVED');
        setMyCerts(approvedCerts);
      } catch (error) {
        console.error('ดึงข้อมูล E-Passport ไม่สำเร็จ');
      } finally {
        setIsLoading(false);
      }
    };

    if (currentUser) fetchMyData();
  }, [currentUser]);

  if (!currentUser) return null;

  // 🎨 ไล่สี (Gradient) ตาม Role ของพนักงานให้เหมือนใน Mockup
  const getRoleGradient = () => {
    switch (currentUser.role) {
      case 'SAFETY_ENGINEER': return 'from-indigo-500 to-cyan-400'; 
      case 'AREA_OWNER': return 'from-orange-500 to-yellow-400'; 
      default: return 'from-emerald-400 to-teal-400'; // สีเขียวสว่างแบบในรูป Mockup
    }
  };

  return (
    <div className="w-full pb-20 px-2 md:px-0 flex flex-col items-center">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 w-full max-w-md md:max-w-2xl justify-center md:justify-start">
        <div className="bg-slate-800 p-3 rounded-2xl shadow-md text-white flex items-center justify-center">
          <IdcardOutlined className="text-2xl" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 m-0 tracking-tight">My E-Passport</h2>
          <p className="text-slate-500 text-xs font-semibold m-0 mt-0.5">บัตรประจำตัวดิจิทัล (Digital ID)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spin size="large" />
          <span className="text-slate-400 font-bold mt-4 animate-pulse">กำลังโหลดบัตรประจำตัว...</span>
        </div>
      ) : (
        <div className="w-full max-w-[380px] relative animate-fade-in group mt-2">
          
          {/* 🪪 ตัวบัตร E-Passport */}
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100/50 relative transition-transform duration-300 hover:-translate-y-1">
            
            {/* รูเจาะสายคล้องบัตร */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-slate-900/10 rounded-full z-20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]"></div>

            {/* แถบสีด้านบน (Header บัตร) - 🟢 เอา Avatar ออกจากบล็อกนี้แล้ว เพื่อไม่ให้โดน overflow-hidden ตัด */}
            <div className={`h-36 bg-gradient-to-b ${getRoleGradient()} relative overflow-hidden`}>
              {/* แสงตกกระทบเงาๆ ด้านบน */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/30 to-transparent"></div>
            </div>

            {/* ข้อมูลพนักงาน */}
            <div className="pt-16 pb-8 px-6 text-center bg-white relative">
              
              {/* 🟢 ย้ายรูปโปรไฟล์มาไว้ตรงนี้แทน บังคับให้ลอยด้วย z-20 และดันขึ้นไปด้วย -top-[54px] */}
              <div className="absolute -top-[54px] left-1/2 -translate-x-1/2 z-20">
                <div className="p-1 bg-white rounded-full shadow-md">
                  <Avatar 
                    src={lineProfile?.pictureUrl || currentUser?.profile_url} 
                    icon={!(lineProfile?.pictureUrl || currentUser?.profile_url) && <UserOutlined />} 
                    size={100} 
                    className="border-4 border-white object-cover bg-slate-100 text-slate-400 shadow-inner"
                  />
                </div>
              </div>

              <h3 className="text-2xl font-black text-slate-800 m-0 tracking-tight">{currentUser.full_name}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1.5 mb-0">{currentUser.department}</p>
              
              {/* Badge ของ Role */}
              <div className="mt-3 inline-block">
                <span className="inline-flex items-center justify-center gap-1.5 bg-white text-slate-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200/80 shadow-sm">
                  <ScanOutlined className="text-blue-500 text-xs" /> {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              {/* 🔳 ส่วนของ QR Code สไตล์ Scanner */}
              <div className="flex flex-col items-center justify-center mt-8 mb-6">
                <div className="relative p-5 bg-white rounded-3xl inline-block">
                  {/* กรอบมุม 4 ด้าน (Scanner Brackets) */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-blue-400 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-blue-400 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-blue-400 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-blue-400 rounded-br-2xl"></div>
                  
                  <QRCodeCanvas 
                    value={`https://safetyos-frontend.vercel.app/verify/${currentUser.id}`} 
                    size={140} 
                    bgColor={"#ffffff"}
                    fgColor={"#1e293b"}
                    level={"Q"}
                    includeMargin={false}
                  />
                </div>
                
                {/* ป้าย Scan for verification */}
                <div className="mt-3 flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-full">
                  <QrcodeOutlined className="text-slate-400" />
                  <span className="text-[9px] font-extrabold text-slate-400 tracking-[0.15em] uppercase">Scan for Verification</span>
                </div>
              </div>

              {/* 📋 สถานะการฝึกอบรม (Safety Status) */}
              <div className="text-left bg-slate-50/70 p-5 rounded-[1.5rem] border border-slate-100">
                <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3 pl-1">Safety Status</h4>
                
                <div className="space-y-3">
                  {/* 1. E-Learning Status */}
                  <div className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 border border-emerald-100">
                        <BookOutlined className="text-base" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">ปฐมนิเทศ (Induction)</span>
                    </div>
                    <CheckCircleOutlined className="text-emerald-500 text-lg" />
                  </div>

                  {/* 2. Certificate Status */}
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100/50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100">
                        <SafetyCertificateOutlined className="text-base" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">ใบอนุญาต (Certificates)</span>
                    </div>
                    
                    {myCerts.length > 0 ? (
                      <div className="space-y-2 pl-11">
                        {myCerts.map((cert) => (
                          <div key={cert.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                            <span className="font-semibold text-slate-500 truncate pr-2">{cert.cert_name}</span>
                            <span className="text-blue-600 font-extrabold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 whitespace-nowrap text-[10px]">
                              หมด: {dayjs(cert.expiry_date).format('DD/MM/YY')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5 pl-11 pb-1">
                        <CloseCircleOutlined className="text-slate-300" /> ไม่มีใบ Certificate พิเศษ
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          {/* ลายเซ็น/ตราประทับท้ายบัตร */}
          <div className="text-center mt-6 flex items-center justify-center gap-1.5 opacity-80">
            <CheckCircleOutlined className="text-emerald-500 text-sm" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">Verified by SafetyOS</span>
          </div>

        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}