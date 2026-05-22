import { Router } from 'express';
import {
  getMyNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '../controllers/notification.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getMyNotifications);
router.patch('/:id/read', markNotificationAsRead);
router.post('/read-all', markAllNotificationsAsRead);

export default router;
