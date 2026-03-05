import React from 'react';
import { Table, Avatar } from 'antd';
import { 
  FileTextOutlined, EnvironmentOutlined, UserOutlined, 
  EyeOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined, 
  FireOutlined, BuildOutlined, ThunderboltOutlined, ToolOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export default function WorkPermitQueue({ permits, loading, currentUser, onPreviewFile, onViewDetails, onUpdateStatus }: any) {
  
  // ✨ อัปเกรด Badge สถานะให้ดู Premium ด้วย ring-inset
  const getStatusDisplayModern = (status: string) => { 
    switch(status) { 
      case 'PENDING_AREA_OWNER': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
      case 'PENDING_SAFETY': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
      case 'APPROVED': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 whitespace-nowrap"><CheckCircleOutlined /> อนุมัติแล้ว</span>; 
      case 'REJECTED': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 whitespace-nowrap"><CloseOutlined /> ไม่อนุมัติ</span>; 
      default: 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20 whitespace-nowrap">{status}</span>; 
    } 
  };

  // ✨ อัปเกรด Badge ประเภทงานให้สีชัดเจนและสะอาดตา
  const getPermitTypeDisplayModern = (type: string) => { 
    switch(type) { 
      case 'HOT_WORK': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 whitespace-nowrap"><FireOutlined /> Hot Work</span>; 
      case 'CONFINED_SPACE': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 whitespace-nowrap"><BuildOutlined /> Confined Space</span>; 
      case 'ELECTRICAL': 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20 whitespace-nowrap"><ThunderboltOutlined /> Electrical</span>; 
      default: 
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-600/20 whitespace-nowrap"><ToolOutlined /> Cold Work</span>; 
    } 
  };

  const columns: ColumnsType<any> = [
    { 
      title: 'Permit No.', 
      dataIndex: 'permit_number', 
      key: 'permit_number', 
      width: 130, 
      render: (text) => (
        <span className="inline-block bg-slate-100 text-slate-700 font-mono font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm text-sm whitespace-nowrap">
          {text || 'PTW-XX'}
        </span>
      )
    },
    { 
      title: 'รายละเอียดงาน (Work Details)', 
      key: 'details', 
      render: (_, record) => ( 
        <div className="flex flex-col gap-2 min-w-[280px] py-2">
          {/* ชื่อเรื่องงาน */}
          <div className="font-bold text-slate-800 text-base leading-tight tracking-tight">
            {record.title}
          </div>
          
          {/* ข้อมูลผู้ขอ & สถานที่ (จัดกลุ่มให้อ่านง่าย) */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <Avatar size="small" icon={<UserOutlined />} className="bg-blue-100 text-blue-600 w-5 h-5 flex items-center justify-center text-[10px]" />
              <span className="text-slate-700">{record.applicant?.full_name || 'ไม่ทราบชื่อ'}</span>
              <span className="text-slate-400 hidden sm:inline">({record.applicant?.department || '-'})</span>
            </div>
            <div className="flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
              <EnvironmentOutlined className="text-emerald-500" /> 
              <span className="text-slate-600 truncate max-w-[150px] sm:max-w-xs">{record.location_detail}</span>
            </div>
          </div>

          {/* ปุ่มดู JSA แบบ Minimal Ghost Button */}
          {record.attachment_url && (
            <button 
              onClick={() => onPreviewFile(record.attachment_url)} 
              className="mt-1 flex items-center justify-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-lg transition-all duration-200 w-fit group"
            >
              <FileTextOutlined className="group-hover:scale-110 transition-transform" /> ดูเอกสาร JSA
            </button>
          )}
        </div> 
      ) 
    },
    { 
      title: 'ประเภท', 
      dataIndex: 'permit_type', 
      key: 'type', 
      width: 140, 
      render: (type) => getPermitTypeDisplayModern(type)
    }, 
    { 
      title: 'สถานะ', 
      dataIndex: 'status', 
      key: 'status', 
      width: 160, 
      render: (status) => getStatusDisplayModern(status) 
    },
    { 
      title: 'การจัดการ (Action)', 
      key: 'action', 
      width: 190, 
      render: (_, record) => {
        const isAreaOwnerTurn = record.status === 'PENDING_AREA_OWNER' && currentUser?.role === 'AREA_OWNER'; 
        const isSafetyTurn = record.status === 'PENDING_SAFETY' && currentUser?.role === 'SAFETY_ENGINEER';
        
        return (
          <div className="flex flex-col gap-2 w-full pr-2">
            <button 
              onClick={() => onViewDetails(record)} 
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all whitespace-nowrap shadow-sm"
            >
              <EyeOutlined /> เปิดดูรายละเอียด
            </button>

            {(isAreaOwnerTurn || isSafetyTurn) && ( 
              <div className="flex gap-2 w-full">
                <button 
                  onClick={() => onUpdateStatus(record.id, record.status, 'APPROVE')} 
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg hover:from-emerald-400 hover:to-teal-400 active:scale-95 transition-all whitespace-nowrap"
                >
                  <CheckOutlined /> อนุมัติ
                </button>
                <button 
                  onClick={() => onUpdateStatus(record.id, record.status, 'REJECT')} 
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white text-rose-500 rounded-lg border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 shadow-sm active:scale-95 transition-all"
                  title="ไม่อนุมัติ"
                >
                  <CloseOutlined />
                </button>
              </div> 
            )}
            
            {(record.status === 'APPROVED' || record.status === 'REJECTED') && (
              <div className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg whitespace-nowrap">
                <CheckCircleOutlined /> ดำเนินการแล้ว
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    // ✨ Container ห่อตารางเงาสวยๆ มุมโค้งเนียนๆ
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <Table 
        columns={columns} 
        dataSource={permits} 
        loading={loading} 
        pagination={{ 
          pageSize: 8,
          className: "px-4 pb-4" // จัดให้เลขหน้ามี Padding สวยๆ
        }} 
        size="middle" // 💡 เปลี่ยนเป็น middle จะทำให้ตารางดูโปร่ง หายใจสะดวกขึ้น
        scroll={{ x: 1000 }} 
        className="modern-table"
      />
    </div>
  );
}