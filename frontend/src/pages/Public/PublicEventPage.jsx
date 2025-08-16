import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getEventByCustomUrl, validatePromoCode } from '../../services/publicApi';
import { initializePayment } from '../../services/paymentApi';
import { getPlatformFee } from '../../services/adminApi';
import { toast } from 'react-toastify';
import Logo from '../../assets/Tickify.png';
import Load from '../../components/reuse/Load';
import { format } from 'date-fns';
import './public.css';
import NotFound from '../NotFound/NotFound';

const PublicEventPage = () => {
    const { customUrl } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState(null);
    const [promoError, setPromoError] = useState("");
    const [isApplyingPromo, setIsApplyingPromo] = useState(false);
    const [isEventNotFound, setIsEventNotFound] = useState(false);
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [platformFee, setPlatformFee] = useState(0);
    const [calculatedFee, setCalculatedFee] = useState(0);
    const [subtotalPrice, setSubtotalPrice] = useState(0);
    const [finalTotalPrice, setFinalTotalPrice] = useState(0);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        const fetchEventAndFee = async () => {
            try {
                setLoading(true);
                setIsEventNotFound(false);
                const eventResponse = await getEventByCustomUrl(customUrl);
                const eventData = eventResponse.data.event;
                setEvent(eventData);

                try {
                    const feeResponse = await getPlatformFee();
                    setPlatformFee(feeResponse?.data?.feePercentage || 3);
                } catch (feeError) {
                    console.error("Failed to fetch platform fee, using default 3%:", feeError);
                    setPlatformFee(3);
                }
            } catch (error) {
                console.error('Error details:', error);
                if (error.response?.status === 404) {
                    setIsEventNotFound(true);
                } else if (error.response?.status === 410) {
                    toast.info('This event has ended');
                } else {
                    toast.error('Error loading event');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEventAndFee();
    }, [customUrl]);

    useEffect(() => {
        if (!event || selectedTickets.length === 0) {
            setSubtotalPrice(0);
            setCalculatedFee(0);
            setFinalTotalPrice(0);
            return;
        }

        let subtotal = selectedTickets.reduce((sum, item) => {
            const ticket = event.tickets.find(t => t._id === item.ticketId);
            return sum + (ticket.price * item.quantity);
        }, 0);

        let finalPriceAfterPromo = subtotal;
        let discountAmount = 0;

        if (appliedPromo) {
            if (appliedPromo.discountType === 'percentage') {
                discountAmount = finalPriceAfterPromo * (appliedPromo.value / 100);
                finalPriceAfterPromo -= discountAmount;
            } else if (appliedPromo.discountType === 'fixed') {
                discountAmount = appliedPromo.value;
                finalPriceAfterPromo -= discountAmount;
            }
        }

        finalPriceAfterPromo = Math.max(0, finalPriceAfterPromo);

        let fee = 0;
        const firstSelectedTicketDetails = event.tickets.find(t => t._id === selectedTickets[0].ticketId);

        if (firstSelectedTicketDetails && firstSelectedTicketDetails.transferFee) {
            fee = finalPriceAfterPromo * (platformFee / 100);
        }

        const roundedSubtotal = parseFloat(subtotal.toFixed(2));
        const roundedFee = parseFloat(fee.toFixed(2));
        const roundedFinalPrice = parseFloat((finalPriceAfterPromo + fee).toFixed(2));

        setSubtotalPrice(roundedSubtotal);
        setCalculatedFee(roundedFee);
        setFinalTotalPrice(roundedFinalPrice);

    }, [selectedTickets, appliedPromo, event, platformFee]);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleApplyPromo = async () => {
      if (!promoCode) {
          setPromoError("Please enter a promo code.");
          return;
      }

      if (selectedTickets.length === 0) {
          setPromoError("Please select tickets before applying a promo code.");
          return;
      }

      setIsApplyingPromo(true);
      try {
          const ticketIds = selectedTickets.map(ticket => ticket.ticketId);
          const response = await validatePromoCode(event._id, promoCode, ticketIds);
          setAppliedPromo(response.promoCode);
          setPromoError("");
          toast.success("Promo code applied successfully!");
      } catch (error) {
          setAppliedPromo(null);
          setPromoError(error.response?.data?.message || "Failed to apply promo code.");
          toast.error(error.response?.data?.message || "Failed to apply promo code.");
      } finally {
          setIsApplyingPromo(false);
      }
  };

    const handleCheckout = () => {
        if (selectedTickets.length === 0) {
            toast.error('Please select at least one ticket');
            return;
        }

        if (!formData.fullName || !formData.email || !formData.phoneNumber) {
            toast.error('Please fill all attendee information');
            return;
        }

        const firstTicketDetails = event.tickets.find(t => t._id === selectedTickets[0].ticketId);

        if (firstTicketDetails && firstTicketDetails.transferFee) {
            setShowFeeModal(true);
        } else {
            handlePayment();
        }
    };

    const handlePayment = async () => {
        try {
            setProcessingPayment(true);
            setShowFeeModal(false);

            const firstTicket = selectedTickets[0];

            const paymentData = {
                ...formData,
                amount: finalTotalPrice,
                eventId: event._id,
                ticketId: firstTicket.ticketId,
                quantity: firstTicket.quantity,
                customTicketUrl: customUrl,
                promoCode: appliedPromo ? appliedPromo.code : null,
            };

            const { data } = await initializePayment(paymentData);

            setProcessingPayment(false);
            window.location.href = data.authorizationUrl;

        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Payment initialization failed');
        } finally {
            setProcessingPayment(false);
        }
    };

    useEffect(() => {
        const verifyPaymentFromCallback = async () => {
            const params = new URLSearchParams(window.location.search);
            const reference = params.get('reference');

            if (reference) {
                try {
                    toast.success('Payment successful!');
                    navigate(window.location.pathname, { replace: true });
                } catch (error) {
                    toast.error('Payment verification failed');
                }
            }
        };

        verifyPaymentFromCallback();
    }, [navigate]);

    if (isEventNotFound) {
        return <NotFound />;
    }

    if (loading) return <Load />;

    if (!event) return <div className="container py-5 text-center">No event found</div>;

    return (
        <div className="public-event-page container">

            <div className='public-event-header'>
                <div className='logo-img-container'>
                    <img src={Logo} alt="" />
                </div>
                <div>
                    <Link to="/events/listing" className="button">View Events</Link>
                </div>
            </div>

            <div className="event-content-row">
                <div className="event-image-column">
                    <img
                        src={event.eventImage}
                        alt={event.eventName}
                        className="event-image"
                    />
                </div>

                <div className="event-header">
                    <h1 className="event-title">{event.eventName}</h1>
                    <p className="event-meta">
                        {format(new Date(event.startDate), 'EEEE, MMMM d, yyyy')} • {event.location}
                    </p>
                    <h3>About this event</h3>
                    <p className="event-description">{event.description}</p>
                </div>
            </div>

            <div className="ticket-card">
                <div className="ticket-card-body">
                    <h5 className="ticket-title">Tickets</h5>
                    {event.tickets?.map(ticket => (
                        <div key={ticket._id} className="ticket-item">
                            <div className="ticket-item-inner">
                                <div>
                                    <h6 className="ticket-type">{ticket.ticketType}</h6>
                                    <p className="ticket-price">₦{ticket.price.toLocaleString()}</p>
                                </div>
                                <input
                                    type="number"
                                    min="0"
                                    value={selectedTickets.find(t => t.ticketId === ticket._id)?.quantity || 0}
                                    onChange={(e) => {
                                        const quantity = parseInt(e.target.value) || 0;
                                        const newSelection = [...selectedTickets];
                                        const existingIndex = newSelection.findIndex(t => t.ticketId === ticket._id);

                                        if (existingIndex >= 0) {
                                            if (quantity > 0) {
                                                newSelection[existingIndex].quantity = quantity;
                                            } else {
                                                newSelection.splice(existingIndex, 1);
                                            }
                                        } else if (quantity > 0) {
                                            newSelection.push({ ticketId: ticket._id, quantity });
                                        }

                                        setSelectedTickets(newSelection);
                                    }}
                                    className="ticket-quantity-input"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="ticket-form">
                    <h3 className="ticket-title">Attendee Information</h3>
                    <div className="form-group">
                        <label htmlFor="fullName">Full Name:</label>
                        <input
                            type="text"
                            id="fullName"
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="phone">Phone Number:</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            placeholder="Enter your phone number"
                            required
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                        />
                    </div>
                    <div className="promo-code-section">
                        <h4 className="ticket-title">Have a promo code?</h4>
                        <div className="form-group promo-group">
                            <input
                                type="text"
                                placeholder="Enter promo code"
                                value={promoCode}
                                onChange={(e) => {
                                    setPromoCode(e.target.value);
                                    setPromoError("");
                                }}
                                className="promo-input"
                            />
                            <button
                                className="promo-apply-btn"
                                onClick={handleApplyPromo}
                                disabled={isApplyingPromo}
                            >
                                {isApplyingPromo ? 'Applying...' : 'Apply'}
                            </button>
                        </div>
                        {promoError && <p className="promo-message error-message">{promoError}</p>}
                        {appliedPromo && (
                            <p className="promo-message success-message">
                                Promo code applied! You'll get a {appliedPromo.discountType === 'percentage' ? `${appliedPromo.value}%` : `₦${appliedPromo.value}`} discount.
                            </p>
                        )}
                    </div>

                    {selectedTickets.length > 0 && (
                        <div className="summary-section">
                            <div className="summary-item">
                                <span>Ticket Amount:</span>
                                <span>₦{subtotalPrice.toFixed(2).toLocaleString()}</span>
                            </div>
                            {appliedPromo && (
                                <div className="summary-item discount-item">
                                    <span>Subtotal:</span>
                                    <span>₦{(subtotalPrice - (subtotalPrice - finalTotalPrice + calculatedFee)).toFixed(2).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        className="submit-btn"
                        disabled={selectedTickets.length === 0 || processingPayment}
                        onClick={handleCheckout}
                    >
                        {processingPayment ? 'Processing...' : `Proceed to Checkout`}
                    </button>
                </div>

            </div>
            {showFeeModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h4>Platform Fee</h4>
                        <p>
                            A platform fee of ₦{calculatedFee.toLocaleString()} will be added to your total.
                            Your final total will be ₦{finalTotalPrice.toLocaleString()}.
                        </p>
                        <div className="modal-actions">
                            <button onClick={() => setShowFeeModal(false)} className="cancel-btn">Cancel</button>
                            <button onClick={handlePayment} className="proceed-btn">Proceed</button>
                        </div>
                    </div>
                </div>
            )}
            <footer className="public-event-footer">
                <div className="footer-content">
                    <p>© {currentYear} Tickify. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicEventPage;