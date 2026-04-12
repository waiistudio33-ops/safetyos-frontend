import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Table, Tag, Button, Input, DatePicker, Select, Row, Col, Avatar, Empty, message, Grid } from 'antd';
import { 
  SearchOutlined, FilterOutlined, CheckCircleOutlined, 
  WarningOutlined, EnvironmentOutlined, UserOutlined, SafetyCertificateOutlined,
  ThunderboltOutlined, InfoCircleOutlined, PictureOutlined, TeamOutlined, IdcardOutlined,
  SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;
const API_URL = import.meta.env.VITE_API_URL || 'https://safetyos-backend.onrender.com';

export default function BBSObservationHistory() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBBSHistory();
  }, []);

  const fetchBBSHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/bbs`, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      
      if (res.data) {
        setObservations(res.data);
      }
    } catch (error) {
      console.error("ดึงข้อมูล BBS ล้มเหลว", error);
      message.error('ไม่สามารถโหลดประวัติการสังเกตการณ์ได้');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'PPE': 'อุปกรณ์ป้องกัน (PPE)',
      'TOOLS': 'เครื่องมือ/อุปกรณ์',
      'POSTURE': 'ท่าทางการทำงาน',
      'HOUSEKEEPING': 'ความสะอาด (5ส)',
      'LINE_OF_FIRE': 'แนวรัศมีอันตราย',
      'PROCEDURE': 'ขั้นตอนการทำงาน'
    };
    return categories[category] || category;
  };

  const columns = [
    {
      title: 'เวลา',
      dataIndex: 'date',
      key: 'date',
      width: isMobile ? 100 : 130,
      render: (date: string) => (
        <div className="font-bold text-slate-600 text-[11px] md:text-xs">
          <div className="text-slate-800">{dayjs(date).format('DD/MM/YY')}</div>
          <div className="text-slate-400 mt-0.5">{dayjs(date).format('HH:mm')}</div>
        </div>
      ),
    },
    {
      title: 'พื้นที่สังเกต',
      key: 'location_group',
      width: isMobile ? 150 : 200,
      render: (_, record: any) => (
        <div className="flex flex-col gap-1 md:gap-1.5">
          <div className="flex items-start gap-1 md:gap-1.5 font-bold text-slate-700 text-[11px] md:text-[13px] leading-tight break-words">
            <EnvironmentOutlined className="text-blue-500 mt-0.5 shrink-0" /> <span className="line-clamp-2">{record.location}</span>
          </div>
          <div>
            {record.observed_group === 'CONTRACTOR' ? (
              <Tag icon={<TeamOutlined />} color="orange" className="border-orange-200 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-bold m-0">ผู้รับเหมา</Tag>
            ) : (
              <Tag icon={<IdcardOutlined />} color="blue" className="border-blue-200 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-bold m-0">พนักงาน</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      width: 160,
      responsive: ['md'] as any, 
      render: (category: string) => (
        <div className="font-bold text-slate-700 text-xs bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg inline-block">
          {getCategoryLabel(category)}
        </div>
      ),
    },
    {
      title: 'ประเภท',
      dataIndex: 'behavior_type',
      key: 'behavior_type',
      width: isMobile ? 110 : 140,
      render: (type: string) => (
        type === 'SAFE' ? (
          <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap">
            <CheckCircleOutlined /> <span className="hidden sm:inline">ปลอดภัย</span> <span className="sm:hidden">Safe</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-sm whitespace-nowrap animate-pulse">
            <WarningOutlined /> <span className="hidden sm:inline">พฤติกรรมเสี่ยง</span> <span className="sm:hidden">Unsafe</span>
          </span>
        )
      ),
    },
    {
      title: 'ผู้รายงาน',
      key: 'observer',
      width: 160,
      responsive: ['lg'] as any, 
      render: (_, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar src={record.observer?.profile_url} size="small" icon={<UserOutlined />} className="bg-slate-200 text-slate-500 shrink-0" />
          <span className="font-bold text-slate-600 text-xs truncate max-w-[100px]">{record.observer?.full_name || 'ไม่ระบุชื่อ'}</span>
        </div>
      ),
    }
  ];

  return (
    <div className="h-full flex flex-col relative">
      
      {/* =========================================================
          🖥️ หน้าจอแอปพลิเคชันปกติ
          ========================================================= */}
      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-50 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] p-3 md:p-6 flex flex-col flex-1 overflow-hidden app-ui-container">
        
        {/* 🔍 Header & Filters */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-5">
            <div>
              <h2 className="text-lg md:text-2xl font-black text-slate-800 m-0 flex items-center gap-2">
                <SafetyCertificateOutlined className="text-emerald-500" /> ประวัติ BBS
              </h2>
              <p className="text-[10px] md:text-sm text-slate-500 m-0 mt-0.5 md:mt-1 font-medium">BBS Observation History</p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button 
                type="default" 
                icon={<SyncOutlined className={loading ? "animate-spin" : ""} />} 
                onClick={fetchBBSHistory}
                className="rounded-xl h-8 md:h-10 text-xs md:text-sm font-bold bg-slate-50 border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300"
              >
                {isMobile ? '' : 'รีเฟรช'}
              </Button>
            </div>
          </div>

          <div className="bg-slate-50/80 p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-100/80">
            <div className="font-bold text-slate-500 text-[10px] md:text-xs flex items-center gap-1.5 mb-2 md:mb-0 md:mr-3 md:inline-flex">
              <FilterOutlined /> คัดกรองข้อมูล:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3 md:inline-grid md:w-[calc(100%-100px)] align-middle">
              <Input placeholder="ค้นหาพื้นที่..." prefix={<SearchOutlined className="text-slate-400" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full rounded-lg md:rounded-xl font-medium text-xs md:text-sm" />
              <Select placeholder="ประเภทพฤติกรรม" allowClear className="w-full font-medium custom-select-sm md:custom-select-md" onChange={setFilterType}>
                <Select.Option value="SAFE">พฤติกรรมปลอดภัย</Select.Option>
                <Select.Option value="UNSAFE">พฤติกรรมเสี่ยง</Select.Option>
              </Select>
              <RangePicker className="w-full rounded-lg md:rounded-xl font-medium text-xs md:text-sm lg:col-span-2" format="DD/MM/YYYY" />
            </div>
          </div>
        </div>

        {/* 📊 ตารางหลัก */}
        <div className="flex-1 overflow-hidden">
          <Table 
            columns={columns} 
            dataSource={observations.filter((obs: any) => 
              (filterType ? obs.behavior_type === filterType : true) &&
              (obs.location?.toLowerCase().includes(searchText.toLowerCase()))
            )} 
            loading={loading}
            rowKey="id"
            size={isMobile ? "small" : "middle"} 
            scroll={{ x: 500 }} 
            pagination={{ pageSize: 10, className: "px-2 md:px-4", size: isMobile ? "small" : "default" }}
            className="modern-expanded-table"
            expandedRowKeys={expandedRowKeys}
            onExpand={(expanded, record) => {
              if (expanded) setExpandedRowKeys([...expandedRowKeys, record.id]);
              else setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.id));
            }}
            locale={{ emptyText: <Empty description={<span className="text-slate-400 font-bold text-xs">ยังไม่มีประวัติ BBS</span>} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            expandable={{
              expandedRowRender: (record) => (
                <div className="p-4 md:p-8 bg-[#f8fafc] rounded-xl md:rounded-[2rem] border border-slate-200/60 m-1 md:m-4 shadow-inner animate-fade-in origin-top">
                  <h4 className="text-[11px] md:text-sm font-black text-slate-800 mb-3 md:mb-5 flex flex-wrap items-center gap-1.5 md:gap-2 border-b border-slate-200 pb-2 md:pb-3">
                    <InfoCircleOutlined className="text-blue-500" /> 
                    <span>รายละเอียด</span> 
                    <span className="text-slate-400 font-normal">| Ref: BBS-{record.id?.substring(0,6)}</span>
                  </h4>
                  
                  <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                      <div className="flex flex-col gap-3 md:gap-4">
                        <div>
                          <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest">รายละเอียดสิ่งที่พบเห็น</span>
                          <div className="mt-1 md:mt-1.5 bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 text-[11px] md:text-sm font-bold text-slate-700 whitespace-pre-wrap shadow-sm leading-relaxed">
                            {record.description || '-'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 bg-white p-2.5 md:p-3.5 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                          <div className="bg-blue-50 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                            <CheckCircleOutlined className="text-base md:text-lg" />
                          </div>
                          <div>
                            <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">การตอบสนอง (Action)</span>
                            <span className="text-xs md:text-sm font-extrabold text-blue-700">{record.action_taken || 'ตักเตือน/แนะนำ'}</span>
                          </div>
                        </div>
                        {record.photos && record.photos.length > 0 && (
                          <div className="mt-1">
                             <span className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 mb-1.5 md:mb-2"><PictureOutlined /> ภาพถ่าย (Evidence)</span>
                             <div className="flex flex-wrap gap-2 md:gap-3">
                               {record.photos.map((url: string, index: number) => (
                                 <div key={index} className="w-16 h-16 md:w-24 md:h-24 rounded-lg md:rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                                   <img src={url} alt="BBS Evidence" className="w-full h-full object-cover" />
                                 </div>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                    </Col>
                    <Col xs={24} lg={12}>
                      {record.behavior_type === 'UNSAFE' ? (
                        <div className="bg-rose-50/50 p-4 md:p-5 rounded-xl md:rounded-[1.5rem] border border-rose-100 h-full relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-rose-500"></div>
                          <h4 className="font-black text-rose-700 text-xs md:text-sm mb-3 md:mb-4 flex items-center gap-1.5 md:gap-2">
                            <ThunderboltOutlined /> วิเคราะห์สาเหตุรากเหง้า (Root Cause)
                          </h4>
                          <div className="flex flex-col gap-3 md:gap-4 pl-1 md:pl-2">
                            <div>
                              <span className="text-[9px] md:text-[10px] text-rose-400 font-black uppercase tracking-widest">สาเหตุหลัก</span>
                              <div className="mt-1 bg-white px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg md:rounded-xl border border-rose-200 text-[11px] md:text-sm font-bold text-rose-600 inline-block shadow-sm">
                                {record.root_cause || 'ไม่ได้ระบุสาเหตุ'}
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] md:text-[10px] text-rose-400 font-black uppercase tracking-widest">ข้อเสนอแนะเพื่อป้องกัน</span>
                              <div className="mt-1 bg-white p-3 md:p-3.5 rounded-xl border border-rose-200 text-[11px] md:text-sm font-bold text-slate-700 whitespace-pre-wrap shadow-sm leading-relaxed">
                                {record.suggestion || 'ไม่มีข้อเสนอแนะเพิ่มเติม'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50/50 flex flex-col items-center justify-center h-full rounded-xl md:rounded-[1.5rem] border border-emerald-100 border-dashed p-4 md:p-6 text-center min-h-[150px] md:min-h-[200px]">
                          <SafetyCertificateOutlined className="text-3xl md:text-4xl text-emerald-300 mb-2 md:mb-3" />
                          <span className="font-bold text-emerald-600 text-xs md:text-sm leading-relaxed">พฤติกรรมปลอดภัย<br/>ขอบคุณที่ช่วยกันดูแลความปลอดภัยครับ</span>
                        </div>
                      )}
                    </Col>
                  </Row>
                </div>
              )
            }}
          />
        </div>
      </div>

      {/* 🎨 CSS พื้นฐาน */}
      <style>{`
        .custom-select-sm .ant-select-selector { border-radius: 8px !important; }
        .custom-select-md .ant-select-selector { border-radius: 12px !important; }
        .modern-expanded-table .ant-table { background: transparent !important; }
        .modern-expanded-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding: 12px 16px; }
        @media (min-width: 768px) { .modern-expanded-table .ant-table-thead > tr > th { font-size: 11px; padding: 16px 24px; } }
        .modern-expanded-table .ant-table-tbody > tr > td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9; }
        @media (min-width: 768px) { .modern-expanded-table .ant-table-tbody > tr > td { padding: 16px 24px; } }
        .modern-expanded-table .ant-table-tbody > tr:hover > td { background: #fdfdfd !important; }
        .modern-expanded-table .ant-table-expanded-row > td { background: #ffffff !important; padding: 0 !important; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
}