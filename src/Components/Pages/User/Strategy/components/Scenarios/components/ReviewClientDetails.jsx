import React, { useMemo, useState, } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Row, Col, Card, Avatar, Button, Typography } from 'antd';
import { discoveryDataAtom, SelectedClient, SelectedReviewAllData } from '../../../../../../../store/authState';
import { capitalizeFirst } from '../../../../../../../hooks/helpers';
import AppModal from '../../../../../../Common/AppModal';
import useTitleBlock from '../../../../../../../hooks/useTitleBlock';
import ReviewClientDetailsEditFrom from './ReviewClientDetailsEditFrom';

const { Text } = Typography;

export const PRIMARY_GREEN = '#22c55e';

// --- HELPER FUNCTIONS ---

function formatAuDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-AU');
}

function calcAge(dob) {
  if (!dob) return null;
  const d = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  return age;
}

function buildFormalName(person = {}, role = 'client') {
  const isClient = role === 'client';


  const fallback = isClient ? 'Client name not set' : 'Partner name (optional)';
  return person?.[role]?.preferredName || fallback;
}

function dobAgeLine(person = {}, role = 'client') {
  const raw = person?.[role]?.DOB

  const dateStr = formatAuDate(raw);

  const ageNum = calcAge(person?.[role]?.DOB);

  if (!dateStr && ageNum == null) return '—';
  if (dateStr && ageNum != null && !Number.isNaN(ageNum))
    return `${dateStr} (${ageNum})`;
  return dateStr || (ageNum != null ? `(${ageNum})` : '—');

}

// --- CARD SUB-COMPONENT ---

const ClientProfileCard = ({ discovery, person = {}, role = 'client' }) => {
  const formalName = buildFormalName(person, role);
  const isDefaultName =
    formalName === 'Client name not set' || formalName === 'Partner name (optional)';

  const avatarSrc = role === 'client' ? person?.clientAvatar : person?.partnerAvatar;

  // Custom data fields matching your image
  const salaryText = person?.[role]?.[`incomeFromBusinessTotal`] || 'Salary not set';
  const retirementText = person?.[role]?.[`plannedRetirementAge`] || 'Retirement not set';
  const profileType = person?.[role]?.[`riskGoal`] || 'Balanced';
  const superText = person?.[role]?.[`superAnnuationTotal`] || 'Super not set';
  const abpText = person?.[role]?.[`accountBasedPensionTotal`] || 'ABP not set';

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid #f0f0f0',
        height: '100%',
        width: '100%',
      }}
      styles={{ body: { padding: '32px 28px' } }}
    >
      {/* Header Avatar Section */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ display: 'inline-block', position: 'relative', marginBottom: 12 }}>
          <Avatar
            size={88}
            src={avatarSrc}
            style={{
              background: '#f3f4f6',
              border: '3px solid rgba(34,197,94,.15)',
              fontSize: 36,
            }}
          >
            {!avatarSrc ? (role === 'client' ? '👨' : '👩') : null}
          </Avatar>
          <div
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              padding: '2px 8px',
              borderRadius: 10,
              background: PRIMARY_GREEN,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              lineHeight: '14px',
              boxShadow: '0 0 0 2px #fff',
            }}
          >
            BAL
          </div>
        </div>

        <div
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: isDefaultName ? '#9ca3af' : '#111827',
            fontStyle: isDefaultName ? 'italic' : 'normal',
          }}
        >
          {formalName}
        </div>
      </div>

      {/* Info Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>📅</span>
          <Text type="secondary">{dobAgeLine(person, role)}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>💼</span>
          <Text type="secondary">{salaryText}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>🎯</span>
          <Text type="secondary">{retirementText}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>📊</span>
          <Text style={{ color: '#374151', fontWeight: 500 }}>{profileType}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>🏛️</span>
          <Text type="secondary">{superText}</Text>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ width: 18, textAlign: 'center' }}>💸</span>
          <Text type="secondary">{abpText}</Text>
        </div>
      </div>
    </Card>
  );
};


// --- MAIN COMPONENT ---

const ReviewClientDetails = () => {
  const headingStyle = { fontFamily: "Georgia,serif" };

  const [selectedClient] = useAtom(SelectedClient);
  const [DiscoveryDataAtom] = useAtom(discoveryDataAtom);
  const selectedReviewAllData = useAtomValue(SelectedReviewAllData);

  const personalDetails = useMemo(() => {
    return selectedReviewAllData?.personalDetails || null;
  }, [selectedReviewAllData]);

  const [openModal, setOpenModal] = useState();
  const showPartner = selectedClient?.partner && Object.keys(selectedClient.partner).length > 0

  const renderTitleBlock = useTitleBlock({
    titleStyle: headingStyle,
  });


  const onEdit = () => {
    setOpenModal(true);
  }



  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '16px 0' }}>
      {/* Cards Row */}
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <ClientProfileCard discovery={DiscoveryDataAtom} person={personalDetails} role="client" />
        </Col>
        {showPartner && (
          <Col xs={24} md={12}>
            <ClientProfileCard discovery={DiscoveryDataAtom} person={personalDetails} role="partner" />
          </Col>)}
      </Row>

      {/* Action Button */}
      <div style={{ textAlign: 'center', marginTop: 24, marginBottom: 20 }}>
        <Button
          type="primary"
          size="large"
          onClick={onEdit}
          style={{
            backgroundColor: PRIMARY_GREEN,
            borderColor: PRIMARY_GREEN,
            borderRadius: 8,
            fontWeight: 600,
            padding: '0 24px',
            height: 42,
            boxShadow: '0 2px 4px rgba(34, 197, 94, 0.2)',
          }}
        >
          ✏️ Edit Client Details
        </Button>
      </div>

      <AppModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={renderTitleBlock({
          title: "Client & Partner Details",
          icon: "👤",
        })}
        width={"90%"}
      >
        <ReviewClientDetailsEditFrom initialData={personalDetails} />
      </AppModal>



      {/* Helper Banner */}
      <div
        style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: 10,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 16 }}>💡</span>
        <Text style={{ fontSize: 13, color: '#166534' }}>
          These details auto-populate every calculator. Open any calculator from the sidebar to use them.
        </Text>
      </div>
    </div >
  );
};

export default ReviewClientDetails;