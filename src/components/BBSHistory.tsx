import React, { useState, useRef } from 'react';
import { Table, Tag, Button, Input, DatePicker, Select, Row, Col, Avatar, Tooltip } from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined, 
  PrinterOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  EnvironmentOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  PictureOutlined,
  TeamOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function BBSObservationHistory({ observations = [], loading = false }: any) {
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  const getBehaviorTag = (type: string) => {
    if (type === 'SAFE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap">
          <CheckCircleOutlined /> ปลอดภัย (Safe)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-600 border border-rose-200 shadow-sm whitespace-nowrap animate-pulse">
        <WarningOutlined /> เสี่ยง (At-Risk)
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'PPE': 'อุปกรณ์ป้องกันภัย (PPE)',
      'TOOLS': 'เครื่องมือ/อุปกรณ์',
      'POSTURE': 'ท่าทางการทำงาน',
      'HOUSEKEEPING': 'ความสะอาด (Housekeeping)',
      'LINE_OF_FIRE': 'แนวรัศมีอันตราย',
      'PROCEDURE': 'ขั้นตอนการทำงาน'
    };
    return categories[category] || category;
  };

  // 🟢 ฟังก์ชันสำหรับสั่งพิมพ์เฉพาะแถว (Individual Print)
  const handlePrintRow = (record: any) => {
    // 1. บังคับให้แถวนี้กางออกก่อน เพื่อให้ DOM เรนเดอร์ข้อมูลข้างใน
    setExpandedRowKeys([record.id]);
    
    // 2. ให้หน่วงเวลาเล็กน้อยเพื่อให้ React ขยายแถวเสร็จ แล้วค่อยสั่งพิมพ์
    setTimeout(() => {
      // แปะคลาสชั่วคราวเพื่อบอก CSS ว่าเรากำลังพิมพ์รายการเดี่ยว
      document.body.classList.add('print-single-row');
      // กำหนด ID ให้แถวที่ถูกเลือก เพื่อให้ CSS เลือกแสดงเฉพาะแถวนี้
      document.body.setAttribute('data-print-id', record.id);
      
      window.print();
      
      // ล้างค่าหลังจากพิมพ์เสร็จ
      document.body.classList.remove('print-single-row');
      document.body.removeAttribute('data-print-id');
    }, 300);
  };

  const columns = [
    {
      title: 'วันที่และเวลา',
      dataIndex: 'date',
      key: 'date',
      width: 150,
      render: (date: string) => (
        <div className="font-bold text-slate-600 text-xs">
          <div className="text-slate-800">{dayjs(date).format('DD/MM/YYYY')}</div>
          <div className="text-slate-400 mt-0.5">{dayjs(date).format('HH:mm น.')}</div>
        </div>
      ),
    },
    {
      title: 'พื้นที่ / กลุ่มที่สังเกต',
      key: 'location_group',
      width: 200,
      render: (_, record: any) => (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-1.5 font-bold text-slate-700 text-[13px] leading-tight">
            <EnvironmentOutlined className="text-blue-500 mt-0.5" /> {record.location}
          </div>
          <div>
            {record.observed_group === 'CONTRACTOR' ? (
              <Tag icon={<TeamOutlined />} color="orange" className="border-orange-200 rounded-lg text-[10px] font-bold m-0">ผู้รับเหมา</Tag>
            ) : (
              <Tag icon={<IdcardOutlined />} color="blue" className="border-blue-200 rounded-lg text-[10px] font-bold m-0">พนักงาน</Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'หมวดหมู่พฤติกรรม',
      dataIndex: 'category',
      key: 'category',
      width: 180,
      render: (category: string) => (
        <div className="font-bold text-slate-700 text-xs bg-slate-50 border border-slate-100 px-2.5 py-1.5 rounded-lg inline-block">
          {getCategoryLabel(category)}
        </div>
      ),
    },
    {
      title: 'ประเภท (Behavior)',
      dataIndex: 'behavior_type',
      key: 'behavior_type',
      width: 150,
      render: (type: string) => getBehaviorTag(type),
    },
    {
      title: 'ผู้สังเกตการณ์',
      key: 'observer',
      width: 180,
      render: (_, record: any) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" icon={<UserOutlined />} className="bg-slate-200 text-slate-500" />
          <span className="font-bold text-slate-600 text-xs truncate">{record.observer?.full_name || 'ไม่ระบุชื่อ'}</span>
        </div>
      ),
    },
    {
      title: '', // 🟢 คอลัมน์ Action สำหรับปุ่มพิมพ์รายบุคคล
      key: 'action',
      width: 80,
      render: (_, record: any) => (
        <Tooltip title="พิมพ์หน้านี้ (PDF)">
          <Button 
            type="text" 
            icon={<PrinterOutlined className="text-slate-400 hover:text-blue-500 text-lg" />} 
            onClick={() => handlePrintRow(record)}
            className="hover:bg-blue-50 transition-colors"
          />
        </Tooltip>
      ),
    }
  ];

  // จำลองข้อมูลถ้าไม่มี (เอาไว้ดู UI ตอนแรก)
  const mockObservations = [
    {
      id: '1',
      date: new Date().toISOString(),
      location: 'โซนถังเก็บสารเคมี A',
      observed_group: 'CONTRACTOR',
      category: 'PPE',
      behavior_type: 'UNSAFE',
      action_taken: 'แนะนำ/แก้ไขทันที',
      description: 'ผู้รับเหมาไม่สวมแว่นตานิรภัยขณะปฏิบัติงานใกล้จุดที่มีไอระเหย',
      root_cause: 'รีบเร่ง / ต้องการประหยัดเวลา',
      suggestion: 'ย้ำเตือนผู้คุมงานผู้รับเหมาให้ตรวจ PPE ก่อนเริ่มงานทุกครั้ง และชี้แจงอันตรายเพิ่มเติม',
      observer: { full_name: 'คุณวิศวกร จป.' }
    },
    {
      id: '2',
      date: new Date(Date.now() - 86400000).toISOString(),
      location: 'พื้นที่ซ่อมบำรุง (Workshop)',
      observed_group: 'EMPLOYEE',
      category: 'HOUSEKEEPING',
      behavior_type: 'SAFE',
      action_taken: 'กล่าวชื่นชม',
      description: 'พนักงานจัดเก็บเครื่องมือเข้าตู้เรียบร้อยหลังใช้งานเสร็จ พื้นที่สะอาดไม่มีคราบน้ำมัน',
      observer: { full_name: 'คุณวิศวกร จป.' }
    }
  ];

  const displayData = observations.length > 0 ? observations : mockObservations;

  return (
    <div ref={printRef} className="bg-white rounded-[2.5rem] border border-slate-50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] overflow-hidden p-4 md:p-6 flex flex-col h-full bbs-history-container">
      
      {/* 🔍 ส่วน Header & Filters */}
      <div className="mb-6 hide-on-print-single">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-800 m-0 flex items-center gap-2">
              <SafetyCertificateOutlined className="text-emerald-500" /> ทะเบียนประวัติ BBS
            </h2>
            <p className="text-xs md:text-sm text-slate-500 m-0 mt-1 font-medium">BBS Observation History</p>
          </div>
          
          <Button 
            type="primary" 
            icon={<PrinterOutlined />} 
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-900 border-none font-bold rounded-xl h-10 shadow-md"
          >
            พิมพ์รายงานทั้งหมด (PDF)
          </Button>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-wrap gap-3 items-center">
          <div className="font-bold text-slate-500 text-xs flex items-center gap-1.5 mr-2">
            <FilterOutlined /> คัดกรองข้อมูล:
          </div>
          <Input 
            placeholder="ค้นหาพื้นที่..." 
            prefix={<SearchOutlined className="text-slate-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-48 rounded-xl font-medium"
          />
          <Select 
            placeholder="ประเภทพฤติกรรม" 
            allowClear 
            className="w-full md:w-40 font-medium"
            onChange={setFilterType}
          >
            <Select.Option value="SAFE">พฤติกรรมปลอดภัย</Select.Option>
            <Select.Option value="UNSAFE">พฤติกรรมเสี่ยง</Select.Option>
          </Select>
          <RangePicker className="w-full md:w-64 rounded-xl font-medium" format="DD/MM/YYYY" />
        </div>
      </div>

      {/* 📊 ส่วนตารางหลัก */}
      <div className="flex-1 overflow-hidden print-table-container">
        <Table 
          columns={columns} 
          dataSource={displayData.filter((obs: any) => 
            (filterType ? obs.behavior_type === filterType : true) &&
            (obs.location?.toLowerCase().includes(searchText.toLowerCase()))
          )} 
          loading={loading}
          rowKey="id"
          size="middle"
          scroll={{ x: 800 }}
          pagination={{ pageSize: 10, className: "px-4 hide-on-print-single" }}
          className="modern-expanded-table"
          expandedRowKeys={expandedRowKeys}
          onExpand={(expanded, record) => {
            if (expanded) {
              setExpandedRowKeys([...expandedRowKeys, record.id]);
            } else {
              setExpandedRowKeys(expandedRowKeys.filter(k => k !== record.id));
            }
          }}
          rowClassName={(record) => `printable-row printable-row-${record.id}`} // 🟢 ใส่ Class สำหรับชี้เป้าเวลา Print
          expandable={{
            expandedRowRender: (record) => (
              <div className="p-5 md:p-8 bg-[#f8fafc] rounded-2xl md:rounded-[2rem] border border-slate-200/60 m-2 md:m-4 shadow-inner animate-fade-in origin-top expanded-details-box">
                <h4 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2 border-b border-slate-200 pb-3">
                  <InfoCircleOutlined className="text-blue-500" /> รายละเอียดการสังเกตการณ์ (Observation Details) - Ref: BBS-{record.id.substring(0,6)}
                </h4>
                
                <Row gutter={[32, 24]}>
                  {/* ซ้าย: ข้อมูลพฤติกรรม */}
                  <Col xs={24} md={12}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">รายละเอียดสิ่งที่พบเห็น</span>
                        <div className="mt-1.5 bg-white p-4 rounded-2xl border border-slate-200 text-sm font-bold text-slate-700 whitespace-pre-wrap shadow-sm">
                          {record.description || '-'}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                          <CheckCircleOutlined className="text-lg" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-0.5">การตอบสนอง (Action Taken)</span>
                          <span className="text-sm font-extrabold text-blue-700">{record.action_taken || 'ตักเตือน/แนะนำ'}</span>
                        </div>
                      </div>

                      {record.photos && record.photos.length > 0 && (
                        <div className="print-avoid-break">
                           <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1 mb-2"><PictureOutlined /> หลักฐานภาพถ่าย</span>
                           <div className="flex gap-3">
                             {record.photos.map((url: string, index: number) => (
                               <div key={index} className="w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100">
                                 <img src={url} alt="BBS Evidence" className="w-full h-full object-cover" />
                               </div>
                             ))}
                           </div>
                        </div>
                      )}
                    </div>
                  </Col>

                  {/* ขวา: วิเคราะห์รากเหง้า */}
                  <Col xs={24} md={12}>
                    {record.behavior_type === 'UNSAFE' ? (
                      <div className="bg-rose-50/50 p-5 rounded-[1.5rem] border border-rose-100 h-full relative overflow-hidden print-avoid-break">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                        <h4 className="font-black text-rose-700 text-sm mb-4 flex items-center gap-2">
                          <ThunderboltOutlined /> วิเคราะห์สาเหตุรากเหง้า (Root Cause Analysis)
                        </h4>
                        
                        <div className="flex flex-col gap-4 pl-2">
                          <div>
                            <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">สาเหตุหลักที่พนักงานกระทำเสี่ยง</span>
                            <div className="mt-1 bg-white px-3 py-2 rounded-xl border border-rose-200 text-sm font-bold text-rose-600 inline-block shadow-sm">
                              {record.root_cause || 'ไม่ได้ระบุสาเหตุ'}
                            </div>
                          </div>
                          
                          <div>
                            <span className="text-[10px] text-rose-400 font-black uppercase tracking-widest">ข้อเสนอแนะเพื่อป้องกัน (Preventive Measure)</span>
                            <div className="mt-1 bg-white p-3.5 rounded-xl border border-rose-200 text-sm font-bold text-slate-700 whitespace-pre-wrap shadow-sm">
                              {record.suggestion || 'ไม่มีข้อเสนอแนะเพิ่มเติม'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/50 flex flex-col items-center justify-center h-full rounded-[1.5rem] border border-emerald-100 border-dashed p-6 text-center min-h-[200px] print-avoid-break">
                        <SafetyCertificateOutlined className="text-4xl text-emerald-300 mb-3" />
                        <span className="font-bold text-emerald-600 text-sm">พฤติกรรมปลอดภัย<br/>ขอบคุณที่ช่วยกันรักษาสภาพแวดล้อมการทำงาน</span>
                      </div>
                    )}
                  </Col>
                </Row>
              </div>
            )
          }}
        />
      </div>

      {/* 🖨️ CSS สำหรับควบคุมการ Print */}
      <style>{`
        .modern-expanded-table .ant-table { background: transparent !important; }
        .modern-expanded-table .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b; font-weight: 800; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; border-bottom: 2px solid #f1f5f9; padding: 16px 24px; }
        .modern-expanded-table .ant-table-tbody > tr > td { padding: 16px 24px; border-bottom: 1px solid #f1f5f9; }
        .modern-expanded-table .ant-table-tbody > tr:hover > td { background: #fdfdfd !important; }
        .modern-expanded-table .ant-table-expanded-row > td { background: #ffffff !important; padding: 0 !important; }
        .modern-expanded-table .ant-table-row-expand-icon { width: 24px; height: 24px; border-radius: 8px; color: #3b82f6; border-color: #bfdbfe; background: #eff6ff; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease-out; }
        .modern-expanded-table .ant-table-row-expand-icon:hover { background: #3b82f6; color: white; transform: scale(1.1); }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }

        /* =========================================
           🖨️ PRINT MEDIA QUERIES (เวทมนตร์การพิมพ์)
           ========================================= */
        @media print {
          /* ซ่อนเมนูด้านข้างและ Header ของเว็บหลัก (สมมติว่ามีคลาสเหล่านี้ในโครงสร้างแอป) */
          body * {
            visibility: hidden;
          }
          
          /* ซ่อน Header และ Filter ของ BBS Board เอง */
          .hide-on-print-single {
            display: none !important;
          }

          /* กำหนดให้คอนเทนเนอร์หลักและตารางแสดงผล */
          .bbs-history-container, 
          .bbs-history-container *,
          .print-table-container,
          .print-table-container * {
            visibility: visible;
          }

          /* จัดหน้ากระดาษ A4 แนวนอน */
          @page {
            size: A4 landscape;
            margin: 1cm;
          }

          /* กรณีพิมพ์รายบุคคล: ซ่อนแถวอื่นๆ ที่ไม่ได้เลือก */
          body.print-single-row .printable-row {
            display: none !important;
          }
          
          /* กรณีพิมพ์รายบุคคล: แสดงเฉพาะแถวที่ตรงกับ data-print-id */
          body.print-single-row[data-print-id="1"] .printable-row-1,
          body.print-single-row[data-print-id="2"] .printable-row-2,
          /* ... ทริค CSS เล็กๆ: เราใช้วิธีแสดงเฉพาะแถวที่ Expanded */
          body.print-single-row .ant-table-row-expanded,
          body.print-single-row .ant-table-expanded-row {
            display: table-row !important;
          }

          /* ปรับสีให้เหมาะกับกระดาษ (ลบพื้นหลังที่กินหมึก) */
          .expanded-details-box {
            background-color: white !important;
            border: 2px solid #e2e8f0 !important;
            padding: 20px !important;
            border-radius: 8px !important;
          }

          .ant-table-thead > tr > th {
            background-color: #f1f5f9 !important;
            -webkit-print-color-adjust: exact; 
          }

          /* ห้ามตัดแบ่งข้อมูลในกล่องเดียวกันไปคนละหน้ากระดาษ */
          .print-avoid-break {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}