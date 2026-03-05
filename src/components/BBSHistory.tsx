import React from 'react';
import { Typography } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  EnvironmentOutlined,
  UserOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function BBSHistory({ records }: { records: any[] }) {
  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
        <SafetyCertificateOutlined className="text-4xl text-slate-300 mb-3" />
        <Text type="secondary" className="text-slate-500 font-medium">ยังไม่มีประวัติการบันทึก BBS</Text>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((item, index) => {
        const isSafe = item.behavior_type === 'SAFE';

        return (
          <div 
            key={index} 
            className={`relative bg-white p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 overflow-hidden flex flex-col sm:flex-row gap-4 md:gap-6 items-start ${
              isSafe ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-rose-500'
            }`}
          >
            <div className="flex-shrink-0">
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-inner ${
                isSafe ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'
              }`}>
                {isSafe ? <CheckCircleOutlined className="text-2xl md:text-3xl" /> : <WarningOutlined className="text-2xl md:text-3xl" />}
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-slate-800 m-0 leading-tight">
                    {item.category || 'ไม่ระบุหมวดหมู่'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wide ${
                      isSafe ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {isSafe ? 'SAFE BEHAVIOR' : 'AT-RISK BEHAVIOR'}
                    </span>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 ${
                    isSafe ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                  }`}>
                    <ThunderboltOutlined />
                    Action: {item.action_taken || 'ไม่มีการดำเนินการ'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3 mb-4">
                <Text className="text-slate-600 text-sm md:text-base leading-relaxed">
                  {item.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                </Text>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 font-medium">
                  <EnvironmentOutlined className="text-slate-400" />
                  <span className="truncate max-w-[200px] md:max-w-none">{item.location || 'ไม่ระบุพื้นที่'}</span>
                </div>
                
                <div className="flex items-center gap-1.5 text-xs md:text-sm text-slate-500 font-medium">
                  <UserOutlined className="text-slate-400" />
                  <span>Observed by: <span className="text-slate-700">{item.observer?.full_name || 'ไม่ระบุชื่อ'}</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}