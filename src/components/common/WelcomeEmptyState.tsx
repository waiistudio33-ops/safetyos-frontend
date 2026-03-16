import React from 'react';
import { Button, Typography } from 'antd';
import { PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface WelcomeEmptyStateProps {
  title: string;
  description: string;
  buttonText: string;
  icon?: React.ReactNode;
  onAction: () => void;
}

export default function WelcomeEmptyState({ title, description, buttonText, icon, onAction }: WelcomeEmptyStateProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      
      {/* ✨ 3D / Glass Icon Container */}
      <div className="relative mb-8 group cursor-pointer" onClick={onAction}>
        {/* แสงเรืองรองด้านหลัง */}
        <div className="absolute inset-0 bg-blue-400/20 blur-3xl rounded-full group-hover:bg-blue-400/30 transition-colors duration-500"></div>
        
        {/* วงกลมกระจกหลัก */}
        <div className="relative bg-white/80 backdrop-blur-xl w-32 h-32 rounded-full border-4 border-white shadow-[0_16px_40px_rgba(0,0,0,0.08)] flex items-center justify-center text-5xl text-blue-600 group-hover:scale-105 transition-transform duration-500 ease-out">
          {icon || <SafetyCertificateOutlined />}
        </div>
        
        {/* ไอคอน Plus ดวงเล็ก */}
        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white w-10 h-10 rounded-full border-4 border-white flex items-center justify-center text-xl shadow-lg group-hover:rotate-90 transition-transform duration-500 ease-out">
          <PlusOutlined />
        </div>
      </div>
      
      {/* 📝 Typography */}
      <Title level={3} className="!font-black text-slate-800 mb-2 tracking-tight">
        {title}
      </Title>
      
      <Text className="text-slate-500 font-medium max-w-md text-[13px] md:text-sm mb-8 block leading-relaxed">
        {description}
      </Text>
      
      {/* 🎯 Call to Action Button */}
      <Button 
        type="primary" 
        size="large" 
        icon={<PlusOutlined />} 
        onClick={onAction}
        className="h-14 px-8 rounded-2xl font-black bg-blue-600 hover:bg-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-all duration-300 ease-out hover:scale-105 hover:-translate-y-1 active:scale-[0.98]"
      >
        {buttonText}
      </Button>
      
    </div>
  );
}