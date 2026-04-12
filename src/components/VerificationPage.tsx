import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spin } from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, UserOutlined, 
  SafetyCertificateOutlined, EnvironmentOutlined, WarningOutlined, ScanOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

export default function VerificationPage({ userId }: { userId: string }) {
  const [user, setUser] = useState<any>(null);
  const [certs, setCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ดึงข้อมูลพนักงานทั้งหมด แล้วหาคนที่มี ID ตรงกับที่สแกนมา
        const usersRes = await axios.get('https://safetyos-backend.onrender.com/users');
        const foundUser = usersRes.data.find((u: any) => u.id === userId);
        
        if (!foundUser) {
          setIsError(true);
          setIsLoading(false);
          return;
        }
        setUser(foundUser);

        // 2. ดึงข้อมูลใบ Certificate ของคนๆ นี้
        const certsRes = await axios.get('https://safetyos-backend.onrender.com/certificates');
        const userCerts = certsRes.data.filter((c: any) => c.user_id === userId && c.status === 'APPROVED');
        setCerts(userCerts);

      } catch (error) {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // 🚀 1. หน้าจอตอนกำลังโหลดข้อมูล (Loading State)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-xl flex flex-col items-center gap-5 border border-slate-100">
          <Spin size="large" />
          <p className="m-0 text-slate-500 font-bold tracking-widest animate-pulse text-sm">
            กำลังเชื่อมต่อฐานข้อมูล SafetyOS...
          </p>
        </div>
      </div>
    );
  }

  // 🚫 2. หน้าจอตอนสแกนไม่เจอคน (Error State)
  if (isError || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-[2rem] shadow-2xl shadow-rose-500/10 text-center border-t-4 border-t-rose-500 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500"></div>
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CloseCircleOutlined className="text-4xl" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 m-0">ไม่พบข้อมูลพนักงาน</h2>
          <p className="text-slate-500 mt-2 font-medium text-sm leading-relaxed">
            QR Code นี้อาจหมดอายุ หรือไม่ได้ลงทะเบียนในระบบ<br/>กรุณาติดต่อ จป. ประจำพื้นที่
          </p>
        </div>
      </div>
    );
  }

  // จำลองเงื่อนไขการผ่านงาน: ถ้ามีใบเซอร์ที่ยังไม่หมดอายุ ถือว่าผ่าน (ปรับเปลี่ยนเงื่อนไขได้ตามจริง)
  const isPassed = certs.length > 0;

  // ✅ 3. หน้าจอแสดงผลบัตร E-Passport (Success State)
  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl shadow-slate-300/60 overflow-hidden border border-slate-100 transform transition-all hover:scale-[1.01] duration-300">
        
        {/* 🎨 Header สถานะ ผ่าน / ไม่ผ่าน (ใช้ Gradient สวยๆ) */}
        <div className={`relative px-6 pt-8 pb-14 text-center text-white overflow-hidden ${
          isPassed 
            ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600' 
            : 'bg-gradient-to-br from-rose-500 via-red-500 to-rose-600'
        }`}>
          {/* ลวดลาย Background อ่อนๆ ให้ดูมีมิติ */}
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8L3N2Zz4=')]"></div>
          
          <div className="relative z-10">
            {isPassed ? (
              <CheckCircleOutlined className="text-5xl md:text-6xl mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            ) : (
              <WarningOutlined className="text-5xl md:text-6xl mb-2 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
            )}
            <h1 className="text-2xl md:text-3xl font-black m-0 tracking-widest drop-shadow-md">
              {isPassed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
            </h1>
            <div className={`mt-2.5 inline-block px-4 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-wider backdrop-blur-md border ${
              isPassed ? 'bg-emerald-900/20 border-emerald-300/30' : 'bg-red-900/20 border-red-300/30'
            }`}>
              {isPassed ? 'อนุญาตให้เข้าปฏิบัติงานได้' : 'ไม่อนุญาตให้เข้าพื้นที่ (ขาดคุณสมบัติ)'}
            </div>
          </div>
        </div>

        {/* 👤 ข้อมูลพนักงาน (รูปโปรไฟล์เด้งทะลุ Header ขึ้นมา) */}
        <div className="px-6 pb-6 text-center relative bg-white">
          {/* รูป Avatar วางทับรอยต่อสี */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
            {user.profile_url ? (
              <Avatar src={user.profile_url} size={96} className="border-[6px] border-white shadow-lg bg-slate-100 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full border-[6px] border-white shadow-lg bg-slate-100 flex items-center justify-center text-slate-400 text-4xl">
                <UserOutlined />
              </div>
            )}
          </div>

          <div className="pt-16">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 m-0 leading-tight">
              {user.full_name}
            </h2>
            <p className="text-slate-500 font-medium mb-3 mt-1 text-sm">{user.department || '-'}</p>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 shadow-sm">
              <ScanOutlined /> {user.role?.replace('_', ' ') || 'ผู้ใช้ทั่วไป'}
            </span>
          </div>
        </div>

        {/* เส้นประบางๆ แบ่งสัดส่วน */}
        <div className="px-6">
          <div className="border-t border-dashed border-slate-200 w-full mb-5"></div>
        </div>

        {/* 📜 สรุปใบ Certificate */}
        <div className="px-6 pb-2 text-left">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <SafetyCertificateOutlined className="text-blue-500 text-lg" /> ประวัติการอบรม (Certificates)
          </h3>
          
          {certs.length > 0 ? (
            <div className="space-y-3">
              {certs.map(cert => {
                const isExpired = dayjs().isAfter(dayjs(cert.expiry_date));
                return (
                  <div key={cert.id} className="flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors p-3 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col overflow-hidden pr-2">
                      <span className="font-bold text-sm text-slate-700 truncate">{cert.cert_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium mt-0.5">อนุมัติ: {dayjs(cert.issued_date).format('DD/MM/YYYY')}</span>
                    </div>
                    <div className="flex-shrink-0">
                      {isExpired ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20 whitespace-nowrap">
                          หมดอายุ
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 whitespace-nowrap">
                          หมด: {dayjs(cert.expiry_date).format('DD/MM/YY')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-4 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col items-center gap-2 shadow-sm">
              <CloseCircleOutlined className="text-2xl text-rose-400" />
              <span className="text-sm font-bold text-rose-600">ไม่มีประวัติการอบรมในระบบ</span>
            </div>
          )}
        </div>

        {/* 🏢 Footer Timestamp */}
        <div className="bg-slate-50 mt-6 p-4 border-t border-slate-100 text-center flex flex-col gap-1 items-center justify-center">
          <span className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
            <EnvironmentOutlined className="text-blue-500"/> SafetyOS Enterprise
          </span>
          <span className="text-[10px] font-medium text-slate-400 font-mono">
            Scan Timestamp: {dayjs().format('DD/MM/YYYY HH:mm:ss')}
          </span>
        </div>

      </div>
    </div>
  );
}