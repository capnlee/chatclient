const publicVapidKey = 'BB3TtNlNuZn6iyZsBM2H9scf1qD-8yrh6sLF82rooxRH5YtLi4VLc61HjCsdHoTfZyX_nsHONDMcvKC5a5RMOXc';

if ('serviceWorker' in navigator) {
  run().catch(error => console.error(error));
}

async function run() {
  const registration = await navigator.serviceWorker.
  
  register('/chat/worker.js', {scope: '/chat/'});

  const subscription = await registration.pushManager.
    subscribe({
      userVisibleOnly: true,
      // The `urlBase64ToUint8Array()` function is the same as in
      // https://www.npmjs.com/package/web-push#using-vapid-key-for-applicationserverkey
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });

  await fetch('https://capnlee.co.uk/chat/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: {
      'content-type': 'application/json'
    }
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
 
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
 
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}