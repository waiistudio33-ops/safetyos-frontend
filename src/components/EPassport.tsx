import React, { useState, useEffect } from 'react';
import { Typography, Avatar, Divider, Spin, Grid } from 'antd';
import { 
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyCertificateOutlined, IdcardOutlined, BookOutlined, ScanOutlined
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

  // 🎨 ไล่สี (Gradient) แบบ 3 มิติ ตาม Role ของพนักงาน
  const getRoleGradient = () => {
    switch (currentUser.role) {
      case 'SAFETY_ENGINEER': return 'from-indigo-600 via-blue-600 to-cyan-500'; // น้ำเงิน-ฟ้า
      case 'AREA_OWNER': return 'from-orange-500 via-amber-500 to-yellow-400'; // ส้ม-เหลือง
      default: return 'from-emerald-500 via-teal-500 to-green-400'; // ผู้รับเหมา: เขียว
    }
  };

  return (
    <div className="w-full pb-20 px-2 md:px-0 flex flex-col items-center">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-8 w-full max-w-md md:max-w-2xl justify-center md:justify-start">
        <div className="bg-gradient-to-tr from-slate-800 to-slate-900 p-3 md:p-4 rounded-2xl shadow-lg shadow-slate-900/20 text-white">
          <IdcardOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">My E-Passport</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium m-0 mt-0.5">บัตรประจำตัวดิจิทัล (Digital ID)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <Spin size="large" />
          <span className="text-slate-400 font-bold mt-4 animate-pulse">กำลังโหลดบัตรประจำตัว...</span>
        </div>
      ) : (
        <div className="w-full max-w-[400px] relative animate-fade-in group">
          
          {/* 🪪 ตัวบัตร E-Passport */}
          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/60 overflow-hidden border border-slate-100 relative transition-transform duration-300 group-hover:scale-[1.01]">
            
            {/* รูเจาะสายคล้องบัตร (ดูมีมิติเหมือนเจาะรูจริงๆ) */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-900/10 rounded-full z-20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] border border-white/10"></div>

            {/* แถบสีด้านบน (Header บัตร) */}
            <div className={`h-40 bg-gradient-to-br ${getRoleGradient()} relative overflow-hidden`}>
              {/* ลวดลาย Security Pattern แบบจางๆ */}
              <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
              
              {/* แสงตกกระทบ (Shine Effect) */}
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white/20 to-transparent"></div>
              
              {/* รูปโปรไฟล์ */}
              <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 z-10">
                <div className="p-1.5 bg-white rounded-full shadow-lg">
                  <Avatar 
                    src={lineProfile?.pictureUrl || currentUser?.profile_url} 
                    icon={!(lineProfile?.pictureUrl || currentUser?.profile_url) && <UserOutlined />} 
                    size={104} 
                    className="border-2 border-slate-50 object-cover bg-slate-100 text-slate-400"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลพนักงาน */}
            <div className="pt-20 pb-6 px-6 text-center bg-white relative">
              <h3 className="text-2xl font-black text-slate-800 m-0 tracking-tight leading-none">{currentUser.full_name}</h3>
              <p className="text-sm font-semibold text-slate-500 mt-2 mb-0">{currentUser.department}</p>
              
              <div className="mt-4 inline-block">
                <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ring-1 ring-inset ring-slate-200 shadow-sm">
                  <ScanOutlined className="text-blue-500" /> {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              <Divider className="my-6 border-slate-100" />

              {/* 🔳 ส่วนของ QR Code สไตล์ Scanner */}
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="relative p-4 bg-white rounded-3xl shadow-sm border border-slate-100 inline-block">
                  {/* กรอบมุม 4 ด้าน (Scanner Brackets) */}
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
                  
                  <QRCodeCanvas 
                    value={`https://safetyos-frontend.vercel.app/verify/${currentUser.id}`} 
                    size={150} 
                    bgColor={"#ffffff"}
                    fgColor={"#0f172a"}
                    level={"Q"}
                    includeMargin={false}
                  />
                </div>
                <p className="text-[10px] font-extrabold text-slate-400 mt-4 tracking-widest uppercase flex items-center gap-1.5 bg-slate-50 px-3 py-1 rounded-full">
                  <IdcardOutlined /> Scan for Verification
                </p>
              </div>

              {/* 📋 สถานะการฝึกอบรม (Safety Status) */}
              <div className="text-left space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">Safety Status</h4>
                
                {/* 1. E-Learning Status */}
                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500">
                      <BookOutlined className="text-lg" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">ปฐมนิเทศ (Induction)</span>
                  </div>
                  <CheckCircleOutlined className="text-emerald-500 text-xl drop-shadow-sm" />
                </div>

                {/* 2. Certificate Status */}
                <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
                      <SafetyCertificateOutlined className="text-lg" />
                    </div>
                    <span className="text-sm font-bold text-slate-700">ใบอนุญาต (Certificates)</span>
                  </div>
                  
                  {myCerts.length > 0 ? (
                    <div className="space-y-2 pl-11">
                      {myCerts.map((cert) => (
                        <div key={cert.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-50 last:border-0 last:pb-0">
                          <span className="font-semibold text-slate-600 truncate pr-2">{cert.cert_name}</span>
                          <span className="text-blue-600 font-bold bg-blue-50/50 px-2 py-0.5 rounded ring-1 ring-inset ring-blue-500/20 whitespace-nowrap">
                            หมด: {dayjs(cert.expiry_date).format('DD/MM/YY')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1.5 pl-11 pb-1">
                      <CloseCircleOutlined className="text-slate-300" /> ไม่มีใบ Certificate พิเศษ
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          <p className="text-center text-[11px] font-bold text-slate-400 mt-6 flex items-center justify-center gap-1.5 uppercase tracking-wide">
            <CheckCircleOutlined className="text-emerald-500 text-sm" /> Verified by SafetyOS
          </p>

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