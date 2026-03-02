import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Spin, Typography, Divider, Button, Avatar } from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, UserOutlined, 
  SafetyCertificateOutlined, EnvironmentOutlined, WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center">
        <Spin size="large" />
        <p className="mt-4 text-slate-500 font-bold tracking-widest">กำลังตรวจสอบฐานข้อมูล...</p>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6 text-center">
        <CloseCircleOutlined className="text-6xl text-red-500 mb-4 animate-bounce" />
        <Title level={3} className="text-red-600 m-0">ไม่พบข้อมูลพนักงาน</Title>
        <p className="text-slate-500 mt-2">QR Code อาจหมดอายุหรือไม่ถูกต้อง กรุณาติดต่อ จป. พื้นที่</p>
      </div>
    );
  }

  // จำลองเงื่อนไขการผ่านงาน: ถ้ามีใบเซอร์ที่ยังไม่หมดอายุ ถือว่าผ่าน (ปรับเปลี่ยนเงื่อนไขได้ตามจริง)
  const isPassed = certs.length > 0;

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header สถานะ ผ่าน / ไม่ผ่าน */}
        <div className={`p-6 text-center text-white ${isPassed ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {isPassed ? (
            <CheckCircleOutlined className="text-6xl mb-2 drop-shadow-md" />
          ) : (
            <WarningOutlined className="text-6xl mb-2 drop-shadow-md" />
          )}
          <h1 className="text-3xl font-black m-0 tracking-wider">
            {isPassed ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
          </h1>
          <p className="opacity-90 font-bold mt-1 text-sm">
            {isPassed ? 'อนุญาตให้เข้าปฏิบัติงานได้' : 'ไม่อนุญาตให้เข้าพื้นที่ (ขาดคุณสมบัติ)'}
          </p>
        </div>

        {/* ข้อมูลพนักงาน */}
        <div className="p-6 text-center -mt-6">
          <Avatar 
            size={100} 
            icon={<UserOutlined />} 
            className="border-4 border-white shadow-lg bg-slate-200 text-slate-400 mb-4"
          />
          <h2 className="text-2xl font-extrabold text-slate-800 m-0">{user.full_name}</h2>
          <p className="text-slate-500 font-semibold mb-1">{user.department}</p>
          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase border border-slate-200">
            {user.role.replace('_', ' ')}
          </span>

          <Divider className="my-6 border-slate-100" />

          {/* สรุปใบ Certificate */}
          <div className="text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <SafetyCertificateOutlined className="text-blue-500" /> ประวัติการอบรม (Certificates)
            </h3>
            
            {certs.length > 0 ? (
              <div className="space-y-2">
                {certs.map(cert => {
                  const isExpired = dayjs().isAfter(dayjs(cert.expiry_date));
                  return (
                    <div key={cert.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                      <span className="font-semibold text-sm text-slate-700 truncate mr-2">{cert.cert_name}</span>
                      {isExpired ? (
                        <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded">หมดอายุแล้ว</span>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                          หมด: {dayjs(cert.expiry_date).format('DD/MM/YY')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-3 text-sm font-bold text-red-500 bg-red-50 rounded-xl border border-red-100">
                <CloseCircleOutlined className="mr-1" /> ไม่มีประวัติการอบรม / ใบเซอร์
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-xs font-bold text-slate-400 flex flex-col gap-1 items-center justify-center">
          <EnvironmentOutlined />
          <span>SafetyOS Enterprise Management</span>
          <span>สแกนเมื่อ: {dayjs().format('DD/MM/YYYY HH:mm')}</span>
        </div>
      </div>
    </div>
  );
}