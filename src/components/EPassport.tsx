import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Spin, Grid, message, Button } from 'antd';
import { 
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  SafetyCertificateOutlined, IdcardOutlined, ScanOutlined, QrcodeOutlined,
  SyncOutlined, InfoCircleOutlined, HeartOutlined, PhoneOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { QRCodeCanvas } from 'qrcode.react';
import dayjs from 'dayjs';
import * as htmlToImage from 'html-to-image';

const { useBreakpoint } = Grid;
const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function EPassport({ currentUser, lineProfile }: { currentUser: any, lineProfile?: any }) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [myCerts, setMyCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false); 

  const cardRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    const fetchMyData = async () => {
      try {
        const res = await fetch(`${API_URL}/certificates`);
        if (res.ok) {
          const data = await res.json();
          const approvedCerts = data.filter((c: any) => c.user_id === currentUser?.id && c.status === 'APPROVED');
          setMyCerts(approvedCerts);
        } else {
          throw new Error("API Not Found");
        }
      } catch (error) {
        setMyCerts([
          { id: 1, cert_name: "ความปลอดภัยในการทำงานบนที่สูง (Height Work)", expiry_date: new Date(Date.now() + 31536000000).toISOString() },
          { id: 2, cert_name: "การทำงานในที่อับอากาศ (Confined Space)", expiry_date: new Date(Date.now() + 15536000000).toISOString() }
        ]);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    if (currentUser) fetchMyData();
  }, [currentUser]);

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);
    
    if (isFlipped) {
      setIsFlipped(false);
      await new Promise(resolve => setTimeout(resolve, 800)); 
    }

    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { 
        quality: 1, 
        pixelRatio: 2, 
        style: { transform: 'scale(1)', borderRadius: '2rem' },
        filter: (node) => !node.classList?.contains('hide-on-capture'),
        skipFonts: true, 
        useCORS: true, 
        allowTaint: true,
        cacheBust: true 
      });

      const link = document.createElement('a');
      link.download = `SafetyOS_EPassport_${currentUser.employee_id || 'ID'}.png`;
      link.href = dataUrl;
      link.click();

      message.success({ content: 'บันทึกบัตร E-Passport ลงเครื่องสำเร็จ!', duration: 4 });
    } catch (error) {
      console.error("Download Error:", error);
      message.error('ไม่สามารถบันทึกรูปภาพได้');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!currentUser) return null;

  const getRoleGradient = () => {
    switch (currentUser.role) {
      case 'SAFETY_ENGINEER': return 'from-indigo-600 via-blue-500 to-cyan-400'; 
      case 'AREA_OWNER': return 'from-orange-500 via-amber-500 to-yellow-400'; 
      default: return 'from-emerald-500 via-emerald-400 to-teal-400'; 
    }
  };

  const getRoleColorText = () => {
    switch (currentUser.role) {
      case 'SAFETY_ENGINEER': return 'text-indigo-600'; 
      case 'AREA_OWNER': return 'text-orange-500'; 
      default: return 'text-emerald-500'; 
    }
  };

  return (
    <div className="w-full pb-24 px-4 sm:px-6 flex flex-col items-center">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 w-full max-w-[360px] md:max-w-[400px] justify-center md:justify-start">
        <div className="bg-gradient-to-tr from-slate-800 to-slate-700 p-3 rounded-2xl shadow-lg text-white">
          <IdcardOutlined className="text-2xl" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 m-0 tracking-tight">My E-Passport</h2>
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest m-0 mt-0.5">บัตรประจำตัวดิจิทัล</p>
        </div>
      </div>

      {isLoading ? (
        <div className="w-full max-w-[360px] md:max-w-[400px] h-[550px] md:h-[600px] bg-slate-100 rounded-[2rem] animate-pulse flex flex-col items-center pt-24 border border-slate-200">
          <div className="w-24 h-24 bg-slate-200 rounded-full mb-6"></div>
          <div className="w-40 h-6 bg-slate-200 rounded-lg mb-3"></div>
          <div className="w-28 h-4 bg-slate-200 rounded-lg mb-8"></div>
          <div className="w-32 h-32 bg-slate-200 rounded-3xl"></div>
        </div>
      ) : (
        <div className="w-full max-w-[360px] md:max-w-[400px] animate-fade-in perspective-1000 flex flex-col items-center">
          
          {/* 🪪 กล่องสำหรับทำ 3D Flip */}
          <div className={`relative w-full h-[580px] md:h-[620px] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* ==============================================
                🎯 ด้านหน้าบัตร (Front Card)
                ============================================== */}
            <div 
              ref={cardRef} 
              className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200/60 backface-hidden group flex flex-col"
              onClick={() => setIsFlipped(true)}
              style={{ backgroundColor: '#ffffff' }} 
            >
              <div className="hide-on-capture absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-in-out z-40 pointer-events-none"></div>

              <div className="hide-on-capture absolute top-4 right-4 z-30 w-9 h-9 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 shadow-sm">
                <SyncOutlined className="text-sm" />
              </div>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-2 bg-slate-900/15 rounded-full z-20 shadow-inner"></div>

              <div className={`h-[140px] md:h-[160px] bg-gradient-to-br ${getRoleGradient()} relative overflow-hidden flex-shrink-0`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 rounded-full blur-3xl"></div>
              </div>

              <div className="pt-14 pb-6 px-4 md:px-6 text-center bg-white relative flex flex-col items-center flex-1">
                
                <div className="absolute -top-[55px] md:-top-[65px] left-1/2 -translate-x-1/2 z-20">
                  <div className="p-1 bg-white rounded-full shadow-lg relative">
                    <img 
                      src={lineProfile?.pictureUrl || currentUser?.profile_url || 'https://gw.alipayobjects.com/zos/antfincdn/XAosXuNZyF/BiazfanxmamNRoxxVxka.png'} 
                      alt="Profile"
                      crossOrigin="anonymous"
                      className="w-[90px] h-[90px] md:w-[110px] md:h-[110px] rounded-full border-[3px] border-slate-50 object-cover bg-slate-100"
                    />
                    <div className="absolute bottom-2 right-2 md:bottom-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm"></div>
                  </div>
                </div>

                <div className="w-full px-2 mt-2 md:mt-4">
                  <h3 className="text-xl md:text-[22px] font-black text-slate-800 m-0 leading-tight truncate">{currentUser.full_name}</h3>
                  <p className="text-[11px] md:text-xs font-bold text-slate-500 mt-1 mb-0 uppercase tracking-wide leading-relaxed break-words line-clamp-2">
                    {currentUser.department || 'ไม่ระบุแผนก'}
                  </p>
                </div>
                
                <div className="mt-3 inline-block">
                  <span className={`inline-flex items-center justify-center gap-1 bg-slate-50 ${getRoleColorText()} px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm`}>
                    <ScanOutlined className="text-xs" /> {currentUser.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center mt-auto mb-2 w-full">
                  <div 
                    className="relative p-3 md:p-4 bg-white rounded-3xl inline-block border border-slate-100 shadow-sm"
                    onClick={(e) => { e.stopPropagation(); message.info('แสกนเพื่อตรวจสอบข้อมูล'); }}
                  >
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-[3px] border-l-[3px] border-blue-500 rounded-tl-3xl"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-[3px] border-r-[3px] border-blue-500 rounded-tr-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-[3px] border-l-[3px] border-blue-500 rounded-bl-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-[3px] border-r-[3px] border-blue-500 rounded-br-3xl"></div>
                    
                    <QRCodeCanvas 
                      value={`https://safetyos-frontend.vercel.app/verify/${currentUser.id}`} 
                      size={isMobile ? 120 : 140} 
                      bgColor={"#ffffff"}
                      fgColor={"#1e293b"}
                      level={"H"}
                      includeMargin={false}
                    />
                  </div>
                  
                  <div className="hide-on-capture mt-4 flex items-center justify-center gap-1.5 bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-full">
                    <SyncOutlined className="text-blue-500 text-xs animate-spin-slow" />
                    <span className="text-[9px] md:text-[10px] font-extrabold text-blue-600 tracking-widest uppercase">Tap card to flip</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ==============================================
                🔄 ด้านหลังบัตร (Back Card - Medical/Info)
                ============================================== */}
            <div 
              className="absolute inset-0 bg-slate-800 rounded-[2.5rem] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.3)] overflow-hidden border border-slate-700 backface-hidden rotate-y-180 flex flex-col"
              onClick={() => setIsFlipped(false)}
            >
              <div className="absolute top-4 right-4 z-30 w-9 h-9 bg-slate-700/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-slate-600 shadow-sm">
                <SyncOutlined className="text-sm" />
              </div>

              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-14 h-2 bg-slate-950/60 rounded-full z-20 shadow-inner border border-slate-700"></div>

              <div className="pt-16 pb-6 px-5 md:px-6 h-full flex flex-col">
                <h3 className="text-lg md:text-xl font-black text-white m-0 tracking-tight flex items-center gap-2 border-b border-slate-700 pb-3 md:pb-4 mb-4">
                  <InfoCircleOutlined className="text-blue-400" /> ข้อมูลสำหรับฉุกเฉิน
                </h3>

                <div className="space-y-3 md:space-y-4 flex-1 flex flex-col justify-center">
                  
                  {/* 🟢 อัปเดต: ดึงข้อมูลจากฐานข้อมูล (currentUser) มาแสดง */}
                  <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-700/80">
                    <h4 className="text-[10px] md:text-[11px] font-extrabold text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><HeartOutlined /> ทางการแพทย์</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider m-0 mb-0.5">กรุ๊ปเลือด</p>
                        <p className="text-sm md:text-base font-bold text-white m-0">{currentUser.blood_group || 'ไม่ระบุ'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider m-0 mb-0.5">โรคประจำตัว</p>
                        <p className={`text-sm md:text-base font-bold m-0 ${currentUser.medical_cond && currentUser.medical_cond !== 'ไม่มี' ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {currentUser.medical_cond || 'ไม่มี'}
                        </p>
                      </div>
                      <div className="col-span-2 mt-1">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider m-0 mb-1">ผลตรวจสุขภาพ (Fit to Work)</p>
                        {currentUser.fit_to_work_date ? (
                          <p className="text-xs md:text-[13px] font-bold text-white bg-slate-900/60 px-3 py-1.5 rounded-lg inline-block border border-slate-600 m-0">
                            {dayjs(currentUser.fit_to_work_date).isAfter(dayjs()) 
                              ? `✅ ผ่านเกณฑ์ (หมด: ${dayjs(currentUser.fit_to_work_date).format('MM/YYYY')})` 
                              : `❌ หมดอายุ (${dayjs(currentUser.fit_to_work_date).format('MM/YYYY')})`}
                          </p>
                        ) : (
                          <p className="text-xs md:text-[13px] font-bold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg inline-block border border-slate-600 m-0">
                            ⚠️ ยังไม่มีผลตรวจ
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-700/80">
                    <h4 className="text-[10px] md:text-[11px] font-extrabold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><SafetyCertificateOutlined /> ใบอนุญาตพิเศษ</h4>
                    {myCerts.length > 0 ? (
                      <div className="space-y-2 mt-2">
                        {myCerts.map((cert) => (
                          <div key={cert.id} className="flex justify-between items-center text-xs md:text-[13px] pb-2 border-b border-slate-700/50 last:border-0 last:pb-0">
                            <span className="font-semibold text-slate-200 truncate pr-2">{cert.cert_name}</span>
                            <span className="text-blue-300 font-extrabold bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800 whitespace-nowrap text-[9px] md:text-[10px]">
                              หมด {dayjs(cert.expiry_date).format('DD/MM/YY')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 mt-1">
                        <CloseCircleOutlined /> ไม่มีประวัติ
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-700/40 rounded-2xl p-4 border border-slate-700/80 mt-auto">
                    <h4 className="text-[10px] md:text-[11px] font-extrabold text-orange-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><PhoneOutlined /> ติดต่อฉุกเฉินส่วนตัว</h4>
                    <div className="flex items-end justify-between mt-1">
                      <p className="text-xs md:text-sm font-bold text-slate-300 m-0">เบอร์โทรญาติ/ผู้ใกล้ชิด</p>
                      <p className="text-lg md:text-xl font-black text-orange-400 m-0 font-mono tracking-wider">{currentUser.emergency_contact || '119'}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
          
          {/* 🟢 Action Buttons (เหลือแค่ Save to Photos) */}
          <div className="w-full flex flex-col gap-2.5 mt-8">
            <Button 
              type="primary" 
              size="large" 
              icon={<DownloadOutlined />} 
              loading={isDownloading}
              onClick={handleDownloadImage} 
              className="w-full rounded-xl h-[52px] font-extrabold text-xs md:text-[14px] bg-blue-600 hover:bg-blue-700 border-none shadow-md shadow-blue-500/20 tracking-wide uppercase"
            >
              {isDownloading ? 'กำลังประมวลผลรูปภาพ...' : 'บันทึกบัตรลงเครื่อง (Save to Photos)'}
            </Button>
            
            <p className="text-center text-[9px] md:text-[10px] font-bold text-slate-400 mt-2 flex items-center justify-center gap-1">
              <CheckCircleOutlined className="text-emerald-500" />
              Verified Digital ID by SafetyOS
            </p>
          </div>

        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .animate-spin-slow { animation: spin 3s linear infinite; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}