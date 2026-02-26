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

  // --- UI Helpers ---
  const getTypeTag = (type: string) => {
    switch(type) {
      case 'NEAR_MISS': return <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-xs font-bold border border-orange-200"><AlertOutlined className="mr-1"/> Near Miss (เกือบเกิดอุบัติเหตุ)</span>;
      case 'UNSAFE_ACT': return <span className="bg-fuchsia-100 text-fuchsia-600 px-2 py-1 rounded-md text-xs font-bold border border-fuchsia-200"><WarningOutlined className="mr-1"/> Unsafe Act (การกระทำ)</span>;
      case 'UNSAFE_CONDITION': return <span className="bg-amber-100 text-amber-600 px-2 py-1 rounded-md text-xs font-bold border border-amber-200"><WarningOutlined className="mr-1"/> Unsafe Condition (สภาพแวดล้อม)</span>;
      default: return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs font-bold">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <div className="bg-red-500 text-white px-2 py-1 rounded-md font-bold text-[10px] md:text-xs uppercase">รอแก้ไข (OPEN)</div>;
      case 'IN_PROGRESS': return <div className="bg-amber-400 text-white px-2 py-1 rounded-md font-bold text-[10px] md:text-xs uppercase">กำลังแก้</div>;
      case 'RESOLVED': return <div className="bg-emerald-500 text-white px-2 py-1 rounded-md font-bold text-[10px] md:text-xs uppercase">เสร็จแล้ว</div>;
      default: return <div className="bg-gray-500 text-white px-2 py-1 rounded-md font-bold text-[10px] md:text-xs uppercase">{status}</div>;
    }
  };

  const ActionButtons = ({ record }: { record: any }) => {
    if (currentUser?.role !== 'SAFETY_ENGINEER') return null;

    return (
      <div className="flex gap-2 w-full mt-2 md:mt-0">
        {record.status === 'OPEN' && (
          <button onClick={() => handleUpdateStatus(record.id, 'IN_PROGRESS')} className="btn btn-sm btn-outline btn-warning rounded-full flex-1 md:flex-none">
            <SyncOutlined /> รับเรื่อง
          </button>
        )}
        {record.status === 'IN_PROGRESS' && (
          <button onClick={() => handleUpdateStatus(record.id, 'RESOLVED')} className="btn btn-sm btn-success text-white rounded-full flex-1 md:flex-none shadow-md shadow-green-500/30">
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
      width: 140,
      render: (text) => (
        <div>
          <div className="font-bold text-slate-800">{dayjs(text).format('DD MMM YYYY')}</div>
          <div className="text-xs text-slate-400">{dayjs(text).format('HH:mm')} น.</div>
        </div>
      )
    },
    {
      title: 'ข้อมูลจุดเสี่ยง',
      key: 'details',
      render: (_, record) => (
        <div className="flex flex-col gap-1.5">
          <div className="font-bold text-slate-800 text-base">{record.title}</div>
          <div>{getTypeTag(record.type)}</div>
          <div className="text-sm text-slate-500 line-clamp-2 mt-1">{record.description}</div>
          <div className="text-xs font-semibold text-blue-600 mt-1">
            <UserOutlined className="mr-1" /> ผู้แจ้ง: {record.reporter?.full_name}
          </div>
        </div>
      )
    },
    {
      title: 'ข้อมูลแนบ',
      key: 'attachment',
      width: 120,
      render: (_, record) => (
        <div className="flex flex-col gap-2">
          {record.lat && record.lng ? (
            <a href={`https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-md text-center border border-blue-100 transition-colors">
              <PushpinOutlined /> แผนที่
            </a>
          ) : <span className="text-xs text-slate-300 text-center">-</span>}
          
          {record.image_url ? (
            <a href={record.image_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-purple-500 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-md text-center border border-purple-100 transition-colors">
              <CameraOutlined /> รูปถ่าย
            </a>
          ) : <span className="text-xs text-slate-300 text-center">-</span>}
        </div>
      )
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => getStatusBadge(status)
    },
    {
      title: 'จัดการ (สำหรับ จป.)',
      key: 'action',
      width: 150,
      render: (_, record) => <ActionButtons record={record} />
    }
  ];

  return (
    <div className="w-full pb-20 px-2 md:px-0">
      
      {/* 🚀 Header */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-tr from-red-500 to-rose-600 p-3 md:p-4 rounded-2xl shadow-lg shadow-red-500/30 text-white">
          <AlertOutlined className="text-2xl md:text-3xl" />
        </div>
        <div>
          <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 m-0 tracking-tight">ระบบรายงานจุดเสี่ยง</h2>
          <p className="text-slate-500 text-xs md:text-sm m-0 mt-1">Incident Report & Safety Tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
        
        {/* 📝 ส่วนที่ 1: ฟอร์มแจ้งเหตุ (ซ้าย) */}
        <div className="xl:col-span-5">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 p-5 md:p-6 border-b border-red-100">
              <h3 className="text-lg font-bold text-red-600 m-0 flex items-center gap-2">
                <ThunderboltOutlined /> พบจุดเสี่ยง แจ้งด่วน!
              </h3>
              <p className="text-xs text-red-400 m-0 mt-1">ข้อมูลจะถูกส่งตรงถึง จป. เพื่อดำเนินการแก้ไข</p>
            </div>
            
            <div className="p-5 md:p-6 bg-white">
              <Form form={form} layout="vertical" onFinish={handleReportIncident} requiredMark={false}>
                
                <Form.Item name="title" label={<span className="font-bold text-slate-700">หัวข้อ / จุดที่พบเห็น <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุหัวข้อ' }]}>
                  <Input size="large" placeholder="เช่น นั่งร้านเอียง, สายไฟชำรุด, มีคราบน้ำมัน" className="rounded-xl border-slate-300" />
                </Form.Item>
                
                <Form.Item name="type" label={<span className="font-bold text-slate-700">ประเภทความเสี่ยง <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'เลือกประเภท' }]}>
                  <Select size="large" placeholder="ระบุประเภทของปัญหา" className="w-full">
                    <Select.Option value="NEAR_MISS">⚠️ Near Miss (เกือบเกิดอุบัติเหตุ)</Select.Option>
                    <Select.Option value="UNSAFE_ACT">🚫 Unsafe Act (การกระทำที่ไม่ปลอดภัย)</Select.Option>
                    <Select.Option value="UNSAFE_CONDITION">🏭 Unsafe Condition (สภาพแวดล้อมอันตราย)</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item name="description" label={<span className="font-bold text-slate-700">รายละเอียดเพิ่มเติม <span className="text-red-500">*</span></span>} rules={[{ required: true, message: 'กรุณาระบุรายละเอียด' }]}>
                  <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดสิ่งที่พบเห็น เพื่อให้ทีมงานเข้าแก้ไขได้ถูกต้อง..." className="rounded-xl border-slate-300" />
                </Form.Item>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* GPS Button */}
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-bold text-slate-700">พิกัด GPS <span className="text-red-500">*</span></span></label>
                    <Button 
                      type={location.lat ? "primary" : "dashed"} 
                      onClick={getLocation} 
                      loading={isGettingLocation} 
                      icon={location.lat ? <CheckCircleOutlined /> : <EnvironmentOutlined />} 
                      className={`h-12 rounded-xl border-2 font-bold w-full ${location.lat ? 'bg-emerald-500 border-emerald-500 hover:bg-emerald-600' : 'border-blue-300 text-blue-600 hover:border-blue-400 hover:text-blue-700'}`}
                    >
                      {location.lat ? 'พิกัดพร้อมแล้ว' : 'กดดึงพิกัด'}
                    </Button>
                    {location.lat && <span className="text-[10px] text-emerald-600 font-bold mt-1 text-center bg-emerald-50 rounded-md py-0.5">{location.lat.toFixed(3)}, {location.lng?.toFixed(3)}</span>}
                  </div>

                  {/* Upload Button */}
                  <div className="form-control w-full">
                    <label className="label py-1"><span className="label-text font-bold text-slate-700">รูปถ่ายหลักฐาน</span></label>
                    <Upload beforeUpload={() => false} maxCount={1} fileList={fileList} onChange={(info) => setFileList(info.fileList)}>
                      <Button icon={<CameraOutlined />} className="h-12 rounded-xl border-2 border-slate-300 text-slate-600 hover:border-slate-400 w-full font-bold">
                        {fileList.length > 0 ? 'เลือกรูปแล้ว' : 'แนบรูปภาพ'}
                      </Button>
                    </Upload>
                  </div>
                </div>

                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={isLoading} 
                  className="w-full h-14 rounded-2xl text-lg font-bold bg-red-500 hover:!bg-red-600 border-none shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                >
                  <WarningOutlined /> ส่งรายงานจุดเสี่ยง
                </Button>
              </Form>
            </div>
          </div>
        </div>

        {/* 🚨 ส่วนที่ 2: กระดานติดตามจุดเสี่ยง (ขวา/ล่าง) */}
        <div className="xl:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
            
            {/* ✅ แก้ไขจุดที่บัค (เปลี่ยนคลาสของตัวนับรายการให้เป็น Tailwind แบบชัวร์ๆ) */}
            <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base md:text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
                <HistoryOutlined className="text-blue-500" /> กระดานติดตาม (Tracking Board)
              </h3>
              {/* เปลี่ยนจาก badge daisyUI เป็น Tailwind เพียวๆ เพื่อแก้ปัญหากล่องดำ */}
              <div className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                {incidents.length} รายการ
              </div>
            </div>

            <div className="p-4 flex-1">
              {/* 🚀 Desktop View: Table */}
              {!isMobile && (
                <Table 
                  columns={columns} 
                  dataSource={incidents} 
                  loading={isLoading && incidents.length === 0} 
                  pagination={{ pageSize: 5 }} 
                  rowKey="id" 
                  className="modern-table"
                />
              )}

              {/* 🚀 Mobile View: Card List (Facebook Feed Style) */}
              {isMobile && (
                <div className="space-y-4">
                  {incidents.length > 0 ? incidents.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
                      {/* ขีดสีบอกสถานะ */}
                      <div className={`absolute top-0 left-0 w-1.5 h-full ${item.status === 'RESOLVED' ? 'bg-emerald-500' : item.status === 'IN_PROGRESS' ? 'bg-amber-400' : 'bg-red-500'}`}></div>
                      
                      <div className="pl-2">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <Avatar icon={<UserOutlined />} className="bg-slate-200 text-slate-500" />
                            <div>
                              <p className="text-sm font-bold text-slate-800 m-0">{item.reporter?.full_name}</p>
                              <p className="text-[10px] text-slate-400 m-0">{dayjs(item.created_at).fromNow()}</p>
                            </div>
                          </div>
                          <div>{getStatusBadge(item.status)}</div>
                        </div>

                        {/* Content */}
                        <h4 className="text-base font-bold text-slate-800 mb-1">{item.title}</h4>
                        <div className="mb-2">{getTypeTag(item.type)}</div>
                        <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">{item.description}</p>

                        {/* Footer / Actions */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                          <div className="flex gap-2">
                            {item.lat && (
                              <a href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline border-slate-300 text-slate-600 hover:bg-slate-100">
                                <PushpinOutlined /> แผนที่
                              </a>
                            )}
                            {item.image_url && (
                              <a href={item.image_url} target="_blank" rel="noreferrer" className="btn btn-xs btn-outline border-slate-300 text-slate-600 hover:bg-slate-100">
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
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <CheckCircleOutlined className="text-5xl text-emerald-400 mb-3 opacity-50" />
                      <p className="font-medium text-lg">พื้นที่ปลอดภัย ไม่มีจุดเสี่ยง</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        /* Custom Table Styling for Modern Look */
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