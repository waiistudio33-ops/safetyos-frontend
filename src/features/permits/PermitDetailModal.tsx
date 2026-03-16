import React from 'react';
import { Modal, Row, Col, Typography, Divider, Button } from 'antd';
import { ClockCircleOutlined, FilePdfOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface PermitDetailModalProps {
  open: boolean;
  onCancel: () => void;
  permit: any;
  gasLogs: any[];
  documentRef: React.RefObject<HTMLDivElement>;
  onPrint: () => void;
  getStatusDisplay: (status: string) => React.ReactNode;
  getPermitTypeDisplay: (type: string) => React.ReactNode;
}

export default function PermitDetailModal({
  open, onCancel, permit, gasLogs, documentRef, onPrint, getStatusDisplay, getPermitTypeDisplay
}: PermitDetailModalProps) {
  
  return (
    <Modal title={null} open={open} destroyOnClose={true} onCancel={onCancel} width={850} footer={null} styles={{ body: { padding: 0 } }} centered>
      {permit && (
        <div className="bg-white/90 backdrop-blur-3xl rounded-3xl overflow-hidden shadow-2xl border border-white">
          <div ref={documentRef} className="pb-10">
            
            {/* Glass Header for Modal */}
            <div className="p-8 md:p-10 relative overflow-hidden border-b border-slate-100" style={{ background: 'linear-gradient(135deg, rgba(239, 246, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)' }}>
              <div className="absolute top-8 right-8 z-20">{getStatusDisplay(permit.status || 'PENDING')}</div>
              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-black m-0 tracking-tight text-blue-900 uppercase">Work Permit</h2>
                <p className="text-blue-600/70 text-xs font-black uppercase tracking-widest mt-2 bg-white/50 backdrop-blur-sm inline-block px-3 py-1 rounded-lg border border-white">
                  DOC: {permit.permit_number || 'PTW-NEW'}
                </p>
              </div>
            </div>

            <div className="p-6 md:p-10 space-y-10 bg-white/50">
              <div>
                <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-sm text-slate-400 uppercase tracking-widest">ข้อมูลพื้นฐาน</span></Divider>
                <Row gutter={[24, 32]}>
                  <Col span={24}>
                    <Text type="secondary" className="block text-[11px] font-black uppercase mb-1.5 tracking-widest text-slate-500">หัวข้องาน (Task Title)</Text>
                    <Text className="text-lg md:text-xl font-black text-slate-800">{permit.title || '-'}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" className="block text-[11px] font-black uppercase mb-1.5 tracking-widest text-slate-500">พื้นที่ (Location)</Text>
                    <Text className="font-bold text-slate-800 text-base">{permit.location_detail || '-'}</Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" className="block text-[11px] font-black uppercase mb-1.5 tracking-widest text-slate-500">ประเภทงาน (Type)</Text>
                    <div className="mt-1">{getPermitTypeDisplay(permit.permit_type || 'COLD_WORK')}</div>
                  </Col>
                </Row>
              </div>

              <div>
                <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-sm text-slate-400 uppercase tracking-widest">ระยะเวลาปฏิบัติงาน</span></Divider>
                <Row gutter={[24, 24]}>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" className="block text-[11px] font-black uppercase mb-1.5 tracking-widest text-blue-600">วันเริ่มงาน</Text>
                    <Text className="font-black text-slate-800 text-base flex items-center gap-2">
                      <ClockCircleOutlined className="text-blue-400" /> {permit.start_time ? dayjs(permit.start_time).format('DD/MM/YYYY HH:mm น.') : '-'}
                    </Text>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Text type="secondary" className="block text-[11px] font-black uppercase mb-1.5 tracking-widest text-rose-600">วันสิ้นสุด</Text>
                    <Text className="font-black text-slate-800 text-base flex items-center gap-2">
                      <ClockCircleOutlined className="text-rose-400" /> {permit.end_time ? dayjs(permit.end_time).format('DD/MM/YYYY HH:mm น.') : '-'}
                    </Text>
                  </Col>
                </Row>
              </div>

              <div>
                <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-sm text-slate-400 uppercase tracking-widest">มาตรการควบคุมความเสี่ยง</span></Divider>
                <div className={`leading-relaxed text-sm md:text-base font-medium whitespace-pre-wrap p-5 rounded-2xl bg-slate-50/80 border border-slate-100 ${!permit.description ? 'text-slate-400 italic' : 'text-slate-700'}`}>
                  {permit.description || 'ไม่มีการระบุมาตรการเพิ่มเติมในเอกสารนี้'}
                </div>
              </div>

              {Array.isArray(gasLogs) && gasLogs.length > 0 && (
                <div>
                  <Divider orientation="left" className="m-0 mb-6 border-slate-200"><span className="font-black text-sm text-cyan-600 uppercase tracking-widest">ประวัติการตรวจวัดก๊าซ</span></Divider>
                  <div className="space-y-3">
                    {gasLogs.map((log, idx) => (
                      <div key={idx} className="bg-cyan-50/50 p-4 md:p-5 rounded-2xl border border-cyan-100/50 flex flex-wrap justify-between items-center backdrop-blur-sm">
                        <Text className="text-xs md:text-sm font-black text-cyan-700 bg-white/80 px-3 py-1 rounded-lg border border-cyan-100 shadow-sm">
                          {log?.recorded_at ? dayjs(log.recorded_at).format('HH:mm') : '-'}
                        </Text>
                        <div className="flex gap-6 mt-2 sm:mt-0">
                          <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 tracking-widest">O2</div>
                            <div className="font-black text-blue-600 text-base">{log?.o2_level ?? '-'}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] font-black text-slate-400 tracking-widest">LEL</div>
                            <div className="font-black text-orange-500 text-base">{log?.lel_level ?? '-'}%</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl p-6 md:p-8 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
            <Button size="large" className="w-full sm:flex-1 rounded-xl h-14 font-extrabold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-colors duration-300 ease-out" onClick={onCancel}>
              ปิดหน้าต่าง
            </Button>
            <Button type="primary" icon={<FilePdfOutlined />} size="large" className="w-full sm:flex-[2] rounded-xl h-14 font-black bg-blue-600 hover:bg-blue-700 shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition-all duration-300 ease-out" onClick={onPrint}>
              บันทึกเป็น PDF / สั่งพิมพ์
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}