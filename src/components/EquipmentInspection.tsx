import React, { useState } from 'react';
import { message, Modal, Upload } from 'antd'; 
import liff from '@line/liff'; 
import QRScanner from './QRScanner'; 
import { 
  QrcodeOutlined, SearchOutlined, ToolOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SaveOutlined, HistoryOutlined, UserOutlined,
  SafetyCertificateOutlined, ScanOutlined, ExclamationCircleOutlined,
  FormOutlined, CameraOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

dayjs.locale('th');

// 📝 มาตรฐาน Checklist 
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

const getBase64 = (file: any): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function EquipmentInspection({ currentUser }: { currentUser: any }) {
  const [qrCode, setQrCode] = useState('');
  const [equipment, setEquipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [inspectionResult, setInspectionResult] = useState<Record<number, boolean>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'FORM' | 'HISTORY'>('FORM');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  // 🟢 ฟังก์ชันค้นหาข้อมูล
  const executeSearch = async (codeToSearch: string) => {
    if (!codeToSearch) return message.warning('กรุณาระบุรหัส QR Code');
    
    const formattedCode = codeToSearch.toUpperCase().trim();

    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/equipment/${formattedCode}`);
      if (!res.ok) throw new Error('ไม่พบอุปกรณ์');
      const data = await res.json();
      setEquipment(data);
      
      const initialResult: Record<number, boolean> = {};
      const typeList = CHECKLISTS[data.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน'];
      typeList.forEach((_, index) => { initialResult[index] = true; });
      setInspectionResult(initialResult);
      setIsSuccess(false);
      setActiveTab('FORM');
      
      setQrCode(formattedCode); 
      setFileList([]); 
    } catch (error) {
      message.error('ไม่พบอุปกรณ์ในระบบ หรือ QR Code ไม่ถูกต้อง');
      setEquipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchQR = () => executeSearch(qrCode);

  // 🚀 🟢 ฟังก์ชันเปิดกล้องสแกน (ฉลาดขึ้น: แยกระหว่าง LINE กับ Browser)
  const handleStartScan = async () => {
    // เช็คว่า liff ถูกโหลดและพร้อมใช้งานหรือยัง (กัน Error)
    if (!liff) {
      console.warn("LIFF SDK not ready, falling back to Web Scanner");
      setIsScannerOpen(true);
      return;
    }

    // 1. ตรวจสอบว่าเปิดผ่าน LINE LIFF หรือไม่
    if (liff.isInClient()) {
      // 2. ตรวจสอบว่าแอป LINE รองรับฟีเจอร์ Scan QR V2 หรือไม่
      if (liff.scanCodeV2) {
        try {
          // 🟢 เปิดตัวสแกนของแอป LINE (Native Scanner)
          const result = await liff.scanCodeV2();
          
          if (result && result.value) {
            // เมื่อสแกนได้ค่า ให้ส่งค่าไปค้นหาทันที
            executeSearch(result.value); 
          }
        } catch (error) {
          // กรณีสแกนของ LINE พัง หรือผู้ใช้กดยกเลิก
          console.error("LINE Native Scanner error:", error);
          
          // ทางเลือก: จะเปิดกล้องเว็บสำรองให้ หรือแค่แจ้งเตือนก็ได้
          // ในที่นี้ ถ้าผู้ใช้กดยกเลิก เราก็ไม่ควรบังคับเปิดกล้องเว็บต่อ
          // แต่ถ้าพังจริงๆ ค่อยเปิดกล้องเว็บสำรอง
          // setIsScannerOpen(true); 
        }
      } else {
        // กรณีเปิดใน LINE แต่เป็น LINE เวอร์ชั่นเก่ามากที่ไม่มี scanCodeV2
        message.warning("แอป LINE ของคุณเวอร์ชั่นเก่าเกินไป กำลังเปิดกล้องสำรอง...");
        setIsScannerOpen(true);
      }
    } else {
      // 🟢 กรณีไม่ได้เปิดผ่านแอป LINE (เช่น เปิดด้วย Chrome, Safari หรือบนคอมพิวเตอร์)
      // ให้เปิด Modal กล้องเว็บ (html5-qrcode) ที่เราสร้างไว้
      setIsScannerOpen(true); 
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as any);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => setFileList(newFileList);

  const handleSubmit = async () => {
    // 🚨 บังคับแนบรูปทุกครั้ง (ไม่ว่าจะผ่านหรือชำรุด ก็ต้องมีหลักฐานการตรวจ)
    if (fileList.length === 0) {
      return message.warning('⚠️ กรุณาแนบภาพถ่ายหน้างานอย่างน้อย 1 ภาพ เพื่อเป็นหลักฐานการตรวจสอบ!');
    }

    setIsLoading(true);
    const isDefective = Object.values(inspectionResult).includes(false);
    const finalStatus = isDefective ? 'DEFECTIVE' : 'NORMAL';

    const photosBase64 = await Promise.all(
      fileList.map(async (file) => file.url || await getBase64(file.originFileObj as any))
    );

    try {
      await fetch(`${API_URL}/equipment/${equipment.id}/inspect`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: finalStatus,
          inspector_id: currentUser?.id,
          inspector_name: currentUser?.full_name || 'เจ้าหน้าที่ (ไม่ระบุตัวตน)', 
          details: JSON.stringify(inspectionResult),
          photos: JSON.stringify(photosBase64) 
        })
      });
      message.success('บันทึกผลการตรวจสอบพร้อมรูปถ่ายเรียบร้อยแล้ว');
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

  const uploadButton = (
    <div className="flex flex-col items-center text-slate-500 hover:text-blue-500 transition-colors">
      <CameraOutlined className="text-2xl mb-1" />
      <div style={{ marginTop: 8 }} className="font-bold text-xs uppercase tracking-wider">เพิ่มรูปถ่าย</div>
    </div>
  );

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
          onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); handleStartScan(); }} 
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl h-14 text-lg font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <ScanOutlined className="text-xl" /> สแกนอุปกรณ์ชิ้นต่อไป
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-fade-in relative">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
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
      <div className="bg-white p-6 md:p-8 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 mb-8 transition-all hover:shadow-lg">
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
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchQR()}
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-lg font-bold focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all shadow-inner uppercase"
            />
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={handleSearchQR} 
              disabled={isLoading}
              className="flex-1 md:flex-none flex items-center justify-center min-w-[120px] px-6 py-4 bg-slate-800 text-white rounded-2xl font-bold text-lg hover:bg-slate-900 transition-all shadow-md disabled:opacity-70 active:scale-95"
            >
              {isLoading ? <LoadingSpinner /> : 'ค้นหา'}
            </button>

            <button 
              onClick={handleStartScan} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-lg shadow-emerald-500/30 active:scale-95"
            >
              <ScanOutlined className="text-xl" /> สแกน QR
            </button>
          </div>
        </div>
      </div>

      {equipment && (
        <div className="bg-white rounded-[2rem] shadow-[0_24px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden animate-fade-in">
          
          {/* Header Info */}
          <div className="bg-slate-900 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-blue-500 opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-24 h-24 bg-slate-800 rounded-[1.5rem] border border-slate-700 flex items-center justify-center text-5xl flex-shrink-0 shadow-inner z-10">
              {getEquipmentIcon(equipment.type)}
            </div>
            
            <div className="flex-1 text-center md:text-left z-10 w-full">
              <h3 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">{equipment.name}</h3>
              <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-3">
                <span className="font-mono text-sm bg-slate-800/80 border border-slate-700 text-blue-300 px-4 py-1.5 rounded-xl font-bold shadow-inner">
                  <QrcodeOutlined className="mr-1.5"/>{equipment.qr_code}
                </span>
                
                <span className={`px-4 py-1.5 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm
                  ${equipment.status === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {equipment.status === 'NORMAL' ? <CheckCircleOutlined/> : <ExclamationCircleOutlined/>}
                  {equipment.status === 'NORMAL' ? 'สถานะปัจจุบัน: ใช้งานได้' : 'สถานะปัจจุบัน: ชำรุด'}
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="p-4 md:px-8 md:pt-8 bg-slate-50/50 border-b border-slate-100 flex justify-center">
            <div className="relative flex bg-slate-200/50 backdrop-blur-xl p-1.5 rounded-2xl w-full max-w-[340px] md:max-w-[440px] shadow-inner border border-white/50">
              <div
                className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out"
                style={{ transform: activeTab === 'FORM' ? 'translateX(0)' : 'translateX(100%)' }}
              />
              <button onClick={() => setActiveTab('FORM')} className={`relative z-10 flex-1 py-2.5 md:py-3 text-[13px] md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 rounded-xl ${activeTab === 'FORM' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <FormOutlined /> ฟอร์มตรวจสอบ
              </button>
              <button onClick={() => setActiveTab('HISTORY')} className={`relative z-10 flex-1 py-2.5 md:py-3 text-[13px] md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-2 rounded-xl ${activeTab === 'HISTORY' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                <HistoryOutlined /> ประวัติย้อนหลัง
              </button>
            </div>
          </div>

          <div className="p-4 md:p-8">
            {/* TAB CONTENT: FORM */}
            {activeTab === 'FORM' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-6 px-2">
                  <ToolOutlined className="text-blue-500 text-xl" />
                  <h4 className="text-lg font-black text-slate-800 m-0 uppercase tracking-wide">รายการที่ต้องตรวจเช็ค</h4>
                </div>
                
                <div className="space-y-3 md:space-y-4">
                  {(CHECKLISTS[equipment.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน']).map((item, index) => {
                    const isPass = inspectionResult[index];
                    return (
                      <div 
                        key={index} 
                        onClick={() => setInspectionResult({...inspectionResult, [index]: !isPass})}
                        className={`cursor-pointer p-4 md:p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4
                          ${isPass ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50/50' : 'bg-rose-50/50 border-rose-300 shadow-[0_4px_12px_rgba(225,29,72,0.1)]'}`}
                      >
                        <div className="flex items-start gap-3 flex-1 pr-0 md:pr-4">
                          {isPass 
                            ? <CheckCircleOutlined className="text-emerald-500 text-2xl mt-0.5 flex-shrink-0" /> 
                            : <CloseCircleOutlined className="text-rose-500 text-2xl mt-0.5 flex-shrink-0" />
                          }
                          <span className={`font-bold text-sm md:text-base leading-relaxed pt-0.5 ${isPass ? 'text-slate-700' : 'text-rose-900'}`}>
                            {item}
                          </span>
                        </div>
                        
                        <div className="w-full md:w-auto flex justify-between items-center bg-white md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-100 shadow-sm md:shadow-none" onClick={(e) => e.stopPropagation()}>
                          <span className={`font-black text-[11px] md:hidden uppercase tracking-widest ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
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

                {/* 📸 🟢 โซนอัปโหลดรูปภาพ */}
                <div className="mt-8 bg-white p-6 rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  {/* กรอบเตือนสีแดงเบาๆ ถ้ายังไม่แนบรูป */}
                  {fileList.length === 0 && <div className="absolute inset-0 border-2 border-rose-200/50 rounded-[1.5rem] pointer-events-none z-10 animate-pulse"></div>}

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <CameraOutlined className={`text-lg ${fileList.length > 0 ? 'text-emerald-500' : 'text-blue-500'}`} />
                      <h4 className="text-base font-black text-slate-800 m-0 uppercase tracking-wide">หลักฐานภาพถ่าย</h4>
                    </div>
                    {fileList.length === 0 ? (
                      <span className="text-xs font-bold bg-rose-50 text-rose-500 px-3 py-1 rounded-full border border-rose-100">*จำเป็นต้องแนบภาพเพื่อเป็นหลักฐาน</span>
                    ) : (
                      <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">✔ แนบแล้ว {fileList.length} ภาพ</span>
                    )}
                  </div>
                  
                  <Upload
                    listType="picture-card"
                    fileList={fileList}
                    onPreview={handlePreview}
                    onChange={handleChange}
                    beforeUpload={() => false}
                    multiple
                  >
                    {fileList.length >= 4 ? null : uploadButton}
                  </Upload>
                </div>

                {/* Submit Area */}
                <div className="mt-8 bg-slate-50 p-6 md:p-8 rounded-[1.5rem] border border-slate-200 text-center shadow-inner">
                  <p className="text-slate-500 text-xs md:text-sm mb-6 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    ผู้ทำการตรวจสอบ: <span className="text-blue-600 bg-white border border-blue-100 px-4 py-1.5 rounded-full shadow-sm"><UserOutlined className="mr-1"/>{currentUser?.full_name || 'ไม่ระบุชื่อ'}</span>
                  </p>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full md:w-auto md:px-16 mx-auto rounded-[1.25rem] h-14 text-base md:text-lg font-black shadow-[0_8px_24px_rgba(37,99,235,0.3)] hover:shadow-[0_12px_32px_rgba(37,99,235,0.4)] border-none bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 transition-all hover:-translate-y-1 active:scale-95"
                  >
                    {isLoading ? <LoadingSpinner /> : <><SaveOutlined /> บันทึกผลตรวจลงระบบ</>}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="py-4 px-2 md:px-6 animate-fade-in">
                {equipment.logs && equipment.logs.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-8">
                    {equipment.logs.map((log: any, idx: number) => {
                      
                      // 🟢 จัดการแปลงข้อมูลรูปภาพ
                      let logPhotos = [];
                      try {
                        if (log.photos) { logPhotos = typeof log.photos === 'string' ? JSON.parse(log.photos) : log.photos; }
                      } catch(e) { console.error("Error parsing photos"); }

                      // 🟢 จัดการแปลงข้อมูล Checklist (รายละเอียดว่าชำรุดตรงไหน)
                      let parsedDetails: Record<number, boolean> = {};
                      try {
                        if (log.details) { parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details; }
                      } catch(e) { console.error("Error parsing details"); }
                      
                      const typeList = CHECKLISTS[equipment.type] || ['สภาพทั่วไป'];

                      return (
                      <div key={idx} className="relative pl-6 md:pl-8">
                        <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-white shadow-sm
                          ${log.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        
                        <div className="bg-white p-5 rounded-[1.25rem] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <p className="font-extrabold text-slate-800 text-sm md:text-base m-0 flex items-center gap-2">
                              <HistoryOutlined className="text-slate-400" />
                              {dayjs(log.created_at).format('DD MMMM YYYY, HH:mm')}
                            </p>
                            <span className={`px-3 py-1 font-black text-[10px] md:text-xs rounded-full uppercase tracking-wider
                              ${log.status === 'NORMAL' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/30' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/30'}`}>
                              {log.status === 'NORMAL' ? 'ผ่านเกณฑ์' : 'ชำรุด/ไม่ผ่าน'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[10px] md:text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                              <UserOutlined className="mr-1"/> ผู้ตรวจ: {log.inspector_name || 'ไม่ระบุชื่อ'}
                            </span>
                          </div>
                          
                          {/* 🟢 โชว์รายละเอียด Checklist ที่ตรวจไป */}
                          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-3 space-y-1.5">
                            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><ToolOutlined/> รายละเอียดการตรวจ</h5>
                            {typeList.map((item, i) => {
                               const isPass = parsedDetails[i];
                               // ถ้าหาค่าไม่ได้ (undefined) แสดงว่าไม่ได้ตรวจข้อนั้น (อาจจะอัปเดตระบบทีหลัง)
                               if (isPass === undefined) return null; 
                               
                               return (
                                 <div key={i} className="flex items-start gap-2 text-xs md:text-sm">
                                    {isPass ? <CheckCircleOutlined className="text-emerald-500 mt-0.5 shrink-0" /> : <CloseCircleOutlined className="text-rose-500 mt-0.5 shrink-0" />}
                                    <span className={`${isPass ? 'text-slate-600' : 'text-rose-600 font-bold'}`}>{item}</span>
                                 </div>
                               )
                            })}
                          </div>

                          {/* 🟢 แสดงรูปภาพในประวัติ */}
                          {logPhotos && logPhotos.length > 0 && (
                            <div>
                              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-4 mb-2 flex items-center gap-1"><CameraOutlined/> ภาพถ่ายหน้างาน</h5>
                              <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                {logPhotos.map((photoUrl: string, i: number) => (
                                  <div key={i} className="w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity">
                                    <img src={photoUrl} alt="Inspection evidence" className="w-full h-full object-cover" 
                                         onClick={() => {
                                           setPreviewImage(photoUrl);
                                           setPreviewOpen(true);
                                         }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <HistoryOutlined className="text-5xl mb-4 text-slate-300" />
                    <span className="font-black text-slate-500 uppercase tracking-widest text-sm">ยังไม่มีประวัติการตรวจสอบ</span>
                    <span className="text-xs mt-2 font-medium text-slate-400">อุปกรณ์ชิ้นนี้ยังไม่เคยถูกบันทึกผลการตรวจสอบลงระบบ</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* 🌟 หน้าต่าง Modal ดูรูปภาพขยาย */}
      <Modal open={previewOpen} title={<span className="font-bold text-slate-700">รูปภาพหลักฐาน</span>} footer={null} onCancel={() => setPreviewOpen(false)} centered destroyOnClose>
        <img alt="Preview" style={{ width: '100%', borderRadius: '12px' }} src={previewImage} />
      </Modal>

      <Modal 
        title={<div className="flex items-center gap-2 text-emerald-600"><ScanOutlined className="text-xl"/> <span className="font-black tracking-tight">สแกนรหัสอุปกรณ์</span></div>} 
        open={isScannerOpen} 
        onCancel={() => setIsScannerOpen(false)} 
        footer={null}
        centered
        destroyOnClose 
        className="custom-scanner-modal"
      >
        <QRScanner 
          onScan={(text) => {
            setIsScannerOpen(false); 
            executeSearch(text); 
          }} 
        />
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scanner-modal .ant-modal-content {
          border-radius: 2rem !important;
          overflow: hidden;
          box-shadow: 0 24px 60px -12px rgba(0,0,0,0.15) !important;
        }
        .custom-scanner-modal .ant-modal-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
        }
        .custom-scanner-modal .ant-modal-body {
          padding: 24px;
          background: #f8fafc;
        }

        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}