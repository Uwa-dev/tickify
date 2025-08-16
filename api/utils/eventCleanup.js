import cron from 'node-cron';
import Event from '../models/eventModel';

// Run daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const result = await Event.updateMany(
      { 
        endDate: { $lt: new Date() },
        status: 'active'
      },
      { $set: { status: 'ended' } }
    );
    console.log(`Marked ${result.nModified} events as ended`);
  } catch (error) {
    console.error('Error marking ended events:', error);
  }
});