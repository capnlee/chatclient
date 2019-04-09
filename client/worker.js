self.addEventListener('push', ev => {
  const data = ev.data.json();
  console.log('Got push', data);
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon
  });
});

self.addEventListener('notificationclick', function(event) {

  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://capnlee.co.uk/chat')
  );
});