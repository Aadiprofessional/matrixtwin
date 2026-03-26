import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/api';
import { useFeedback } from '../../contexts/FeedbackContext';

const ConfirmEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useFeedback();

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        const message = 'Invalid confirmation link. Missing token.';
        showToast({
          type: 'error',
          title: 'Email confirmation failed',
          message
        });
        navigate('/login', {
          replace: true,
          state: {
            showEmailVerificationAlert: true,
            alertMessage: message
          }
        });
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/confirm-email?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        let payload: any = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }

        if (response.ok) {
          const message = payload?.message || 'Email confirmed successfully. You can now log in.';
          showToast({
            type: 'success',
            title: 'Email confirmed',
            message
          });
          navigate('/login', {
            replace: true,
            state: {
              showEmailVerificationAlert: true,
              alertMessage: message
            }
          });
          return;
        }

        const message = payload?.message || payload?.error || 'Email confirmation failed. Please request a new link.';
        showToast({
          type: 'error',
          title: 'Email confirmation failed',
          message
        });
        navigate('/login', {
          replace: true,
          state: {
            showEmailVerificationAlert: true,
            alertMessage: message
          }
        });
      } catch {
        const message = 'Unable to confirm email right now. Please try again later.';
        showToast({
          type: 'error',
          title: 'Email confirmation failed',
          message
        });
        navigate('/login', {
          replace: true,
          state: {
            showEmailVerificationAlert: true,
            alertMessage: message
          }
        });
      }
    };

    confirmEmail();
  }, [navigate, searchParams, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-ai-blue mx-auto mb-4"></div>
        <p className="text-sm text-secondary-300">Confirming your email...</p>
      </div>
    </div>
  );
};

export default ConfirmEmail;
