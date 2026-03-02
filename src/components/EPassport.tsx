import React, { useState, useEffect } from 'react';
import { Card, Typography, Avatar, Tag, Divider, Spin, Grid } from 'antd';
import { 
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyCertificateOutlined, IdcardOutlined, BookOutlined
} from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function EPassport({ currentUser, lineProfile }: { currentUser: any, lineProfile?: any }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [myCerts, setMyCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // จำลองการดึงข้อมูลใบ Certificate ของตัวเองจาก Backend
    const fetchMyData = async () => {
      try {
        const res = await fetch('https://safetyos-backend.onrender.com/certificates');
        const data = await res.json();
        // กรองเอาเฉพาะใบเซอร์ของคนๆ นี้ และที่ผ่านการอนุมัติแล้ว
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

  // กำหนดสีบัตรตาม Role
  const roleColor = 
    currentUser.role === 'SAFETY_ENGINEER' ? 'from-indigo-600 to-blue-700' :
    currentUser.role === 'AREA_OWNER' ? 'from-amber-500 to-orange-500' :
    'from-emerald-500 to-teal-600'; // ผู้รับเหมาสีเขียว

  return (
    <div className="w-full pb-20 px-2 md:px-0 flex flex-col items-center">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-8 w-full max-w-md md:max-w-2xl justify-center md:justify-start">
        <div className="bg-gradient-to-tr from-slate-800 to-slate-900 p-3 md:p-4 rounded-2xl shadow-lg text-white">
          <IdcardOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">My E-Passport</h2>
          <p className="text-slate-500 text-xs md:text-sm m-0 mt-1">บัตรประจำตัวดิจิทัล (Digital ID)</p>
        </div>
      </div>

      {isLoading ? (
        <div className="py-20"><Spin size="large" /></div>
      ) : (
        <div className="w-full max-w-md relative animate-fade-in">
          
          {/* 🪪 ตัวบัตร E-Passport */}
          <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 relative">
            
            {/* รูเจาะสายคล้องบัตร (ตกแต่ง) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-3 bg-slate-200/50 rounded-full z-10 backdrop-blur-sm border border-white/20 shadow-inner"></div>

            {/* แถบสีด้านบน (Header บัตร) */}
            <div className={`h-36 bg-gradient-to-br ${roleColor} relative`}>
              {/* ลวดลายตกแต่ง */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              
              {/* รูปโปรไฟล์ (ดึงจาก LINE ถ้ามี) */}
              <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                <div className="p-1.5 bg-white rounded-full shadow-lg">
                  <Avatar 
                    src={lineProfile?.pictureUrl} 
                    icon={!lineProfile?.pictureUrl && <UserOutlined />} 
                    size={96} 
                    className="border-2 border-slate-100 object-cover"
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลพนักงาน */}
            <div className="pt-16 pb-6 px-6 text-center">
              <h3 className="text-2xl font-extrabold text-slate-800 m-0 tracking-tight">{currentUser.full_name}</h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">{currentUser.department}</p>
              
              <div className="mt-3 inline-block">
                <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>

              <Divider className="my-6 border-slate-100" />

              {/* 🔳 ส่วนของ QR Code */}
              <div className="flex flex-col items-center justify-center bg-slate-50 py-6 rounded-3xl border border-slate-100 mb-6">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                  <QRCodeCanvas 
                    value={`https://safetyos-frontend.vercel.app/verify/${currentUser.id}`} 
                    size={160} 
                    bgColor={"#ffffff"}
                    fgColor={"#1e293b"}
                    level={"Q"}
                    includeMargin={false}
                  />
                </div>
                <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase flex items-center gap-1">
                  <IdcardOutlined /> SCAN FOR VERIFICATION
                </p>
              </div>

              {/* 📋 สถานะการฝึกอบรม (Safety Status) */}
              <div className="text-left space-y-3">
                <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">สถานะความปลอดภัย (Safety Status)</h4>
                
                {/* 1. E-Learning Status */}
                <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <BookOutlined className="text-emerald-500 text-lg" />
                    <span className="text-sm font-bold text-slate-700">ปฐมนิเทศ (Safety Induction)</span>
                  </div>
                  <CheckCircleOutlined className="text-emerald-500 text-xl" />
                </div>

                {/* 2. Certificate Status */}
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-2">
                    <SafetyCertificateOutlined className="text-blue-500 text-lg" />
                    <span className="text-sm font-bold text-slate-700">ใบอนุญาต (Certificates)</span>
                  </div>
                  
                  {myCerts.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {myCerts.map((cert) => (
                        <div key={cert.id} className="flex justify-between items-center text-xs bg-white p-2 rounded-lg border border-blue-50">
                          <span className="font-semibold text-slate-600 truncate max-w-[150px]">{cert.cert_name}</span>
                          <span className="text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded">
                            หมดอายุ: {dayjs(cert.expiry_date).format('DD/MM/YY')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 flex items-center gap-1 bg-white p-2 rounded-lg border border-slate-100">
                      <CloseCircleOutlined className="text-slate-300" /> ไม่มีใบ Certificate พิเศษ
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1">
            <CheckCircleOutlined className="text-emerald-500" /> ข้อมูลได้รับการรับรองจากระบบ SafetyOS
          </p>

        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}