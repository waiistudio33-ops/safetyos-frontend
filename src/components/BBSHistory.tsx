import React from 'react';
import { List, Avatar, Space, Typography, Tag } from 'antd';
import { CheckCircleOutlined, WarningOutlined, EnvironmentOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function BBSHistory({ records }: { records: any[] }) {
  return (
    <List
      itemLayout="horizontal"
      dataSource={records}
      renderItem={item => (
        <List.Item style={{ background: '#fff', marginBottom: '12px', padding: '16px', borderRadius: '16px', borderLeft: `6px solid ${item.behavior_type === 'SAFE' ? '#10b981' : '#ef4444'}`, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', display: 'block' }}>
          <List.Item.Meta
            avatar={<Avatar icon={item.behavior_type === 'SAFE' ? <CheckCircleOutlined /> : <WarningOutlined />} style={{ backgroundColor: item.behavior_type === 'SAFE' ? '#d1fae5' : '#fee2e2', color: item.behavior_type === 'SAFE' ? '#10b981' : '#ef4444' }} size="large" />}
            title={<Space wrap><Text strong>{item.category}</Text> <Tag color={item.behavior_type === 'SAFE' ? 'success' : 'error'}>{item.behavior_type}</Tag></Space>}
            description={
              <div style={{ marginTop: '8px' }}>
                <Text>{item.description}</Text><br/>
                <Text type="secondary" style={{ fontSize: '12px' }}><EnvironmentOutlined /> {item.location} | ตรวจโดย: {item.observer?.full_name}</Text><br/>
                <Tag color="blue" style={{ marginTop: '8px' }}>Action: {item.action_taken}</Tag>
              </div>
            }
          />
        </List.Item>
      )}
    />
  );
}