import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Tag, Button, Space, Typography, Form, Input, 
  Select, Upload, message, Badge, Row, Col, List, Avatar, Grid 
} from 'antd'; 
import { 
  WarningOutlined, CameraOutlined, EnvironmentOutlined, 
  PushpinOutlined, CheckCircleOutlined, SyncOutlined, AlertOutlined,
  UserOutlined, InfoCircleOutlined, ThunderboltOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/th';
import { supabase } from '../supabase';

dayjs.extend(relativeTime);
dayjs.locale('th');

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid; 

export default function IncidentReport({ currentUser }: { currentUser: any }) {
  const screens = useBreakpoint(); 
  const isMobile = !screens.md; 

  const [incidents, setIncidents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  
  const [location, setLocation] = useState<{ lat: number | null, lng: number | null }>({ lat: null, lng: null });
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  const [form] = Form.useForm();

  const fetchIncidents = async () => {
    try {
      const res = await fetch('https://safetyos-backend.onrender.com/incidents');
      const data = await res.json();
      setIncidents(data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลจุดเสี่ยงได้');
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          message.success('ดึงพิกัด GPS สำเร็จ!');
          setIsGettingLocation(false);
        },
        (error) => {
          message.error('ไม่สามารถดึงพิกัดได้ กรุณาเปิด GPS');
          setIsGettingLocation(false);
        }
      );
    } else {
      message.error('อุปกรณ์ของคุณไม่รองรับ GPS');
      setIsGettingLocation(false);
    }
  };

  const handleReportIncident = async (values: any) => {
    if (!currentUser) return message.error('กรุณาเข้าสู่ระบบก่อนแจ้งจุดเสี่ยง');
    
    setIsLoading(true);
    try {
      let imageUrl = null;

      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const fileExt = file.name.split('.').pop();
        const uniqueName = `incidents/${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;

        const { data, error } = await supabase.storage.from('permits').upload(uniqueName, file);
        if (error) throw error;

        const { data: publicUrlData } = supabase.storage.from('permits').getPublicUrl(uniqueName);
        imageUrl = publicUrlData.publicUrl;
      }

      await fetch('https://safetyos-backend.onrender.com/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporter_id: currentUser.id,
          title: values.title,
          description: values.description,
          type: values.type,
          lat: location.lat,
          lng: location.lng,
          image_url: imageUrl
        })
      });

      message.success('ส่งรายงานจุดเสี่ยงสำเร็จ! ระบบได้แจ้งเตือน จป. แล้ว');
      form.resetFields();
      setFileList([]);
      setLocation({ lat: null, lng: null });
      fetchIncidents();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการส่งรายงาน');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`https://safetyos-backend.onrender.com/incidents/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      message.success(`อัปเดตสถานะเป็น ${newStatus} เรียบร้อยแล้ว`);
      fetchIncidents();
    } catch (error) {
      message.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // --- UI Helpers (Tailwind Pure + RWD Fixes) ---
  const getTypeTag = (type: string) => {
    // 🟢 บังคับ whitespace-nowrap ไม่ให้ตัวอักษรโดนบีบตกบรรทัด
    switch(type) {
      case 'NEAR_MISS': return <span className="inline-flex items-center bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-bold border border-orange-200 whitespace-nowrap"><AlertOutlined className="mr-1.5"/> Near Miss (เกือบเกิดอุบัติเหตุ)</span>;
      case 'UNSAFE_ACT': return <span className="inline-flex items-center bg-fuchsia-50 text-fuchsia-600 px-3 py-1 rounded-full text-xs font-bold border border-fuchsia-200 whitespace-nowrap"><WarningOutlined className="mr-1.5"/> Unsafe Act (การกระทำ)</span>;
      case 'UNSAFE_CONDITION': return <span className="inline-flex items-center bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-200 whitespace-nowrap"><WarningOutlined className="mr-1.5"/> Unsafe Condition (สภาพแวดล้อม)</span>;
      default: return <span className="inline-flex items-center bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <div className="bg-red-500 text-white px-3 py-1.5 rounded-full font-black text-[10px] md:text-xs tracking-wider shadow-sm whitespace-nowrap text-center">รอแก้ไข (OPEN)</div>;
      case 'IN_PROGRESS': return <div className="bg-amber-400 text-white px-3 py-1.5 rounded-full font-black text-[10px] md:text-xs tracking-wider shadow-sm whitespace-nowrap text-center">กำลังแก้ (IN PROGRESS)</div>;
      case 'RESOLVED': return <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-full font-black text-[10px] md:text-xs tracking-wider shadow-sm whitespace-nowrap text-center"><CheckCircleOutlined className="mr-1"/>เสร็จแล้ว</div>;
      default: return <div className="bg-slate-500 text-white px-3 py-1.5 rounded-full font-black text-[10px] md:text-xs tracking-wider shadow-sm whitespace-nowrap text-center">{status}</div>;
    }
  };

  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role !== 'SAFETY_ENGINEER') return null;

    return (
      <div className="flex flex-wrap gap-2 w-full mt-2 md:mt-0">
        {record.status === 'OPEN' && (
          <button 
            onClick={() => handleUpdateStatus(record.id, 'IN_PROGRESS')} 
            className="w-full md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border-2 border-amber-400 text-amber-500 hover:bg-amber-400 hover:text-white transition-all active:scale-95 whitespace-nowrap"
          >
            <SyncOutlined /> รับเรื่อง
          </button>
        )}
        {record.status === 'IN_PROGRESS' && (
          <button 
            onClick={() => handleUpdateStatus(record.id, 'RESOLVED')} 
            className="w-full md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <CheckCircleOutlined /> ปิดเคส
          </button>
        )}
      </div>
    );
  };

  const columns: ColumnsType<any> = [
    {
      title: 'วันที่ / เวลา',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120, // ลดความกว้างลงนิดนึงเพื่อเผื่อพื้นที่ให้คอลัมน์อื่น
      render: (text) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-slate-800">{dayjs(text).format('DD MMM YYYY')}</div>
          <div className="text-xs font-medium text-slate-400">{dayjs(text).format('HH:mm')} น.</div>
        </div>
      )
    },
    {
      title: 'ข้อมูลจุดเสี่ยง',
      key: 'details',
      // ไม่ต้องใส่ width ให้คอลัมน์นี้ขยายตามเนื้อที่ว่าง
      render: (_, record) => (
        <div className="flex flex-col gap-1.5 py-1 min-w-[250px]">
          <div className="font-extrabold text-slate-800 text-base leading-tight">{record.title}</div>
          <div className="mt-1 flex">{getTypeTag(record.type)}</div>
          <div className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">{record.description}</div>
          <div className="text-xs font-bold text-blue-600 mt-1 flex items-center bg-blue-50 w-fit px-2 py-0.5 rounded-md whitespace-nowrap">
            <UserOutlined className="mr-1.5" /> ผู้แจ้ง: {record.reporter?.full_name}
          </div>
        </div>
      )
    },
    {
      title: 'ข้อมูลแนบ',
      key: 'attachment',
      width: 110,
      render: (_, record) => (
        <div className="flex flex-col gap-2">
          {record.lat && record.lng ? (
            <a href={`https://maps.google.com/?q=${record.lat},${record.lng}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl border border-blue-100 transition-colors whitespace-nowrap">
              <PushpinOutlined /> แผนที่
            </a>
          ) : <span className="text-xs text-slate-300 text-center bg-slate-50 rounded-xl py-1.5">-</span>}
          
          {record.image_url ? (
            <a href={record.image_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-100 transition-colors whitespace-nowrap">
              <CameraOutlined /> รูปถ่าย
            </a>
          ) : <span className="text-xs text-slate-300 text-center bg-slate-50 rounded-xl py-1.5">-</span>}
        </div>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'จัดการ (สำหรับ จป.)',
      key: 'action',
      width: 140,
      render: (_, record) => <ActionButtons record={record} />
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto pb-20 animate-fade-in">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-4 mb-6 md:mb-8 px-2 md:px-0">
        <div className="bg-gradient-to-tr from-red-500 to-rose-600 w-14 h-14 flex items-center justify-center rounded-2xl shadow-lg shadow-red-500/30 text-white">
          <AlertOutlined className="text-3xl" />
        </div>
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">ระบบรายงานจุดเสี่ยง</h2>
          <p className="text-slate-500 text-sm md:text-base m-0 mt-1 font-medium">Incident Report & Safety Tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 px-2 md:px-0">
        
        {/* 📝 ส่วนที่ 1: ฟอร์มแจ้งเหตุ (ซ้าย) */}
        <div className="xl:col-span-5">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden xl:sticky xl:top-24">
            
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-6 md:p-8 border-b border-red-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500 opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
              <h3 className="text-xl font-black text-red-600 m-0 flex items-center gap-2 relative z-10">
                <ThunderboltOutlined className="text-2xl" /> พบจุดเสี่ยง แจ้งด่วน!
              </h3>
              <p className="text-sm font-medium text-red-400 m-0 mt-1 relative z-10">ข้อมูลจะถูกส่งตรงถึง จป. เพื่อดำเนินการแก้ไข</p>
            </div>
            
            <div className="p-6 md:p-8 bg-white">
              <Form form={form} layout="vertical" onFinish={handleReportIncident} requiredMark={false}>
                
                <Form.Item name="title" label={<span className="font-bold text-slate-700 text-sm">หัวข้อ / จุดที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุหัวข้อ' }]}>
                  <Input size="large" placeholder="เช่น นั่งร้านเอียง, สายไฟชำรุด, มีคราบน้ำมัน" className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white hover:bg-white h-12 text-base font-medium transition-all" />
                </Form.Item>
                
                <Form.Item name="type" label={<span className="font-bold text-slate-700 text-sm">ประเภทความเสี่ยง <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'เลือกประเภท' }]}>
                  <Select size="large" placeholder="ระบุประเภทของปัญหา" className="w-full h-12 [&_.ant-select-selector]:rounded-2xl [&_.ant-select-selector]:bg-slate-50 [&_.ant-select-selector]:border-slate-200">
                    <Select.Option value="NEAR_MISS"><span className="font-medium text-orange-600">⚠️ Near Miss (เกือบเกิดอุบัติเหตุ)</span></Select.Option>
                    <Select.Option value="UNSAFE_ACT"><span className="font-medium text-fuchsia-600">🚫 Unsafe Act (การกระทำที่ไม่ปลอดภัย)</span></Select.Option>
                    <Select.Option value="UNSAFE_CONDITION"><span className="font-medium text-amber-600">🏭 Unsafe Condition (สภาพแวดล้อมอันตราย)</span></Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="description" label={<span className="font-bold text-slate-700 text-sm">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]}>
                  <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดสิ่งที่พบเห็น เพื่อให้ทีมงานเข้าแก้ไขได้ถูกต้อง..." className="rounded-2xl border-slate-200 bg-slate-50 focus:bg-white hover:bg-white p-4 text-base font-medium transition-all resize-none" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {/* GPS Button */}
                  <div className="flex flex-col">
                    <label className="font-bold text-slate-700 text-sm mb-2">พิกัด GPS <span className="text-red-500">*</span></label>
                    <Button 
                      type={location.lat ? "primary" : "dashed"} 
                      onClick={getLocation} 
                      loading={isGettingLocation} 
                      icon={location.lat ? <CheckCircleOutlined /> : <EnvironmentOutlined />} 
                      className={`h-12 rounded-2xl border-2 font-bold w-full transition-all ${location.lat ? 'bg-emerald-500 border-emerald-500 hover:!bg-emerald-600 hover:!border-emerald-600 shadow-md shadow-emerald-500/20' : 'border-blue-200 text-blue-600 bg-blue-50 hover:!border-blue-400 hover:!text-blue-700'}`}
                    >
                      {location.lat ? 'พิกัดพร้อมแล้ว' : 'กดดึงพิกัด'}
                    </Button>
                    {location.lat && <span className="text-[10px] text-emerald-600 font-extrabold mt-2 text-center bg-emerald-50 rounded-lg py-1 px-2 border border-emerald-100">{location.lat.toFixed(4)}, {location.lng?.toFixed(4)}</span>}
                  </div>

                  {/* Upload Button */}
                  <div className="flex flex-col">
                    <label className="font-bold text-slate-700 text-sm mb-2">รูปถ่ายหลักฐาน</label>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                      <Button icon={<CameraOutlined />} className={`h-12 rounded-2xl border-2 w-full font-bold transition-all ${fileList.length > 0 ? 'border-purple-500 text-purple-600 bg-purple-50 hover:!border-purple-600' : 'border-slate-200 text-slate-500 bg-slate-50 hover:!border-slate-300 hover:!text-slate-600'}`}>
                        {fileList.length > 0 ? 'เลือกรูปแล้ว' : 'แนบรูปภาพ'}
                      </Button>
                    </Upload>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading} 
                  className="w-full h-14 rounded-2xl text-lg font-extrabold bg-red-500 hover:!bg-red-600 border-none shadow-xl shadow-red-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  <WarningOutlined className="text-xl" /> ส่งรายงานจุดเสี่ยง
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* 🚨 ส่วนที่ 2: กระดานติดตามจุดเสี่ยง (ขวา/ล่าง) */}
        <div className="xl:col-span-7">
          <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-full flex flex-col">
            
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg md:text-xl font-black text-slate-800 m-0 flex items-center gap-3">
                <HistoryOutlined className="text-blue-500 text-2xl" /> 
                กระดานติดตาม (Tracking Board)
              </h3>
              <div className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap tracking-wider">
                {incidents.length} รายการ
              </div>
            </div>

            <div className="p-4 md:p-6 flex-1 bg-slate-50/30">
              {/* 🚀 Desktop View: Table */}
              {!isMobile && (
                <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <Table 
                    columns={columns} 
                    dataSource={incidents} 
                    loading={isLoading && incidents.length === 0} 
                    pagination={{ pageSize: 6 }} 
                    rowKey="id" 
                    className="modern-table"
                    scroll={{ x: 900 }} // 🟢 ไฮไลท์การแก้ RWD: ถ้าจอแคบกว่า 900px ให้มีสกอร์บาร์แนวนอน ป้องกันตารางบีบจนเละ
                  />
                </div>
              )}

              {/* 🚀 Mobile View: Card List (Modern Feed Style) */}
              {isMobile && (
                <div className="space-y-5">
                  {incidents.length > 0 ? incidents.map((item) => (
                    <div key={item.id} className="bg-white rounded-[1.5rem] border border-slate-100 p-5 shadow-md shadow-slate-200/50 relative overflow-hidden transition-all hover:shadow-lg">
                      {/* ขีดสีบอกสถานะ */}
                      <div className={`absolute top-0 left-0 w-2 h-full ${item.status === 'RESOLVED' ? 'bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                      
                      <div className="pl-3">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                              <UserOutlined className="text-slate-400 text-lg" />
                            </div>
                            <div>
                              <p className="text-sm font-black text-slate-800 m-0 leading-tight">{item.reporter?.full_name}</p>
                              <p className="text-[10px] font-bold text-slate-400 m-0 uppercase tracking-wider">{dayjs(item.created_at).fromNow()}</p>
                            </div>
                          </div>
                          <div>{getStatusBadge(item.status)}</div>
                        </div>

                        {/* Content */}
                        <h4 className="text-lg font-extrabold text-slate-800 mb-2 leading-snug">{item.title}</h4>
                        <div className="mb-3">{getTypeTag(item.type)}</div>
                        <p className="text-sm font-medium text-slate-600 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">{item.description}</p>

                        {/* Footer / Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                          <div className="flex gap-2">
                            {item.lat && (
                              <a href={`https://maps.google.com/?q=${item.lat},${item.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-bold border border-blue-100 hover:bg-blue-100 transition-colors">
                                <PushpinOutlined /> แผนที่
                              </a>
                            )}
                            {item.image_url && (
                              <a href={item.image_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-bold border border-purple-100 hover:bg-purple-100 transition-colors">
                                <CameraOutlined /> รูปถ่าย
                              </a>
                            )}
                          </div>
                          
                          {/* ปุ่มของ จป. */}
                          <ActionButtons record={item} />
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200">
                      <CheckCircleOutlined className="text-6xl text-emerald-400 mb-4 opacity-50" />
                      <p className="font-extrabold text-xl text-slate-800 m-0">พื้นที่ปลอดภัย</p>
                      <p className="font-medium text-slate-400 mt-1">ยังไม่มีการรายงานจุดเสี่ยงในระบบ</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom Table Styling for Modern Look */
        .modern-table .ant-table {
          background: transparent;
        }
        .modern-table .ant-table-thead > tr > th {
          background-color: transparent;
          color: #64748b;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #f1f5f9;
        }
        .modern-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px 12px;
        }
        .modern-table .ant-table-tbody > tr:hover > td {
          background-color: #f8fafc;
        }
      `}</style>
    </div>
  );
}