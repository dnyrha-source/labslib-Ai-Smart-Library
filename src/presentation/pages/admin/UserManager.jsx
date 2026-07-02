import React from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/common/Card';
import { Users } from 'lucide-react';

const UserManager = () => {
  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h1 className="gradient-text-rose" style={{ color: 'var(--color-rose)' }}>User Role Manager</h1>
        <Card glowColor="purple">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center', padding: '40px 0' }}>
            <Users size={48} className="text-purple animate-float" />
            <h2>Fitur Sedang Dikembangkan</h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '500px' }}>
              Modul User Role Manager untuk meninjau status pendaftaran pengguna dan memperbarui peran hak akses (Siswa, Guru, Pustakawan, Admin) akan diimplementasikan penuh pada Sprint 4.
            </p>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
};

export default UserManager;
