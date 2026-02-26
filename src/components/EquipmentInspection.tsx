import React, { useState } from 'react';
import { Card, Button, Typography, Space, Input, message, Tag, Switch, Divider, Result, Tabs, Timeline, Empty, Grid } from 'antd'; 
import { 
  QrcodeOutlined, SearchOutlined, ToolOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SaveOutlined, HistoryOutlined, UserOutlined,
  SafetyCertificateOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');
const { Title, Text } = Typography;
const { useBreakpoint } = Grid; 

// 📝 มาตรฐาน Checklist อิงตาม NFPA 10 และกฎหมายไทย
const CHECKLISTS: Record<string, string[]> = {
  'FIRE_EXTINGUISHER': [
    '1. เกจ์วัดความดัน: เข็มชี้อยู่ในแถบสีเขียว (Pressure in green zone)',
    '2. สลักและซีลล็อค: ไม่ฉีกขาด ไม่หลุดหาย (Pin and seal intact)',
    '3. สายฉีดและหัวฉีด: ไม่แตกร้าว ไม่อุดตัน (Hose/Nozzle clear)',
    '4. สภาพตัวถัง: ไม่มีรอยสนิม รอยบวม หรือบุบบี้ (No rust/dents)',
    '5. ป้ายแนะนำการใช้งาน: อ่านได้ชัดเจน ไม่ฉีกขาด (Labels legible)'
  ],
  'SCAFFOLDING': [
    '1. แผ่นฐานรองรับ (Base plate) มั่นคงและได้ระดับ',
    '2. โครงสร้างไม่บิดเบี้ยว งอ หรือมีรอยร้าว',
    '3. มีราวกันตก (Guardrail) และแผ่นกันของตก (Toeboard) ครบถ้วน',
    '4. แผ่นพื้นทางเดินยึดติดแน่นหนา ไม่มีรอยผุพัง'
  ],
  'HEAVY_MACHINERY': [
    '1. ระบบเบรกและสัญญาณเตือนทำงานปกติ',
    '2. ไม่มีรอยรั่วซึมของน้ำมันเครื่อง/น้ำมันไฮดรอลิก',
    '3. เข็มขัดนิรภัยและระบบความปลอดภัยพร้อมใช้งาน'
  ]
};

export default function EquipmentInspection({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [qrCode, setQrCode] = useState('');
  const [equipment, setEquipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<Record<number, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSearchQR = async () => {
    if (!qrCode) return message.warning('กรุณาระบุรหัส QR Code');
    setIsLoading(true);
    try {
      const res = await fetch(`https://safetyos-backend.onrender.com/equipment/${qrCode}`);
      if (!res.ok) throw new Error('ไม่พบอุปกรณ์');
      const data = await res.json();
      setEquipment(data);
      
      const initialResult: Record<number, boolean> = {};
      const typeList = CHECKLISTS[data.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน'];
      typeList.forEach((_, index) => { initialResult[index] = true; });
      setInspectionResult(initialResult);
      setIsSuccess(false);
    } catch (error) {
      message.error('ไม่พบอุปกรณ์ในระบบ หรือ QR Code ไม่ถูกต้อง');
      setEquipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const isDefective = Object.values(inspectionResult).includes(false);
    const finalStatus = isDefective ? 'DEFECTIVE' : 'NORMAL';

    try {
      await fetch(`https://safetyos-backend.onrender.com/equipment/${equipment.id}/inspect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: finalStatus,
          inspector_id: currentUser?.id,
          inspector_name: currentUser?.full_name || 'เจ้าหน้าที่ (ไม่ระบุตัวตน)', 
          details: JSON.stringify(inspectionResult)
        })
      });
      message.success('บันทึกผลการตรวจสอบเรียบร้อยแล้ว');
      setIsSuccess(true);
    } catch (error) {
      message.error('ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch(type) {
      case 'FIRE_EXTINGUISHER': return '🧯';
      case 'SCAFFOLDING': return '🏗️';
      case 'HEAVY_MACHINERY': return '🚜';
      default: return '⚙️';
    }
  };

  // ✅ Success State (สวยงาม สบายตา)
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 md:p-10 bg-white rounded-[32px] shadow-xl border border-emerald-100 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 text-5xl shadow-inner">
          <CheckCircleOutlined />
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 mb-2">บันทึกเรียบร้อย!</h2>
        <p className="text-slate-500 text-sm md:text-base mb-8">
          อัปเดตสถานะของ <strong className="text-emerald-600">{equipment?.name}</strong> ลงระบบกลางสำเร็จ
        </p>
        <button 
          onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); }} 
          className="btn btn-primary btn-lg w-full rounded-2xl h-14 text-lg font-bold shadow-lg shadow-blue-500/30"
        >
          <QrcodeOutlined /> สแกนอุปกรณ์ชิ้นต่อไป
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 px-2 md:px-0">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-blue-500 to-indigo-500 p-4 rounded-2xl shadow-md text-white">
          <SafetyCertificateOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 m-0 tracking-tight">ระบบตรวจสอบอุปกรณ์</h2>
          <p className="text-slate-500 text-xs md:text-sm m-0 mt-1">Equipment Inspection & QR Scanner</p>
        </div>
      </div>

      {/* 🔍 Search Box (Modern Input) */}
      <div className="bg-white p-6 md:p-8 rounded-[24px] shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <QrcodeOutlined className="text-blue-500 text-lg" /> สแกนหรือพิมพ์รหัสอุปกรณ์
        </label>
        <div className="flex flex-col md:flex-row gap-3">
          <Input 
            size="large" 
            placeholder="เช่น EXT-001" 
            value={qrCode} 
            onChange={(e) => setQrCode(e.target.value)} 
            onPressEnter={handleSearchQR} 
            prefix={<SearchOutlined className="text-slate-400 mr-2" />} 
            className="rounded-2xl h-14 text-lg bg-slate-50 border-slate-200 focus:bg-white"
          />
          <Button 
            type="primary" 
            size="large" 
            onClick={handleSearchQR} 
            loading={isLoading} 
            className="h-14 rounded-2xl md:w-32 font-bold bg-blue-600 border-none shadow-md shadow-blue-500/20"
          >
            ค้นหา
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-4 flex items-center gap-1">
          <InfoCircleOutlined /> รองรับการใช้งานร่วมกับปืนยิงบาร์โค้ด (Barcode Scanner)
        </p>
      </div>

      {/* 📋 Equipment Details & Checklist */}
      {equipment && (
        <div className="bg-white rounded-[24px] shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
          
          {/* Header Info */}
          <div className="bg-slate-50 border-b border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-4xl flex-shrink-0">
              {getEquipmentIcon(equipment.type)}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">{equipment.name}</h3>
              <p className="text-slate-500 font-mono text-sm mb-3">ID: {equipment.qr_code}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="badge badge-ghost font-semibold text-slate-600 border-slate-300">{equipment.type}</span>
                <span className={`badge font-bold border-none text-white ${equipment.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  สถานะ: {equipment.status === 'NORMAL' ? 'ปกติ' : 'ชำรุด'}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs Content */}
          <Tabs 
            defaultActiveKey="1" 
            centered={isMobile}
            className="px-4 py-2"
            items={[
              {
                key: '1',
                label: <span className="font-bold text-base px-2"><CheckCircleOutlined /> ฟอร์มตรวจสอบ</span>,
                children: (
                  <div className="py-4 md:py-6 px-2 md:px-4">
                    <div className="flex items-center gap-2 mb-6">
                      <ToolOutlined className="text-blue-500 text-xl" />
                      <h4 className="text-lg font-bold text-slate-800 m-0">รายการที่ต้องตรวจเช็ค</h4>
                    </div>
                    
                    <div className="space-y-4">
                      {(CHECKLISTS[equipment.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน']).map((item, index) => {
                        const isPass = inspectionResult[index];
                        return (
                          <div 
                            key={index} 
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                              ${isPass ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/50 border-red-200'}`}
                          >
                            <div className="flex items-start gap-3 flex-1 pr-0 md:pr-4">
                              {isPass 
                                ? <CheckCircleOutlined className="text-emerald-500 text-xl mt-1 flex-shrink-0" /> 
                                : <CloseCircleOutlined className="text-red-500 text-xl mt-1 flex-shrink-0" />
                              }
                              <span className={`font-semibold text-sm md:text-base leading-relaxed ${isPass ? 'text-slate-700' : 'text-red-800'}`}>
                                {item}
                              </span>
                            </div>
                            
                            <div className="w-full md:w-auto flex justify-between items-center bg-white md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-100">
                              <span className={`font-bold text-sm md:hidden ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                                {isPass ? 'สภาพปกติ' : 'พบข้อบกพร่อง'}
                              </span>
                              <Switch 
                                checked={isPass} 
                                onChange={(checked) => setInspectionResult({...inspectionResult, [index]: checked})} 
                                className={`${isPass ? 'bg-emerald-500' : 'bg-red-500'}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Submit Area */}
                    <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                      <p className="text-slate-500 text-sm mb-4">
                        ตรวจสอบโดย: <strong className="text-blue-600"><UserOutlined className="mr-1"/>{currentUser?.full_name || 'ไม่ระบุชื่อ'}</strong>
                      </p>
                      <button 
                        onClick={handleSubmit} 
                        disabled={isLoading}
                        className="btn btn-primary btn-lg w-full md:w-auto md:px-16 rounded-2xl h-14 text-base font-bold shadow-lg shadow-blue-500/30 border-none bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? <Spin /> : <><SaveOutlined /> บันทึกผลการตรวจสอบ</>}
                      </button>
                    </div>
                  </div>
                )
              },
              {
                key: '2',
                label: <span className="font-bold text-base px-2"><HistoryOutlined /> ประวัติย้อนหลัง</span>,
                children: (
                  <div className="py-6 px-4 md:px-8">
                    {equipment.history && equipment.history.length > 0 ? (
                      <Timeline 
                        mode={isMobile ? "left" : "alternate"}
                        items={equipment.history.map((log: any) => ({
                          color: log.status === 'NORMAL' ? 'green' : 'red',
                          dot: log.status === 'NORMAL' ? <CheckCircleOutlined className="text-emerald-500 text-lg" /> : <WarningOutlined className="text-red-500 text-lg" />,
                          children: (
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm mb-4 hover:shadow-md transition-shadow">
                              <p className="font-bold text-slate-800 text-sm mb-2">{dayjs(log.created_at).format('DD MMM YYYY, HH:mm')}</p>
                              <div className="flex items-center justify-between">
                                <span className={`badge font-bold border-none text-white text-[10px] ${log.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                                  {log.status}
                                </span>
                                <span className="text-xs text-slate-500 font-medium"><UserOutlined className="mr-1"/>{log.inspector_name}</span>
                              </div>
                            </div>
                          )
                        }))}
                      />
                    ) : (
                      <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description={<span className="text-slate-400 font-medium">ยังไม่มีประวัติการตรวจสอบ</span>} 
                        className="my-10"
                      />
                    )}
                  </div>
                )
              }
            ]} 
          />
        </div>
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}