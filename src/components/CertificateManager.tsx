import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  Select, Upload, message, Badge, List, Avatar, Grid 
} from 'antd'; 
import { 
  SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, FileTextOutlined, ClockCircleOutlined, UserOutlined, CalendarOutlined, IdcardOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { supabase } from '../supabase'; 

const { Title, Text } = Typography;
const { useBreakpoint } = Grid; 

// 🗓️ ✨ Component เลือกวันที่แบบ Native (เหมาะกับมือถือสุดๆ)
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
      <div className="form-control bg-slate-50 p-3 rounded-2xl border border-slate-200">
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
      <div className="form-control bg-slate-50 p-3 rounded-2xl border border-slate-200">
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
      console.error('ดึงข้อมูลไม่ได้:', error);
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

        const { data, error } = await supabase.storage
          .from('permits')
          .upload(uniqueName, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('permits')
          .getPublicUrl(uniqueName);

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
      console.error(error);
      message.error('เกิดข้อผิดพลาดในการอัปโหลด');
    }
    setIsLoading(false);
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

  // --- UI Helpers ---
  const getStatusTag = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="bg-blue-100 text-blue-600 px-2.5 py-1 rounded-md text-xs font-bold border border-blue-200"><div className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 animate-pulse"></div>รอตรวจสอบ</span>;
      case 'APPROVED': return <span className="bg-emerald-100 text-emerald-600 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-200"><CheckCircleOutlined className="mr-1"/> ผ่าน</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-md text-xs font-bold border border-red-200"><CloseCircleOutlined className="mr-1"/> ไม่ผ่าน</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-bold border border-gray-200">{status}</span>;
    }
  };

  const getExpiryDisplay = (expiryDate: string) => {
    const expiry = dayjs(expiryDate);
    const today = dayjs();
    const daysLeft = expiry.diff(today, 'day');
    
    if (daysLeft < 0) return <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">หมดอายุแล้ว</span>;
    if (daysLeft <= 30) return <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">เหลือ {daysLeft} วัน</span>;
    return <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">เหลือ {daysLeft} วัน</span>;
  };

  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role === 'SAFETY_ENGINEER' && record.status === 'PENDING') {
      return (
        <div className="flex gap-2 mt-3 md:mt-0 w-full md:w-auto">
          <button onClick={() => handleVerify(record.id, 'APPROVED')} className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none flex-1 md:flex-none shadow-sm">
            <CheckCircleOutlined /> อนุมัติ
          </button>
          <button onClick={() => handleVerify(record.id, 'REJECTED')} className="btn btn-sm bg-red-500 hover:bg-red-600 text-white border-none flex-1 md:flex-none shadow-sm">
            <CloseCircleOutlined /> ปฏิเสธ
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
          <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-400" />
          <div>
            <div className="font-bold text-slate-800">{record.user?.full_name}</div>
            <div className="text-xs text-slate-500">{record.user?.department}</div>
          </div>
        </div>
      )
    },
    {
      title: 'ชื่อใบ Certificate', 
      dataIndex: 'cert_name', 
      key: 'cert_name',
      render: (text) => (
        <div className="font-semibold text-slate-700 flex items-center gap-2">
          <SafetyCertificateOutlined className="text-blue-500" /> {text}
        </div>
      )
    },
    {
      title: 'วันหมดอายุ', 
      key: 'expiry_date',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-600">{dayjs(record.expiry_date).format('DD MMM YYYY')}</span>
          <div>{getExpiryDisplay(record.expiry_date)}</div>
        </div>
      )
    },
    {
      title: 'เอกสาร',
      key: 'document',
      render: (_, record) => (
        record.file_url ? (
          <a href={record.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">
            <FileTextOutlined /> ดูไฟล์แนบ
          </a>
        ) : <span className="text-xs text-slate-400">-</span>
      )
    },
    {
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'จัดการ', 
      key: 'action',
      render: (_, record) => <ActionButtons record={record} />
    },
  ];

  return (
    <div className="w-full pb-20 px-2 md:px-0">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-blue-500 to-sky-500 p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-500/30 text-white">
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
              <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-5 border-b border-blue-100">
                <h3 className="text-lg font-bold text-blue-700 m-0 flex items-center gap-2">
                  <UploadOutlined /> นำส่งใบ Certificate
                </h3>
                <p className="text-xs text-blue-500 m-0 mt-1">อัปโหลดเอกสารเพื่อใช้ประกอบการขออนุญาตทำงาน</p>
              </div>
              
              <div className="p-5 md:p-6 bg-white">
                <Form form={form} layout="vertical" onFinish={handleUploadCert} requiredMark={false}>
                  
                  <Form.Item name="cert_name" label={<span className="font-bold text-slate-700">ประเภทใบ Certificate <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาเลือกประเภท' }]}>
                    <Select size="large" placeholder="-- เลือกประเภทเอกสาร --" className="w-full">
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
                    className="w-full h-14 rounded-2xl text-base font-bold bg-blue-600 hover:!bg-blue-700 border-none shadow-lg shadow-blue-500/30 flex items-center justify-center"
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
                  pagination={{ pageSize: 5 }} 
                  rowKey="id" 
                  className="modern-table"
                />
              )}

              {/* 🚀 Mobile View: Card List */}
              {isMobile && (
                <div className="space-y-4">
                  {certs.length > 0 ? certs.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
                      {/* ขีดสีบอกสถานะ */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'APPROVED' ? 'bg-emerald-500' : item.status === 'REJECTED' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                      
                      <div className="pl-2">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar icon={<UserOutlined />} className="bg-slate-100 text-slate-500 border border-slate-200" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 m-0 leading-tight">{item.user?.full_name}</p>
                              <p className="text-[10px] font-semibold text-slate-400 m-0">{item.user?.department}</p>
                            </div>
                          </div>
                          <div>{getStatusTag(item.status)}</div>
                        </div>

                        {/* Content */}
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                          <h4 className="text-sm font-bold text-slate-700 m-0 mb-2 flex items-start gap-1.5">
                            <SafetyCertificateOutlined className="text-blue-500 mt-0.5" />
                            <span className="leading-tight">{item.cert_name}</span>
                          </h4>
                          <div className="flex justify-between items-center border-t border-slate-200 pt-2 mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">หมดอายุ: {dayjs(item.expiry_date).format('DD/MM/YYYY')}</span>
                            {getExpiryDisplay(item.expiry_date)}
                          </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
                          {item.file_url ? (
                            <a href={item.file_url} target="_blank" rel="noreferrer" className="w-full sm:w-auto btn btn-sm btn-outline border-slate-200 text-slate-600 bg-white hover:bg-slate-50 rounded-lg">
                              <FileTextOutlined /> ดูไฟล์แนบ
                            </a>
                          ) : <span className="text-xs text-slate-400">-</span>}
                          
                          {/* ปุ่มของ จป. จะกางเต็มพื้นที่ในมือถือ */}
                          <ActionButtons record={item} />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <IdcardOutlined className="text-5xl text-blue-300 mb-3 opacity-50" />
                      <p className="font-medium text-lg text-slate-500">ยังไม่มีประวัติใบ Certificate</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .modern-table .ant-table-thead > tr > th {
          background-color: #f8fafc;
          color: #475569;
          font-weight: bold;
          border-bottom: 2px solid #e2e8f0;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}