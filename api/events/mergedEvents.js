import { getPublicDays } from '../day/dayData';
import { getPublicEvents, updateEvent, getEventsByDay } from './eventData';
import { clientCredentials } from '../../utils/client';

const dbUrl = clientCredentials.databaseURL;

const handleDayEvents = (dayFirebaseKey, eventsFbkArr) => new Promise((resolve, reject) => {
  const updateEvents = eventsFbkArr.map((firebaseKey) => updateEvent({ firebaseKey, eventOfDay: dayFirebaseKey }));
  Promise.all(updateEvents).then(() => {
    getEventsByDay(dayFirebaseKey).then((eventsArr) => {
      const removeDayArr = eventsArr.filter((event) => !eventsFbkArr.includes(event.firebaseKey));
      if (removeDayArr.length) {
        const update = { eventOfDay: '' };
        const removeTheDay = removeDayArr.map((evnt) => updateEvent({ ...evnt, ...update }));
        Promise.all(removeTheDay).then(resolve);
      }
    }).then(resolve).catch(reject);
  });
});

const getEventsAndDays = () => new Promise((resolve, reject) => {
  getPublicEvents().then((eventsArr) => {
    getPublicDays().then((daysArr) => {
      resolve([...eventsArr, ...daysArr]);
    }).catch(reject);
  });
});

/// used in search
const getEventCities = () => new Promise((resolve, reject) => {
  getPublicEvents().then((eventsArray) => {
    const returnArray = eventsArray.map((event) => ({
      name: 'city',
      value: event.city,
      label: event.city,
    }));
    console.warn(returnArray);
    resolve(returnArray);
  }).catch(reject);
});

const getPublicContentByUser = (uid) => new Promise((resolve, reject) => {
  fetch(`${dbUrl}/events?id=${uid}&public=True`)
    .then((response) => response.json())
    .then(resolve)
    .catch(reject);
});

const getRandomPublicEvent = () => new Promise((resolve, reject) => {
  fetch(`${dbUrl}/events?featured=True`)
    .then((response) => response.json())
    .then(resolve)
    .catch(reject);
});

// eslint-disable-next-line import/prefer-default-export
export {
  handleDayEvents, getEventsAndDays, getEventCities, getPublicContentByUser, getRandomPublicEvent,
};
