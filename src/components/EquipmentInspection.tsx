import React, { useState } from 'react';
import { message, Modal } from 'antd'; // 🟢 ดึง Modal มาใช้สำหรับกล้องสำรองบนคอม
import liff from '@line/liff'; // 🟢 ดึง LIFF มาใช้เปิดกล้อง LINE
import QRScanner from './QRScanner'; // 🟢 ดึงคอมโพเนนต์กล้องสแกนมา
import { 
  QrcodeOutlined, SearchOutlined, ToolOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SaveOutlined, HistoryOutlined, UserOutlined,
  SafetyCertificateOutlined, InfoCircleOutlined, ScanOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

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

// 🎨 Custom Tailwind Components
const CustomSwitch = ({ checked, onChange }: { checked: boolean, onChange: (val: boolean) => void }) => (
  <button 
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${checked ? 'bg-emerald-500' : 'bg-red-500'}`}
  >
    <span className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const LoadingSpinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function EquipmentInspection({ currentUser }: { currentUser: any }) {
  const [qrCode, setQrCode] = useState('');
  const [equipment, setEquipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<Record<number, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'FORM' | 'HISTORY'>('FORM');
  const [isScannerOpen, setIsScannerOpen] = useState(false); // 🟢 State ควบคุมการเปิด/ปิดกล้อง

  // 🟢 ฟังก์ชันค้นหาข้อมูล (ปรับให้รับค่าจากกล้องได้โดยตรง)
  const executeSearch = async (codeToSearch: string) => {
    if (!codeToSearch) return message.warning('กรุณาระบุรหัส QR Code');
    setIsLoading(true);
    try {
      const res = await fetch(`https://safetyos-backend.onrender.com/equipment/${codeToSearch}`);
      if (!res.ok) throw new Error('ไม่พบอุปกรณ์');
      const data = await res.json();
      setEquipment(data);
      
      const initialResult: Record<number, boolean> = {};
      const typeList = CHECKLISTS[data.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน'];
      typeList.forEach((_, index) => { initialResult[index] = true; });
      setInspectionResult(initialResult);
      setIsSuccess(false);
      setActiveTab('FORM');
      setQrCode(codeToSearch); // อัปเดตช่องพิมพ์ให้ตรงกับที่สแกนมา
    } catch (error) {
      message.error('ไม่พบอุปกรณ์ในระบบ หรือ QR Code ไม่ถูกต้อง');
      setEquipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchQR = () => executeSearch(qrCode);

  // 🚀 🟢 ฟังก์ชันเปิดกล้องสแกน (สูตรโกงดึงกล้อง LINE)
  const handleStartScan = async () => {
    if (liff.isInClient() && liff.scanCodeV2) {
      try {
        const result = await liff.scanCodeV2();
        if (result && result.value) {
          executeSearch(result.value); // สแกนเสร็จ โยนรหัสไปค้นหาอัตโนมัติทันที!
        }
      } catch (error) {
        console.error("LINE Scanner error:", error);
        setIsScannerOpen(true); // ถ้าผิดพลาดให้เปิดกล้องสำรอง
      }
    } else {
      setIsScannerOpen(true); // เปิดบนคอม ให้ใช้กล้องหน้าเว็บสำรอง
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

  // ✅ Success State
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 md:p-12 bg-white rounded-[2rem] shadow-xl border border-emerald-100 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
           <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
           <CheckCircleOutlined className="text-6xl drop-shadow-md" />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">บันทึกเรียบร้อย!</h2>
        <p className="text-slate-500 text-base md:text-lg mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
          อัปเดตสถานะของ <strong className="text-emerald-600 block mt-1 text-xl">{equipment?.name}</strong> ลงฐานข้อมูลส่วนกลางสำเร็จ
        </p>
        <button 
          onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); handleStartScan(); }} // 🟢 กดสแกนชิ้นต่อไปได้เลย
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <ScanOutlined className="text-xl" /> สแกนอุปกรณ์ชิ้นต่อไป
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-fade-in">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg shadow-blue-500/30 text-white">
          <SafetyCertificateOutlined className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">ระบบตรวจสอบอุปกรณ์</h2>
          <p className="text-slate-500 text-sm md:text-base m-0 mt-1 font-medium">Smart Equipment Inspection</p>
        </div>
      </div>

      {/* 🔍 Search Box */}
      <div className="bg-white p-6 md:p-8 rounded-[1.5rem] shadow-sm border border-slate-200 mb-8 transition-all hover:shadow-md">
        <label className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <QrcodeOutlined className="text-blue-500 text-xl" /> สแกนหรือพิมพ์รหัสอุปกรณ์
        </label>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchOutlined className="text-slate-400 text-lg" />
            </div>
            <input 
              type="text"
              placeholder="พิมพ์รหัส เช่น EXT-001" 
              value={qrCode} 
              onChange={(e) => setQrCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchQR()}
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
          
          <button 
            onClick={handleSearchQR} 
            disabled={isLoading}
            className="flex items-center justify-center min-w-[120px] px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-900 transition-colors shadow-md disabled:opacity-70"
          >
            {isLoading ? <LoadingSpinner /> : 'ค้นหา'}
          </button>

          {/* 🌟 🟢 ปุ่มเปิดกล้องสแกน (ผูกฟังก์ชันแล้ว) */}
          <button 
            onClick={handleStartScan} 
            className="flex items-center justify-center gap-2 px-6 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/30 active:scale-95"
          >
            <ScanOutlined className="text-xl" /> สแกน QR
          </button>
        </div>
      </div>

      {/* 📋 Equipment Details & Checklist */}
      {equipment && (
        <div className="bg-white rounded-[1.5rem] shadow-lg border border-slate-200 overflow-hidden animate-fade-in">
          
          {/* Header Info */}
          <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            {/* Pattern Background */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
            
            <div className="w-20 h-20 bg-slate-800 rounded-[1.25rem] border border-slate-700 flex items-center justify-center text-4xl flex-shrink-0 shadow-inner z-10">
              {getEquipmentIcon(equipment.type)}
            </div>
            
            <div className="flex-1 text-center md:text-left z-10">
              <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-1">{equipment.name}</h3>
              <p className="text-slate-400 font-mono text-sm mb-4 bg-slate-800/50 inline-block px-3 py-1 rounded-lg">ID: {equipment.qr_code}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs font-bold rounded-full uppercase tracking-wider">{equipment.type}</span>
                <span className={`px-3 py-1 text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm
                  ${equipment.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                  {equipment.status === 'NORMAL' ? <CheckCircleOutlined/> : <ExclamationCircleOutlined/>}
                  {equipment.status === 'NORMAL' ? 'สถานะ: ปกติ' : 'สถานะ: ชำรุด'}
                </span>
              </div>
            </div>
          </div>

          {/* Custom Tabs */}
          <div className="p-4 md:p-6">
            <div className="flex p-1 bg-slate-100 rounded-2xl mb-6">
              <button 
                onClick={() => setActiveTab('FORM')} 
                className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2
                ${activeTab === 'FORM' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CheckCircleOutlined /> ฟอร์มตรวจสอบ
              </button>
              <button 
                onClick={() => setActiveTab('HISTORY')} 
                className={`flex-1 py-3 px-4 rounded-xl text-sm md:text-base font-bold transition-all flex items-center justify-center gap-2
                ${activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <HistoryOutlined /> ประวัติย้อนหลัง
              </button>
            </div>

            {/* TAB CONTENT: FORM */}
            {activeTab === 'FORM' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <ToolOutlined className="text-blue-500 text-xl" />
                  <h4 className="text-lg font-bold text-slate-800 m-0">รายการที่ต้องตรวจเช็ค</h4>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  {(CHECKLISTS[equipment.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน']).map((item, index) => {
                    const isPass = inspectionResult[index];
                    return (
                      <div 
                        key={index} 
                        onClick={() => setInspectionResult({...inspectionResult, [index]: !isPass})}
                        className={`cursor-pointer p-4 md:p-5 rounded-[1.25rem] border-2 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                          ${isPass ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300' : 'bg-red-50/80 border-red-300 shadow-sm'}`}
                      >
                        <div className="flex items-start gap-3 flex-1 pr-0 md:pr-4">
                          {isPass 
                            ? <CheckCircleOutlined className="text-emerald-500 text-2xl mt-0.5 flex-shrink-0" /> 
                            : <CloseCircleOutlined className="text-red-500 text-2xl mt-0.5 flex-shrink-0" />
                          }
                          <span className={`font-semibold text-sm md:text-base leading-relaxed ${isPass ? 'text-slate-700' : 'text-red-900'}`}>
                            {item}
                          </span>
                        </div>
                        
                        <div className="w-full md:w-auto flex justify-between items-center bg-white md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-100 shadow-sm md:shadow-none" onClick={(e) => e.stopPropagation()}>
                          <span className={`font-bold text-sm md:hidden ${isPass ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isPass ? 'สภาพปกติ' : 'พบข้อบกพร่อง'}
                          </span>
                          <CustomSwitch 
                            checked={isPass} 
                            onChange={(val) => setInspectionResult({...inspectionResult, [index]: val})} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Submit Area */}
                <div className="mt-8 bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center">
                  <p className="text-slate-500 text-sm mb-4 font-medium">
                    ผู้ตรวจสอบ: <strong className="text-blue-600 bg-blue-50 px-3 py-1 rounded-full"><UserOutlined className="mr-1"/>{currentUser?.full_name || 'ไม่ระบุชื่อ'}</strong>
                  </p>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full md:w-auto md:px-16 mx-auto rounded-2xl h-14 text-lg font-bold shadow-lg shadow-blue-500/30 border-none bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 transition-all"
                  >
                    {isLoading ? <LoadingSpinner /> : <><SaveOutlined /> บันทึกผลลงระบบ</>}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="py-4 px-2 md:px-6 animate-fade-in">
                {equipment.history && equipment.history.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8">
                    {equipment.history.map((log: any, idx: number) => (
                      <div key={idx} className="relative pl-6 md:pl-8">
                        {/* Dot indicator */}
                        <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm
                          ${log.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                        
                        {/* Card Content */}
                        <div className="bg-white p-5 rounded-[1rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                          <p className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
                            <HistoryOutlined className="text-slate-400" />
                            {dayjs(log.created_at).format('DD MMMM YYYY, HH:mm')}
                          </p>
                          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                            <span className={`px-3 py-1 font-bold text-xs rounded-full 
                              ${log.status === 'NORMAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {log.status === 'NORMAL' ? 'ผ่านเกณฑ์' : 'ชำรุด/ไม่ผ่าน'}
                            </span>
                            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                              <UserOutlined className="mr-1"/> {log.inspector_name}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <HistoryOutlined className="text-5xl mb-4 text-slate-300" />
                    <span className="font-bold text-slate-500">ยังไม่มีประวัติการตรวจสอบ</span>
                    <span className="text-sm mt-1">อุปกรณ์นี้ยังไม่เคยถูกบันทึกผลการตรวจสอบลงระบบ</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🌟 🟢 หน้าต่าง Modal กล้องสำรอง (สำหรับใช้งานบนคอมพิวเตอร์) */}
      <Modal 
        title={<div className="flex items-center gap-2 text-emerald-600"><ScanOutlined className="text-xl"/> <span className="font-bold">สแกนรหัสอุปกรณ์</span></div>} 
        open={isScannerOpen} 
        onCancel={() => setIsScannerOpen(false)} 
        footer={null}
        centered
        destroyOnClose 
        styles={{ body: { padding: '24px 12px', background: '#f8fafc' } }}
      >
        <QRScanner 
          onScan={(text) => {
            setIsScannerOpen(false); 
            executeSearch(text); // 🟢 สแกนบนคอมเสร็จ ก็ให้ค้นหาอัตโนมัติเช่นกัน
          }} 
        />
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}