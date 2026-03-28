import { request } from '../http/client.js';

export const assistantApi = {
  insights: (userId) =>
    request(`/users/${userId}/assistant/insights`),
  chat: (userId, message) =>
    request(`/users/${userId}/assistant/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),
};
