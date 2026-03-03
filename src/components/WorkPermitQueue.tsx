import React from 'react';
import { Table, Button, Avatar } from 'antd';
import { FileTextOutlined, EnvironmentOutlined, UserOutlined, EyeOutlined, CheckOutlined, CloseOutlined, CheckCircleOutlined, FireOutlined, BuildOutlined, ThunderboltOutlined, ToolOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

export default function WorkPermitQueue({ permits, loading, currentUser, onPreviewFile, onViewDetails, onUpdateStatus }: any) {
  
  const getStatusDisplayModern = (status: string) => { 
    switch(status) { 
      case 'PENDING_AREA_OWNER': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>รอเจ้าของพื้นที่</span>; 
      case 'PENDING_SAFETY': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200 shadow-sm whitespace-nowrap"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>รอ จป. อนุมัติ</span>; 
      case 'APPROVED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm whitespace-nowrap"><CheckCircleOutlined /> อนุมัติแล้ว</span>; 
      case 'REJECTED': return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-red-50 text-red-600 border border-red-200 shadow-sm whitespace-nowrap"><CloseOutlined /> ไม่อนุมัติ</span>; 
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200 shadow-sm whitespace-nowrap">{status}</span>; 
    } 
  };

  const getPermitTypeDisplayModern = (type: string) => { 
    switch(type) { 
      case 'HOT_WORK': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 whitespace-nowrap"><FireOutlined /> Hot Work</span>; 
      case 'CONFINED_SPACE': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-100 whitespace-nowrap"><BuildOutlined /> Confined Space</span>; 
      case 'ELECTRICAL': return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap"><ThunderboltOutlined /> Electrical</span>; 
      default: return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap"><ToolOutlined /> Cold Work</span>; 
    } 
  };

  const columns: ColumnsType<any> = [
    { 
      title: 'Permit No.', 
      dataIndex: 'permit_number', 
      key: 'permit_number', 
      width: 140, 
      render: (text) => <span className="bg-blue-50 text-blue-600 font-mono font-extrabold px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm whitespace-nowrap">{text || 'PTW-XX'}</span> 
    },
    { 
      title: 'รายละเอียดงาน', 
      key: 'details', 
      render: (_, record) => ( 
        <div className="flex flex-col gap-1.5 min-w-[280px] py-1">
          <div className="font-extrabold text-slate-800 text-sm md:text-base leading-tight">{record.title}</div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Avatar size="small" icon={<UserOutlined />} className="bg-slate-200 text-slate-400" />
            <span>{record.applicant?.full_name || 'ไม่ทราบชื่อ'} <span className="text-slate-400">({record.applicant?.department})</span></span>
          </div>
          <div className="text-xs text-slate-500 bg-slate-50 w-fit px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1 mt-0.5">
            <EnvironmentOutlined className="text-blue-500" /> {record.location_detail}
          </div>
          {record.attachment_url && (
            <button 
              onClick={() => onPreviewFile(record.attachment_url)} 
              className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-full transition-colors w-fit"
            >
              <FileTextOutlined /> ดูเอกสาร JSA
            </button>
          )}
        </div> 
      ) 
    },
    { 
      title: 'ประเภท', 
      dataIndex: 'permit_type', 
      key: 'type', 
      width: 150, 
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
      title: 'Action', 
      key: 'action', 
      width: 180, 
      render: (_, record) => {
        const isAreaOwnerTurn = record.status === 'PENDING_AREA_OWNER' && currentUser?.role === 'AREA_OWNER'; 
        const isSafetyTurn = record.status === 'PENDING_SAFETY' && currentUser?.role === 'SAFETY_ENGINEER';
        return (
          <div className="flex flex-wrap gap-2 w-full">
            <button 
              onClick={() => onViewDetails(record)} 
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold hover:bg-slate-200 transition-colors whitespace-nowrap"
            >
              <EyeOutlined /> รายละเอียด
            </button>

            {(isAreaOwnerTurn || isSafetyTurn) && ( 
              <div className="flex gap-2 w-full mt-1 md:mt-0">
                <button 
                  onClick={() => onUpdateStatus(record.id, record.status, 'APPROVE')} 
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-full text-xs font-bold shadow-md shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95 transition-all whitespace-nowrap"
                >
                  <CheckOutlined /> อนุมัติ
                </button>
                <button 
                  onClick={() => onUpdateStatus(record.id, record.status, 'REJECT')} 
                  className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full border border-red-200 hover:bg-red-500 hover:text-white transition-colors"
                  title="ไม่อนุมัติ"
                >
                  <CloseOutlined />
                </button>
              </div> 
            )}
            
            {(record.status === 'APPROVED' || record.status === 'REJECTED') && (
              <span className="flex-1 text-center text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full whitespace-nowrap">
                <CheckCircleOutlined /> ทำรายการแล้ว
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <Table 
        columns={columns} 
        dataSource={permits} 
        loading={loading} 
        pagination={{ pageSize: 8 }} 
        size="small" 
        scroll={{ x: 1000 }} 
        className="modern-table"
      />
    </div>
  );
}