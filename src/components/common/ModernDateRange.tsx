import React from 'react';
import dayjs from 'dayjs';
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface ModernDateRangeProps {
  value?: any[];
  onChange?: (dates: any[]) => void;
}

export default function ModernDateRange({ value, onChange }: ModernDateRangeProps) {
  const onStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange([e.target.value ? dayjs(e.target.value) : null, value?.[1]]);
  };
  const onEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange([value?.[0], e.target.value ? dayjs(e.target.value) : null]);
  };
  const toNativeFormat = (date: any) => date ? date.format('YYYY-MM-DDTHH:mm') : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] focus-within:border-blue-400 focus-within:bg-white transition-colors duration-300 ease-out flex flex-col justify-center">
        <label className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <CalendarOutlined /> เวลาเริ่มงาน
        </label>
        <input 
          type="datetime-local" 
          className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm md:text-base" 
          value={toNativeFormat(value?.[0])} 
          onChange={onStartChange} 
        />
      </div>
      <div className="bg-white/60 backdrop-blur-md p-4 rounded-xl border border-white/80 shadow-[0_4px_12px_rgba(0,0,0,0.02)] focus-within:border-rose-400 focus-within:bg-white transition-colors duration-300 ease-out flex flex-col justify-center">
        <label className="text-[11px] font-black text-rose-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
          <ClockCircleOutlined /> เวลาสิ้นสุด
        </label>
        <input 
          type="datetime-local" 
          className="w-full bg-transparent outline-none text-slate-800 font-bold text-sm md:text-base" 
          value={toNativeFormat(value?.[1])} 
          onChange={onEndChange} 
        />
      </div>
    </div>
  );
}