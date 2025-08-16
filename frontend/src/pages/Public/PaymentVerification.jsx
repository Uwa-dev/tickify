import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyPayment } from '../../services/paymentApi';
import { toast } from 'react-toastify';
import Load from '../../components/reuse/Load';
import Logo from '../../assets/Tickify.png'
import ScrollToTop from '../../components/reuse/ScrollToTop';

const PaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [ticketData, setTicketData] = useState(null);
  const [customUrl, setCustomUrl] = useState(null);

  // Internal styling
  const styles = {
    container: {
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
    },
    successContainer: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(234, 129, 180, 0.2)',
      textAlign: 'center',
      maxWidth: '500px',
      width: '90%',
      animation: 'fadeInUp 0.8s ease-out',
    },
    logo: {
      width: '120px',
      marginBottom: '20px',
      animation: 'bounce 1s infinite alternate',
    },
    heading: {
      color: '#2e3192',
      fontSize: '28px',
      marginBottom: '20px',
      fontWeight: '700',
    },
    message: {
      fontSize: '18px',
      color: '#a35a7d',
      marginBottom: '30px',
      lineHeight: '1.6',
    },
    buttonGroup: {
      marginTop: '30px',
      display: 'flex',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: '#ea81b4',
      color: 'white',
      border: 'none',
      padding: '12px 30px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(234, 129, 180, 0.4)',
      '&:hover': {
        backgroundColor: '#f0a6ca',
        transform: 'translateY(-3px)',
        boxShadow: '0 6px 20px rgba(234, 129, 180, 0.6)',
      },
      '&:active': {
        transform: 'translateY(1px)',
      }
    },
    checkmark: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(251, 224, 107, 0.2)',
      animation: 'scaleIn 0.5s ease-out',
    },
    checkmarkIcon: {
      color: '#fbe06b',
      fontSize: '40px',
    },
    // Keyframes for animations
    '@keyframes fadeInUp': {
      from: {
        opacity: '0',
        transform: 'translateY(20px)',
      },
      to: {
        opacity: '1',
        transform: 'translateY(0)',
      }
    },
    '@keyframes bounce': {
      from: {
        transform: 'translateY(0)',
      },
      to: {
        transform: 'translateY(-10px)',
      }
    },
    '@keyframes scaleIn': {
      from: {
        transform: 'scale(0)',
        opacity: '0',
      },
      to: {
        transform: 'scale(1)',
        opacity: '1',
      }
    },
    errorContainer: {
      backgroundColor: 'white',
      padding: '40px',
      borderRadius: '16px',
      boxShadow: '0 10px 30px rgba(220, 53, 69, 0.2)',
      textAlign: 'center',
      maxWidth: '500px',
      width: '90%',
      animation: 'shake 0.5s ease-in-out',
    },
    errorHeading: {
      color: '#dc3545',
      fontSize: '28px',
      marginBottom: '20px',
      fontWeight: '700',
    },
    errorIcon: {
      width: '80px',
      height: '80px',
      margin: '0 auto 20px',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(220, 53, 69, 0.1)',
      animation: 'pulse 1.5s infinite',
    },
    errorMessage: {
      fontSize: '16px',
      color: '#a35a7d',
      marginBottom: '25px',
      lineHeight: '1.6',
    },
    errorButton: {
      backgroundColor: '#dc3545',
      color: 'white',
      border: 'none',
      padding: '12px 30px',
      borderRadius: '50px',
      cursor: 'pointer',
      fontSize: '16px',
      fontWeight: '600',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
      '&:hover': {
        backgroundColor: '#e35d6a',
        transform: 'translateY(-3px)',
        boxShadow: '0 6px 20px rgba(220, 53, 69, 0.4)',
      },
    },
    '@keyframes shake': {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
    },
    '@keyframes pulse': {
      '0%, 100%': { transform: 'scale(1)', opacity: '1' },
      '50%': { transform: 'scale(1.05)', opacity: '0.8' },
    }
  };


  useEffect(() => {
    const verify = async () => {
      const reference = searchParams.get('reference');
      const urlFromParams = searchParams.get('customUrl'); // Get from URL params
      setCustomUrl(urlFromParams); // Store in state

      if (!reference) {
        navigate('/events/listing');
        return;
      }

      try {
        setLoading(true);
        const { data } = await verifyPayment(reference);
        setVerificationStatus('success');
        setTicketData(data);
        if (data?.customUrl) setCustomUrl(data.customUrl);
        toast.success('Payment verified successfully!');
        
        // if (data?.ticketSale?._id) {
        //   setTimeout(() => {
        //     navigate(`/tickets/${data.ticketSale._id}`);
        //   }, 2000);
        // }
      } catch (error) {
        setVerificationStatus('failed');
        const errorMessage = error.response?.data?.message || 'Payment verification failed';
        toast.error(errorMessage);
        console.error('Verification error details:', error.response?.data);
        if (error.response?.data?.customUrl) {
          setCustomUrl(error.response.data.customUrl);
        }
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [searchParams, navigate]);

  if (loading) return <Load />;

  return (
    <>
    <div style={styles.container}>
      {verificationStatus === 'success' ? (
        <div style={styles.container}>
          <div style={styles.successContainer}>
            <div style={styles.checkmark}>
              <svg 
                style={styles.checkmarkIcon} 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <img 
              src={Logo} // Update with your actual logo path
              alt="Tickify Logo" 
              style={styles.logo}
            />
            <h2 style={styles.heading}>Payment Successful!</h2>
            <p style={styles.message}>
              Your tickets have been reserved and you'll receive your e-tickets via email shortly. 
              Check your inbox for confirmation!
            </p>
            <div style={styles.buttonGroup}>
              <button 
                style={styles.primaryButton}
                onClick={() => navigate('/events/listing')}
              >
                View Other Events
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>
          <svg 
            style={{ width: '40px', height: '40px', color: '#dc3545' }}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h2 style={styles.errorHeading}>Payment Verification Failed</h2>
        <p style={styles.errorMessage}>
          We are Sorry, we couldn't verify your payment
        </p>
        <div style={styles.buttonGroup}>
          <button 
            style={{
              ...styles.primaryButton,
              backgroundColor: '#fbe06b',
              color: '#2e3192'
            }}
            onClick={() => navigate(`/events/${customUrl || 'listing'}`)}
          >
            Try Again
          </button>
        </div>
      </div>
      )}
    </div>
    <ScrollToTop />
    </>
  );
};

export default PaymentVerification;