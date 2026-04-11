import React, { useState } from 'react';
import { message, Modal, Upload } from 'antd'; 
import liff from '@line/liff'; 
import QRScanner from './QRScanner'; 
import { 
  QrcodeOutlined, SearchOutlined, ToolOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, SaveOutlined, HistoryOutlined, UserOutlined,
  SafetyCertificateOutlined, ScanOutlined, ExclamationCircleOutlined,
  FormOutlined, CameraOutlined, CloseOutlined
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
    className={`relative inline-flex h-7 w-12 sm:h-8 sm:w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${checked ? 'bg-emerald-500' : 'bg-red-500'}`}
  >
    <span className={`pointer-events-none inline-block h-6 w-6 sm:h-7 sm:w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5 sm:translate-x-6' : 'translate-x-0'}`} />
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

  const executeSearch = async (codeToSearch: string) => {
    if (!codeToSearch) return message.warning('กรุณาระบุรหัส QR Code');
    
    const formattedCode = codeToSearch.toUpperCase().trim();

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/equipment/${formattedCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
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

  const handleStartScan = async () => {
    if (!liff) {
      setIsScannerOpen(true);
      return;
    }
    if (liff.isInClient() && liff.scanCodeV2) {
      try {
        const result = await liff.scanCodeV2();
        if (result && result.value) executeSearch(result.value); 
      } catch (error) {
        console.error("LINE Native Scanner error:", error);
      }
    } else {
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
      const token = localStorage.getItem('token');
      // 🔥 ค้นหาข้อมูลล่าสุดอีกครั้งหลังจากบันทึกสำเร็จ เพื่อให้หน้าประวัติอัปเดต
      await fetch(`${API_URL}/equipment/${equipment.id}/inspect`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: finalStatus,
          inspector_id: currentUser?.id,
          inspector_name: currentUser?.full_name || 'เจ้าหน้าที่ (ไม่ระบุตัวตน)', 
          details: JSON.stringify(inspectionResult),
          photos: JSON.stringify(photosBase64) 
        })
      });
      
      // ดึงข้อมูลใหม่เพื่อเอา Logs ล่าสุดมาโชว์ในหน้า History
      const res = await fetch(`${API_URL}/equipment/${equipment.qr_code}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedData = await res.json();
        setEquipment(updatedData);
      }

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
      <div style={{ marginTop: 8 }} className="font-bold text-[10px] md:text-xs uppercase tracking-wider">เพิ่มรูป</div>
    </div>
  );

  // 🟢 หน้าจอ "บันทึกสำเร็จ" โฉมใหม่ มีปุ่มให้เลือกทำต่อ
  if (isSuccess) {
    return (
      <div className="max-w-xl mx-auto mt-4 md:mt-10 p-6 md:p-12 bg-white rounded-3xl md:rounded-[2rem] shadow-xl border border-emerald-100 text-center animate-fade-in mx-4">
        
        <div className="w-20 h-20 md:w-24 md:h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner relative">
           <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-20"></div>
           <CheckCircleOutlined className="text-5xl md:text-6xl drop-shadow-md" />
        </div>
        
        <h2 className="text-2xl md:text-4xl font-black text-slate-800 mb-3 tracking-tight">บันทึกเรียบร้อย!</h2>
        
        <p className="text-slate-500 text-sm md:text-lg mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
          อัปเดตสถานะของ <strong className="text-emerald-600 block mt-1 text-lg md:text-xl">{equipment?.name}</strong> สำเร็จ
        </p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { setIsSuccess(false); setActiveTab('HISTORY'); }} 
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white rounded-2xl h-12 md:h-14 text-sm md:text-base font-bold shadow-lg hover:bg-slate-900 transition-all"
          >
            <HistoryOutlined className="text-lg" /> ดูประวัติอุปกรณ์ชิ้นนี้
          </button>

          <button 
            onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); handleStartScan(); }} 
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl h-12 md:h-14 text-sm md:text-base font-bold shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all"
          >
            <ScanOutlined className="text-lg" /> สแกนอุปกรณ์ชิ้นต่อไป
          </button>
          
          <button 
            onClick={() => { setEquipment(null); setQrCode(''); setIsSuccess(false); }} 
            className="w-full flex items-center justify-center gap-2 bg-white text-slate-500 border border-slate-200 rounded-2xl h-12 md:h-14 text-sm md:text-base font-bold hover:bg-slate-50 hover:text-slate-700 transition-all mt-2"
          >
            <CloseOutlined /> ปิดหน้าต่างนี้
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-20 animate-fade-in relative px-2 md:px-0">
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-400/10 rounded-full blur-[80px] pointer-events-none -z-10"></div>
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 md:gap-4 mb-6 px-2 md:px-0">
        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-2xl shadow-lg shadow-blue-500/30 text-white shrink-0">
          <SafetyCertificateOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight leading-tight">ระบบตรวจสอบอุปกรณ์</h2>
          <p className="text-slate-500 text-xs md:text-sm m-0 mt-0.5 font-medium">Smart Equipment Inspection</p>
        </div>
      </div>

      {/* 🔍 Search Box */}
      <div className="bg-white p-4 md:p-8 rounded-3xl md:rounded-[1.5rem] shadow-sm border border-slate-100 mb-6 transition-all hover:shadow-md">
        <label className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-2 md:mb-3 flex items-center gap-2">
          <QrcodeOutlined className="text-blue-500 text-lg md:text-xl" /> สแกนหรือพิมพ์รหัสอุปกรณ์
        </label>
        
        <div className="flex flex-col md:flex-row gap-2 md:gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
              <SearchOutlined className="text-slate-400 text-base md:text-lg" />
            </div>
            <input 
              type="text"
              placeholder="พิมพ์รหัส เช่น EXT-001" 
              value={qrCode} 
              onChange={(e) => setQrCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchQR()}
              className="block w-full pl-10 md:pl-11 pr-4 py-3 md:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-base md:text-lg font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all uppercase"
            />
          </div>
          
          <div className="flex gap-2 md:gap-3">
            <button 
              onClick={handleSearchQR} 
              disabled={isLoading}
              className="flex-1 md:flex-none flex items-center justify-center min-w-[80px] md:min-w-[120px] px-4 md:px-6 py-3 md:py-4 bg-slate-800 text-white rounded-2xl font-bold text-sm md:text-lg hover:bg-slate-900 transition-all shadow-sm disabled:opacity-70 active:scale-95"
            >
              {isLoading ? <LoadingSpinner /> : 'ค้นหา'}
            </button>

            <button 
              onClick={handleStartScan} 
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm md:text-lg hover:from-emerald-400 hover:to-teal-400 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <ScanOutlined className="text-lg md:text-xl" /> <span className="hidden sm:inline">สแกน QR</span><span className="sm:hidden">สแกน</span>
            </button>
          </div>
        </div>
      </div>

      {equipment && (
        <div className="bg-white rounded-[2rem] shadow-lg border border-slate-100 overflow-hidden animate-fade-in">
          
          {/* Header Info */}
          <div className="bg-slate-900 p-5 md:p-8 flex flex-row items-center gap-4 md:gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 md:w-40 h-32 md:h-40 bg-white opacity-5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="w-16 h-16 md:w-24 md:h-24 bg-slate-800 rounded-2xl md:rounded-[1.5rem] border border-slate-700 flex items-center justify-center text-3xl md:text-5xl flex-shrink-0 shadow-inner z-10">
              {getEquipmentIcon(equipment.type)}
            </div>
            
            <div className="flex-1 text-left z-10 w-full min-w-0">
              <h3 className="text-lg md:text-3xl font-black text-white mb-1 md:mb-2 tracking-tight truncate">{equipment.name}</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 md:gap-3">
                <span className="font-mono text-[10px] md:text-sm bg-slate-800/80 border border-slate-700 text-blue-300 px-3 py-1 rounded-lg font-bold">
                  <QrcodeOutlined className="mr-1"/>{equipment.qr_code}
                </span>
                
                <span className={`px-3 py-1 text-[10px] md:text-xs font-black rounded-lg flex items-center gap-1 
                  ${equipment.status === 'NORMAL' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {equipment.status === 'NORMAL' ? <CheckCircleOutlined/> : <ExclamationCircleOutlined/>}
                  {equipment.status === 'NORMAL' ? 'ใช้งานได้' : 'ชำรุด'}
                </span>
              </div>
            </div>
          </div>

          {/* Segmented Control */}
          <div className="p-3 md:p-4 bg-slate-50/80 border-b border-slate-100 flex justify-center">
            <div className="relative flex bg-slate-200/50 p-1 rounded-[14px] w-full max-w-[400px]">
              <div
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm transition-transform duration-300 ease-out"
                style={{ transform: activeTab === 'FORM' ? 'translateX(0)' : 'translateX(100%)' }}
              />
              <button onClick={() => setActiveTab('FORM')} className={`relative z-10 flex-1 py-2 text-xs md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-1.5 rounded-xl ${activeTab === 'FORM' ? 'text-blue-600' : 'text-slate-500'}`}>
                <FormOutlined /> ฟอร์มตรวจสอบ
              </button>
              <button onClick={() => setActiveTab('HISTORY')} className={`relative z-10 flex-1 py-2 text-xs md:text-sm font-black transition-colors duration-300 flex items-center justify-center gap-1.5 rounded-xl ${activeTab === 'HISTORY' ? 'text-blue-600' : 'text-slate-500'}`}>
                <HistoryOutlined /> ประวัติย้อนหลัง
              </button>
            </div>
          </div>

          <div className="p-3 md:p-8">
            {/* TAB CONTENT: FORM */}
            {activeTab === 'FORM' && (
              <div className="animate-fade-in">
                <div className="flex items-center gap-2 mb-4 md:mb-6 px-1">
                  <ToolOutlined className="text-blue-500 text-lg md:text-xl" />
                  <h4 className="text-sm md:text-lg font-black text-slate-800 m-0 uppercase tracking-wide">รายการที่ต้องตรวจเช็ค</h4>
                </div>
                
                <div className="space-y-3">
                  {(CHECKLISTS[equipment.type] || ['สภาพทั่วไปปกติพร้อมใช้งาน']).map((item, index) => {
                    const isPass = inspectionResult[index];
                    return (
                      <div 
                        key={index} 
                        onClick={() => setInspectionResult({...inspectionResult, [index]: !isPass})}
                        className={`cursor-pointer p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3
                          ${isPass ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300' : 'bg-rose-50/50 border-rose-300 shadow-sm'}`}
                      >
                        <div className="flex items-start gap-2.5 flex-1 pr-0 sm:pr-4">
                          {isPass 
                            ? <CheckCircleOutlined className="text-emerald-500 text-xl mt-0.5 shrink-0" /> 
                            : <CloseCircleOutlined className="text-rose-500 text-xl mt-0.5 shrink-0" />
                          }
                          <span className={`font-bold text-xs md:text-sm leading-snug pt-0.5 ${isPass ? 'text-slate-700' : 'text-rose-900'}`}>
                            {item}
                          </span>
                        </div>
                        
                        <div className="w-full sm:w-auto flex justify-between items-center bg-white sm:bg-transparent p-2 sm:p-0 rounded-xl border sm:border-none border-slate-100" onClick={(e) => e.stopPropagation()}>
                          <span className={`font-black text-[10px] sm:hidden uppercase tracking-widest ${isPass ? 'text-emerald-600' : 'text-rose-600'}`}>
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

                {/* 📸 โซนอัปโหลดรูปภาพ */}
                <div className="mt-6 md:mt-8 bg-white p-4 md:p-6 rounded-2xl md:rounded-[1.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  {fileList.length === 0 && <div className="absolute inset-0 border-2 border-rose-200/50 rounded-2xl pointer-events-none z-10 animate-pulse"></div>}

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <CameraOutlined className={`text-lg md:text-xl ${fileList.length > 0 ? 'text-emerald-500' : 'text-blue-500'}`} />
                      <h4 className="text-sm md:text-base font-black text-slate-800 m-0 uppercase tracking-wide">หลักฐานภาพถ่าย</h4>
                    </div>
                    {fileList.length === 0 ? (
                      <span className="text-[10px] md:text-xs font-bold bg-rose-50 text-rose-500 px-2 md:px-3 py-1 rounded-full border border-rose-100 self-start sm:self-auto">*จำเป็นต้องแนบภาพ</span>
                    ) : (
                      <span className="text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-600 px-2 md:px-3 py-1 rounded-full border border-emerald-100 self-start sm:self-auto">✔ แนบแล้ว {fileList.length} ภาพ</span>
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
                <div className="mt-6 md:mt-8 bg-slate-50 p-4 md:p-6 rounded-2xl border border-slate-200 text-center">
                  <p className="text-slate-500 text-[10px] md:text-xs mb-4 font-bold flex items-center justify-center gap-1.5 flex-wrap">
                    <UserOutlined /> ผู้ตรวจ: <span className="text-blue-600 bg-white border border-blue-100 px-2 py-0.5 rounded-md">{currentUser?.full_name || 'ไม่ระบุ'}</span>
                  </p>
                  <button 
                    onClick={handleSubmit} 
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full mx-auto rounded-xl h-12 md:h-14 text-sm md:text-base font-black shadow-md border-none bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70 active:scale-95"
                  >
                    {isLoading ? <LoadingSpinner /> : <><SaveOutlined /> บันทึกผลตรวจลงระบบ</>}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: HISTORY */}
            {activeTab === 'HISTORY' && (
              <div className="py-2 animate-fade-in">
                {equipment.logs && equipment.logs.length > 0 ? (
                  <div className="relative border-l-[1.5px] border-slate-200 ml-3 md:ml-6 space-y-6 md:space-y-8 pb-4">
                    {equipment.logs.map((log: any, idx: number) => {
                      
                      let logPhotos = [];
                      try { if (log.photos) { logPhotos = typeof log.photos === 'string' ? JSON.parse(log.photos) : log.photos; } } catch(e) {}

                      let parsedDetails: Record<number, boolean> = {};
                      try { if (log.details) { parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details; } } catch(e) {}
                      
                      const typeList = CHECKLISTS[equipment.type] || ['สภาพทั่วไป'];

                      return (
                      <div key={idx} className="relative pl-5 md:pl-8">
                        <div className={`absolute -left-[7px] md:-left-[11px] top-1.5 w-3.5 h-3.5 md:w-5 md:h-5 rounded-full border-2 md:border-4 border-white shadow-sm
                          ${log.status === 'NORMAL' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        
                        <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[1.25rem] border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow">
                          
                          <div className="flex justify-between items-start gap-3 mb-3">
                            <div className="font-extrabold text-slate-800 text-[13px] md:text-base m-0 flex items-start md:items-center gap-1.5 md:gap-2 flex-1 min-w-0">
                              <HistoryOutlined className="text-slate-400 mt-0.5 md:mt-0 shrink-0" />
                              <span className="leading-snug">{dayjs(log.created_at).format('DD MMMM YYYY, HH:mm')}</span>
                            </div>
                            <span className={`shrink-0 whitespace-nowrap px-2.5 py-1 md:px-3 md:py-1 font-black text-[10px] md:text-xs rounded-full uppercase tracking-wider
                              ${log.status === 'NORMAL' ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-500/30' : 'bg-rose-50 text-rose-600 ring-1 ring-rose-500/30'}`}>
                              {log.status === 'NORMAL' ? 'ผ่านเกณฑ์' : 'ชำรุด/ไม่ผ่าน'}
                            </span>
                          </div>

                          <div className="mb-3">
                            <span className="text-[10px] md:text-[11px] text-slate-500 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100">
                              <UserOutlined className="mr-1"/> ตรวจโดย: {log.inspector_name || 'ไม่ระบุชื่อ'}
                            </span>
                          </div>
                          
                          {/* รายละเอียดการตรวจ */}
                          <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-100 mb-3 space-y-2">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2"><ToolOutlined className="mr-1"/> ผลการตรวจ</h5>
                            {typeList.map((item, i) => {
                               const isPass = parsedDetails[i];
                               if (isPass === undefined) return null; 
                               return (
                                 <div key={i} className="flex items-start gap-1.5 text-[11px] md:text-xs">
                                    {isPass ? <CheckCircleOutlined className="text-emerald-500 mt-0.5 shrink-0" /> : <CloseCircleOutlined className="text-rose-500 mt-0.5 shrink-0" />}
                                    <span className={`leading-snug ${isPass ? 'text-slate-600' : 'text-rose-600 font-bold'}`}>{item}</span>
                                 </div>
                               )
                            })}
                          </div>

                          {/* รูปภาพในประวัติ (ย่อขนาดบนมือถือ) */}
                          {logPhotos && logPhotos.length > 0 && (
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 mb-1.5"><CameraOutlined className="mr-1"/> ภาพถ่าย</h5>
                              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                                {logPhotos.map((photoUrl: string, i: number) => (
                                  <div key={i} className="w-14 h-14 md:w-16 md:h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                                       onClick={() => { setPreviewImage(photoUrl); setPreviewOpen(true); }}>
                                    <img src={photoUrl} alt="Evidence" className="w-full h-full object-cover" />
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
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <HistoryOutlined className="text-3xl mb-2 text-slate-300" />
                    <span className="font-bold text-slate-500 text-xs">ยังไม่มีประวัติการตรวจสอบ</span>
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

      {/* 🟢 หน้าต่างสแกนเนอร์ */}
      <Modal 
        title={<div className="flex items-center gap-2 text-emerald-600 px-2"><ScanOutlined className="text-xl"/> <span className="font-black tracking-tight">สแกน QR Code</span></div>} 
        open={isScannerOpen} 
        onCancel={() => setIsScannerOpen(false)} 
        footer={null}
        centered
        destroyOnClose 
        className="custom-scanner-modal"
        styles={{ body: { padding: 0 }, header: { margin: 0, padding: '16px 24px', borderBottom: '1px solid #f1f5f9' } }}
      >
        <div className="bg-black w-full relative flex items-center justify-center overflow-hidden min-h-[300px] md:min-h-[400px]">
           <QRScanner 
             onScan={(text) => {
               setIsScannerOpen(false); 
               executeSearch(text); 
             }} 
           />
        </div>
      </Modal>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .custom-scanner-modal .ant-modal-content {
          border-radius: 1.5rem !important;
          overflow: hidden;
          padding: 0 !important;
        }

        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}