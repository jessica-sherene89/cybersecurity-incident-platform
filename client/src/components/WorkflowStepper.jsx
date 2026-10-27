import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { STATUSES } from '../utils/constants';

const WorkflowStepper = ({ currentStatus, onStatusChange, canEdit = false }) => {
  const currentIndex = STATUSES.indexOf(currentStatus);

  return (
    <div style={{ width: '100%', padding: '1.25rem 0' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          overflowX: 'auto',
          paddingBottom: '0.5rem',
        }}
      >
        {/* Background track line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            right: '30px',
            height: '3px',
            background: 'rgba(255, 255, 255, 0.08)',
            zIndex: 1,
          }}
        />

        {/* Completed active progress line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '30px',
            width: `${(Math.max(0, currentIndex) / (STATUSES.length - 1)) * 100}%`,
            height: '3px',
            background: 'linear-gradient(90deg, #06b6d4, #10b981)',
            boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
            zIndex: 1,
            transition: 'width 0.4s ease',
          }}
        />

        {STATUSES.map((status, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isUpcoming = index > currentIndex;

          let circleBg = '#09101f';
          let borderColor = 'rgba(255, 255, 255, 0.15)';
          let textColor = '#64748b';
          let glow = 'none';

          if (isCompleted) {
            circleBg = '#10b981';
            borderColor = '#10b981';
            textColor = '#10b981';
          } else if (isCurrent) {
            circleBg = '#06b6d4';
            borderColor = '#38bdf8';
            textColor = '#38bdf8';
            glow = '0 0 16px rgba(6, 182, 212, 0.6)';
          }

          return (
            <div
              key={status}
              onClick={() => canEdit && onStatusChange && onStatusChange(status)}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: canEdit ? 'pointer' : 'default',
                minWidth: '85px',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: circleBg,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: glow,
                  transition: 'all 0.3s ease',
                  color: isCompleted || isCurrent ? '#ffffff' : '#64748b',
                }}
              >
                {isCompleted ? (
                  <Check size={18} strokeWidth={3} />
                ) : (
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700 }}>
                    {index + 1}
                  </span>
                )}
              </div>
              <span
                style={{
                  marginTop: '0.625rem',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  color: isCurrent ? '#ffffff' : textColor,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {status}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;
