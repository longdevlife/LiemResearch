import { Notification } from '../models/Notification.js';
import { User } from '../models/User.js';
import { emitNotificationToRole, emitNotificationToUser } from '../config/socket.js';

async function createNotificationsForUserFilter(filter, payload, emitRole) {
  const recipients = await User.find({
    ...filter,
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  }).select('_id');

  if (recipients.length === 0) {
    return 0;
  }

  const docs = recipients.map((recipient) => ({
    recipient: recipient._id,
    ...payload,
  }));

  await Notification.insertMany(docs);

  const eventPayload = {
    type: payload.type,
    title: payload.title,
    paper: payload.paper,
    count: docs.length,
    createdAt: new Date().toISOString(),
  };

  for (const doc of docs) {
    emitNotificationToUser(doc.recipient, eventPayload);
  }

  if (emitRole) {
    emitNotificationToRole(emitRole, { ...eventPayload, role: emitRole });
  }

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
    },
    'admin'
  );
}

export async function notifyUsersPaperApproved({ paperId, paperTitle, requesterName, actorId }) {
  return createNotificationsForUserFilter({ role: 'user' }, {
    actor: actorId,
    paper: paperId,
    type: 'paper_approved',
    title: 'New paper available',
    message: `${requesterName} has a newly approved paper: ${paperTitle}`,
  }, 'user');
}
