import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Form, Select, Upload, message, Avatar, Grid 
} from 'antd'; 
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, FileTextOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, IdcardOutlined, CheckOutlined, CloseOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase'; 

const { useBreakpoint } = Grid; 

// 🗓️ ✨ Component เลือกวันที่แบบ Native 
const ModernDatePickerRange = ({ value, onChange }: any) => {
  const onStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value ? dayjs(e.target.value) : null;
    onChange([start, value?.[1]]);
  };
  const onEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value ? dayjs(e.target.value) : null;
    onChange([value?.[0], end]);
  };
  const toNativeFormat = (date: any) => date ? date.format('YYYY-MM-DD') : '';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <CalendarOutlined className="text-blue-500"/> วันที่ออกบัตร
        </label>
        <input 
          type="date" 
          className="w-full bg-transparent outline-none text-slate-800 font-semibold"
          value={toNativeFormat(value?.[0])}
          onChange={onStartChange}
        />
      </div>
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 flex items-center gap-1">
          <ClockCircleOutlined className="text-orange-500"/> วันหมดอายุ
        </label>
        <input 
          type="date" 
          className="w-full bg-transparent outline-none text-slate-800 font-semibold"
          value={toNativeFormat(value?.[1])}
          onChange={onEndChange}
        />
      </div>
    </div>
  );
};

export default function CertificateManager({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [certs, setCerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<any[]>([]);

  const fetchCerts = async () => {
    try {
      const res = await fetch('https://safetyos-backend.onrender.com/certificates');
      const data = await res.json();
      setCerts(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลใบ Certificate ได้');
    }
  };

  useEffect(() => {
    fetchCerts();
  }, []);

  const handleUploadCert = async (values: any) => {
    if (!currentUser || currentUser.role !== 'CONTRACTOR') {
      message.error('เฉพาะผู้รับเหมาเท่านั้นที่อัปโหลดใบเซอร์ได้ครับ!');
      return;
    }

    setIsLoading(true);
    try {
      let finalFileUrl = 'https://example.com/dummy-cert.pdf';

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `certs/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { error } = await supabase.storage.from('permits').upload(uniqueName, file);
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName);
        finalFileUrl = publicUrlData.publicUrl;
      }

      const issuedDate = values.dateRange[0].toISOString();
      const expiryDate = values.dateRange[1].toISOString();

      await fetch('https://safetyos-backend.onrender.com/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          cert_name: values.cert_name,
          file_url: finalFileUrl, 
          issued_date: issuedDate,
          expiry_date: expiryDate
        })
      });

      message.success('อัปโหลดใบ Certificate สำเร็จ! รอ จป. ตรวจสอบครับ');
      form.resetFields();
      setFileList([]); 
      fetchCerts(); 
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอัปโหลด');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (certId: string, status: string) => {
    try {
      await fetch(`https://safetyos-backend.onrender.com/certificates/${certId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      message.success(status === 'APPROVED' ? 'อนุมัติใบ Certificate แล้ว' : 'ปฏิเสธใบ Certificate แล้ว');
      fetchCerts(); 
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  // --- UI Helpers (Premium Tailwind Badges) ---
  const getStatusTag = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอตรวจสอบ</span>;
      case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20 whitespace-nowrap"><CheckCircleOutlined /> ผ่าน</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20 whitespace-nowrap"><CloseCircleOutlined /> ไม่ผ่าน</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] md:text-xs font-bold bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap">{status}</span>;
    }
  };

  const getExpiryDisplay = (expiryDate: string) => {
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysLeft = expiry.diff(today, 'day');
    
    if (daysLeft < 0) return <span className="inline-block mt-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">หมดอายุแล้ว</span>;
    if (daysLeft <= 30) return <span className="inline-block mt-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">เหลือ {daysLeft} วัน</span>;
    return <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">เหลือ {daysLeft} วัน</span>;
  };

  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role === 'SAFETY_ENGINEER' && record.status === 'PENDING') {
      return (
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={() => handleVerify(record.id, 'APPROVED')} 
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold shadow hover:shadow-md hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all whitespace-nowrap"
          >
            <CheckOutlined /> อนุมัติ
          </button>
          <button 
            onClick={() => handleVerify(record.id, 'REJECTED')} 
            className="w-8 h-8 md:w-auto md:px-3 md:py-1.5 flex-shrink-0 flex items-center justify-center gap-1.5 bg-white text-rose-500 rounded-lg border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm active:scale-95 transition-all"
            title="ปฏิเสธ"
          >
            <CloseOutlined /> <span className="hidden md:inline text-xs font-bold">ปฏิเสธ</span>
          </button>
        </div>
      );
    }
    return null;
  };

  const columns: ColumnsType<any> = [
    {
      title: 'ผู้รับเหมา', 
      key: 'user', 
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-500 border border-slate-200" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-slate-800 text-sm">{record.user?.full_name}</span>
            <span className="text-xs text-slate-400 font-medium">{record.user?.department}</span>
          </div>
        </div>
      )
    },
    {
      title: 'ชื่อใบ Certificate', 
      dataIndex: 'cert_name', 
      key: 'cert_name',
      render: (text) => (
        <div className="font-bold text-slate-700 text-sm flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-500" /> {text}
        </div>
      )
    },
    {
      title: 'วันหมดอายุ', 
      key: 'expiry_date',
      render: (_, record) => (
        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-slate-700">{dayjs(record.expiry_date).format('DD MMM YYYY')}</span>
          {getExpiryDisplay(record.expiry_date)}
        </div>
      )
    },
    {
      title: 'เอกสาร',
      key: 'document',
      render: (_, record) => (
        record.file_url ? (
          <a href={record.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap">
            <FileTextOutlined /> ดูไฟล์แนบ
          </a>
        ) : <span className="text-xs text-slate-300 font-medium">-</span>
      )
    },
    {
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'การจัดการ', 
      key: 'action',
      render: (_, record) => <ActionButtons record={record} />
    },
  ];

  return (
    <div className="w-full pb-20 px-2 md:px-0">
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
          <IdcardOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">จัดการใบ Certificate</h2>
          <p className="text-slate-500 text-xs md:text-sm m-0 mt-1">E-Certificate Management System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        
        {/* 📝 ส่วนที่ 1: ฟอร์มอัปโหลด (เฉพาะผู้รับเหมา) */}
        {currentUser?.role === 'CONTRACTOR' && (
          <div className="xl:col-span-4">
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 border-b border-blue-100">
                <h3 className="text-lg font-bold text-blue-800 m-0 flex items-center gap-2">
                  <UploadOutlined /> นำส่งใบ Certificate
                </h3>
                <p className="text-xs font-medium text-blue-600/80 m-0 mt-1">อัปโหลดเอกสารเพื่อใช้ประกอบการขออนุญาตทำงาน</p>
              </div>
              
              <div className="p-5 md:p-6 bg-white">
                <Form form={form} layout="vertical" onFinish={handleUploadCert} requiredMark={false}>
                  <Form.Item name="cert_name" label={<span className="font-bold text-slate-700">ประเภทใบ Certificate <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                    <Select size="large" placeholder="-- เลือกประเภทเอกสาร --" className="w-full rounded-xl">
                      <Select.Option value="ผู้ปฏิบัติงานในที่อับอากาศ (Confined Space)">🕳️ ผู้ปฏิบัติงานในที่อับอากาศ</Select.Option>
                      <Select.Option value="ผู้ควบคุมปั้นจั่น (Crane Operator)">🏗️ ผู้ควบคุมปั้นจั่น</Select.Option>
                      <Select.Option value="ช่างไฟฟ้า (Electrician)">⚡ ช่างไฟฟ้า</Select.Option>
                      <Select.Option value="ผู้ควบคุมงานร้อน (Hot Work Safety)">🔥 ผู้ควบคุมงานร้อน</Select.Option>
                      <Select.Option value="อื่นๆ (Others)">📝 อื่นๆ</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="dateRange" label={<span className="font-bold text-slate-700">อายุของใบ Certificate <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุวันที่' }]} style={{marginBottom: '20px'}}>
                    <ModernDatePickerRange />
                  </Form.Item>

                  <Form.Item label={<span className="font-bold text-slate-700">แนบไฟล์เอกสาร <span className="text-red-500">*</span></span>}>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                      <div className="w-full border-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100 transition-colors rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer mb-2">
                        <div className="bg-white text-blue-500 p-2 rounded-full mb-2 shadow-sm border border-blue-100">
                          <FileTextOutlined className="text-xl" />
                        </div>
                        <span className="text-slate-700 font-semibold text-sm mb-1">แตะเพื่อเลือกไฟล์</span>
                        <span className="text-slate-400 text-[10px]">รองรับ PDF, JPG, PNG</span>
                      </div>
                    </Upload>
                  </Form.Item>

                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={isLoading} 
                    className="w-full h-14 rounded-2xl text-base font-bold bg-indigo-600 hover:!bg-indigo-700 border-none shadow-lg shadow-indigo-500/30 flex items-center justify-center"
                  >
                    ส่งข้อมูลให้ จป. ตรวจสอบ
                  </Button>
                </Form>
              </div>
            </div>
          </div>
        )}

        {/* 📋 ส่วนที่ 2: ตารางข้อมูลทะเบียนประวัติ */}
        <div className={currentUser?.role === 'CONTRACTOR' ? "xl:col-span-8" : "xl:col-span-12"}>
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base md:text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-emerald-500" /> ทะเบียนประวัติ (Registry)
              </h3>
              <div className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                {certs.length} รายการ
              </div>
            </div>

            <div className="p-4 flex-1">
              {/* 🚀 Desktop View: Table */}
              {!isMobile && (
                <Table 
                  columns={columns} 
                  dataSource={certs} 
                  loading={isLoading && certs.length === 0} 
                  pagination={{ pageSize: 8, className: "px-4 pb-2" }} 
                  rowKey="id" 
                  size="middle"
                  className="modern-table"
                />
              )}

              {/* 🚀 Mobile View: Card List */}
              {isMobile && (
                <div className="space-y-4">
                  {certs.length > 0 ? certs.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'APPROVED' ? 'bg-emerald-500' : item.status === 'REJECTED' ? 'bg-rose-500' : 'bg-blue-500'}`}></div>
                      <div className="pl-2">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-500 border border-slate-200" />
                            <div className="flex flex-col leading-tight">
                              <span className="text-sm font-bold text-slate-800">{item.user?.full_name}</span>
                              <span className="text-[10px] font-semibold text-slate-400">{item.user?.department}</span>
                            </div>
                          </div>
                          <div>{getStatusTag(item.status)}</div>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                          <h4 className="text-sm font-bold text-slate-700 m-0 mb-2 flex items-start gap-1.5 leading-tight">
                            <SafetyCertificateOutlined className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <span>{item.cert_name}</span>
                          </h4>
                          <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                            <span className="text-[10px] text-slate-500 font-medium">หมดอายุ: {dayjs(item.expiry_date).format('DD/MM/YYYY')}</span>
                            {getExpiryDisplay(item.expiry_date)}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
                          {item.file_url ? (
                            <a href={item.file_url} target="_blank" rel="noreferrer" className="w-full sm:w-auto flex justify-center items-center gap-1.5 border border-indigo-200 text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
                              <FileTextOutlined /> ดูไฟล์แนบ
                            </a>
                          ) : <span className="text-xs text-slate-300 font-medium hidden sm:block">-</span>}
                          
                          <ActionButtons record={item} />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <IdcardOutlined className="text-5xl text-slate-200 mb-3" />
                      <p className="font-medium text-slate-500">ยังไม่มีประวัติใบ Certificate</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .modern-table .ant-table { background: transparent; }
        .modern-table .ant-table-thead > tr > th { background-color: #f8fafc; color: #64748b; font-weight: 700; font-size: 13px; border-bottom: 2px solid #e2e8f0; padding: 16px; }
        .modern-table .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9; padding: 16px; background: white; }
        .modern-table .ant-table-tbody > tr:hover > td { background-color: #f8fafc; }
      `}</style>
    </div>
  );
}