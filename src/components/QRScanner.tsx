import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScanner({ onScan }: { onScan: (text: string) => void }) {
  useEffect(() => {
    const scanSize = window.innerWidth < 400 ? 220 : 260;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 15,
        qrbox: { width: scanSize, height: scanSize }, 
        aspectRatio: 1.0,
        videoConstraints: { 
          facingMode: "environment" 
        }
      },
      false
    );

    const handleScanSuccess = (decodedText: string) => {
      scanner.clear();
      onScan(decodedText);
    };

    scanner.render(handleScanSuccess, undefined);

    return () => {
      scanner.clear().catch((err) => console.error("Failed to clear scanner", err));
    };
  }, [onScan]);

  return (
    <div className="relative flex flex-col items-center w-full">
      
      {/* 🌟 กล่องสแกนเนอร์สไตล์ "แอปธนาคาร" (Clean & Minimal) */}
      <div className="relative w-full max-w-sm bg-black rounded-[2rem] overflow-hidden shadow-xl border border-slate-200">
        
        {/* ตัวคอนเทนเนอร์กล้อง */}
        <div id="qr-reader" className="w-full min-h-[400px] flex items-center justify-center"></div>

        {/* 🎨 Overlay กรอบโฟกัส (ฟิล์มดำเจาะช่องใสตรงกลาง) */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center overflow-hidden">
           
           {/* กล่องใสตรงกลาง + เงามืดรอบนอก (ใช้ CSS Shadow สร้างฟิล์มดำ) */}
           <div className="relative w-[240px] h-[240px] rounded-3xl shadow-[0_0_0_999px_rgba(0,0,0,0.55)]">
             
             {/* มุม 4 ด้าน (Corner Brackets) สีขาวคลีนๆ แบบแอปธนาคาร */}
             <div className="absolute -top-0.5 -left-0.5 w-12 h-12 border-t-[5px] border-l-[5px] border-white rounded-tl-3xl opacity-90"></div>
             <div className="absolute -top-0.5 -right-0.5 w-12 h-12 border-t-[5px] border-r-[5px] border-white rounded-tr-3xl opacity-90"></div>
             <div className="absolute -bottom-0.5 -left-0.5 w-12 h-12 border-b-[5px] border-l-[5px] border-white rounded-bl-3xl opacity-90"></div>
             <div className="absolute -bottom-0.5 -right-0.5 w-12 h-12 border-b-[5px] border-r-[5px] border-white rounded-br-3xl opacity-90"></div>
           </div>

           {/* ข้อความบอกผู้ใช้สไตล์เรียบหรู */}
           <p className="absolute bottom-12 text-white text-sm font-medium tracking-wide drop-shadow-md bg-black/30 px-4 py-1.5 rounded-full backdrop-blur-sm">
             จัดคิวอาร์โค้ดให้อยู่ในกรอบ
           </p>
        </div>
      </div>

      {/* 🎨 CSS ล้างขยะของ Library และปรับแต่งให้เนียนกริบ */}
      <style>{`
        /* ซ่อน UI ที่ไม่จำเป็นของ Library */
        #qr-reader__status_span,
        #qr-reader__dashboard_section_csr span,
        #qr-reader img,
        #qr-reader a {
          display: none !important;
        }

        /* ซ่อนกรอบสแกนเดิมของ Library ทิ้งไป (เพื่อใช้กรอบสีขาวของเราแทน) */
        #qr-reader__scan_region {
          display: none !important; 
        }

        /* ตกแต่งปุ่ม 'ขออนุญาตเปิดกล้อง' ให้ดูเป็นแอปจริงๆ */
        #html5-qrcode-button-camera-permission {
          background: #007AFF !important; /* สีน้ำเงิน iOS */
          color: white !important;
          border: none !important;
          border-radius: 12px !important;
          padding: 14px 24px !important;
          font-weight: bold !important;
          font-size: 16px !important;
          cursor: pointer;
          margin: 0 auto;
          display: block;
          z-index: 20;
          position: relative;
        }

        /* ซ่อนปุ่ม 'หยุดสแกน' เพราะหน้าต่างมีกากบาทปิดให้อยู่แล้ว */
        #html5-qrcode-button-camera-stop {
          display: none !important;
        }

        /* ปรับวิดีโอให้เต็มจอแบบสวยงาม ไม่มีขอบดำ */
        #qr-reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          min-height: 400px !important;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}