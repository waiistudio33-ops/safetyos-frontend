import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { ScanOutlined, InfoCircleOutlined } from '@ant-design/icons';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  useEffect(() => {
    // 1. ตั้งค่าตัวสแกนแบบมาตรฐาน
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true, // มีปุ่มเปิดไฟฉายให้ด้วยถ้ามือถือรองรับ
      },
      false
    );

    const handleScanSuccess = (decodedText: string) => {
      scanner.clear(); // ปิดกล้องเมื่อสแกนสำเร็จ
      onScan(decodedText);
    };

    scanner.render(handleScanSuccess, undefined);

    return () => {
      scanner.clear().catch((err) => console.error("Failed to clear scanner", err));
    };
  }, [onScan]);

  return (
    <div className="flex flex-col items-center pb-4">
      {/* 🌟 กล่องสแกนแบบเรียบหรู โค้งมน */}
      <div 
        id="qr-reader" 
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-white"
      ></div>

      {/* ข้อความแนะนำผู้ใช้งานแบบคลีนๆ */}
      <div className="mt-6 flex items-center gap-2 text-slate-600 bg-slate-50 px-5 py-2.5 rounded-full text-sm font-medium border border-slate-200 shadow-sm">
        <ScanOutlined className="text-blue-500 text-lg" />
        <span>กรุณาจัดให้ QR Code อยู่ในกรอบ</span>
      </div>

      {/* 🎨 CSS ตกแต่งปุ่มและซ่อนข้อความรกๆ ของ Library เดิมทิ้งไป */}
      <style>{`
        /* ซ่อนข้อความที่ไม่จำเป็น */
        #qr-reader__status_span,
        #qr-reader__dashboard_section_csr span {
          display: none !important;
        }
        
        /* ตกแต่งลิงก์สลับกล้องหน้า/หลัง */
        #qr-reader__dashboard_section_swaplink {
          text-decoration: none;
          color: #2563eb;
          font-weight: bold;
          margin-top: 10px;
          display: inline-block;
        }

        /* ตกแต่งปุ่มขออนุญาตเปิดกล้อง */
        #html5-qrcode-button-camera-permission {
          background-color: #2563eb !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 8px 16px !important;
          font-weight: bold !important;
          cursor: pointer;
          margin-bottom: 12px;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }

        /* ตกแต่งปุ่มหยุดสแกน */
        #html5-qrcode-button-camera-stop {
          background-color: #ef4444 !important;
          color: white !important;
          border: none !important;
          border-radius: 8px !important;
          padding: 6px 12px !important;
          font-weight: bold !important;
          cursor: pointer;
          margin: 10px 0;
        }
      `}</style>
    </div>
  );
}