import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';

async function createNotificationsForUserFilter(filter, payload) {
  const recipients = await User.find({ ...filter, status: 'active' }).select('_id');

  if (recipients.length === 0) {
    return 0;
  }

  const docs = recipients.map((recipient) => ({
    recipient: recipient._id,
    ...payload,
  }));

  await Notification.insertMany(docs);

  return docs.length;
}

export async function notifyAdminsPaperSubmitted({ paperId, paperTitle, requesterName, actorId }) {
  return createNotificationsForUserFilter(
    { role: 'admin' },
    {
      actor: actorId,
      paper: paperId,
      type: 'paper_submitted',
      title: 'New paper request submitted',
      message: `${requesterName} submitted a new paper request: ${paperTitle}`,
    }
  );
}

export async function notifyUsersPaperApproved({ paperId, paperTitle, requesterName, actorId, excludeUserId }) {
  const filter = { role: 'user' };

  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }

  return createNotificationsForUserFilter(filter, {
    actor: actorId,
    paper: paperId,
    type: 'paper_approved',
    title: 'New paper available',
    message: `${requesterName} has a newly approved paper: ${paperTitle}`,
  });
}
