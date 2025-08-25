import { useState, useEffect } from 'react';
import { getEventsByOrganizer, generateQRCode } from '../../services/eventApi';
import './qr.css';
import Load from '../../components/reuse/Load';

const QR = () => {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEventName, setSelectedEventName] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [qrCodeImage, setQrCodeImage] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // useEffect to fetch events when the component mounts
  useEffect(() => {
    const fetchAndSetEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventsData = await getEventsByOrganizer();
        setEvents(eventsData);
        if (eventsData.length > 0) {
          setSelectedEventId(eventsData[0]._id);
        }
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndSetEvents();
  }, []);

  // Function to handle QR code generation
  const handleGenerateQr = async (eventId, action) => {
    const event = events.find(e => e._id === eventId);
    
    // Basic validation to ensure a valid event is selected
    if (!event || !event.eventName || event.eventName.trim() === '') {
      const errorMessage = "Cannot generate QR code: Event name is missing or invalid. Please select a valid event.";
      console.error("Error generating QR Code:", errorMessage);
      setError(errorMessage);
      setIsGenerating(false);
      return;
    }

    // Set state to indicate that generation is in progress
    setIsGenerating(true);
    setError(null);
    setQrCodeImage(null); // Clear previous image
    setSelectedEventName(event.eventName);
    setSelectedAction(action);

    try {
      const qrData = {
        eventId: event._id,
        qrReason: action,
      };
      
      const base64ImageUrl = await generateQRCode(qrData);
      setQrCodeImage(base64ImageUrl); // Update state with the new image URL

    } catch (err) {
      console.error("Error generating QR Code:", err);
      setError("Failed to generate QR code. Please ensure your data is valid.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Conditional Rendering for different states ---
  if (error) {
    return (
      <div className="app-container error-container">
        <style>{`
          .app-container { min-height: 100vh; background-color: #f3f4f6; padding: 2rem; display: flex; justify-content: center; align-items: center; font-family: 'Inter', sans-serif; gap: 2rem; flex-wrap: wrap; }
          .error-message { text-align: center; font-weight: 600; color: #ef4444; background-color: #fee2e2; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        `}</style>
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <Load />
    );
  }

  return (
    <div className="allevents-container">
      <div className="panel">
        <h1 className="title">Event QR Code Generator</h1>
        <h2 className="section-title">Select an Existing Event</h2>
        {events.length > 0 ? (
          <div className="event-select-container">
            <select
              className="event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              {events.map((event, index) => (
                <option key={event._id} value={event._id}>
                  {event.eventName}
                </option>
              ))}
            </select>
            <div className="action-buttons">
              <button
                onClick={() => handleGenerateQr(selectedEventId, 'buy')}
                className="action-button"
                disabled={!selectedEventId || isGenerating}
              >
                Buy Ticket
              </button>
              <button
                onClick={() => handleGenerateQr(selectedEventId, 'checkin')}
                className="action-button checkin"
                disabled={!selectedEventId || isGenerating}
              >
                Check In
              </button>
            </div>
          </div>
        ) : (
          <p className="no-events-message">No events found. Please add events to your database for them to appear here.</p>
        )}
      </div>
      
      <div className="qr-panel">
        <h2 className="section-title">Event QR Code</h2>
        <div className="qr-container">
          {isGenerating ? (
            <p className="qr-caption">Generating QR code...</p>
          ) : qrCodeImage ? (
            // This is the key fix: the img src now correctly handles the Base64 data string
            <img src={qrCodeImage} alt={`QR code for ${selectedEventName} - ${selectedAction}`} className="qr-image" />
          ) : (
            <p className="qr-caption">Select an event and action to generate a QR code.</p>
          )}
        </div>
        {/* {selectedEventName && (
          <p className="qr-caption">
            QR Code for: <strong>{selectedEventName}</strong><br />Action: <strong>{selectedAction}</strong>
          </p>
        )} */}
      </div>
    </div>
  );
};

export default QR;
