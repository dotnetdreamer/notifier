<div align="center">
  <h1>Notifier</h1>
  <p><strong>An open source offline-first notification listener for Android that syncs everywhere</strong></p>
</div>

## Introducation
The repository consists of two projects i.e **notifier-api** and **notifier-pwa**. API project is built with [NestJS](https://nestjs.com/) and PWA is built with [Ionic](https://ionicframework.com/) and [Capacitor](https://capacitorjs.com/).

## <a name="quick-start"></a>Quick Start
1. Clone this repository or Download it as a zip
2. Switch to master branch
3. Navigate to i.e **notifier-pwa** directory and run `npm i`.
5. Now navigate to **notifier-pwa** and run `npm i`
6. Navigate to **notifier-api** directory (if not already) and run `npm run start`. This will kick in the NestJs in debug mode
7. Note down the **notifier-api** project address and port (usually http://localhost:3000) and go to **notifier-pwa** -> src -> assets -> env.js and add the API urls there in `BASE_URL` and `BASE_API_URL`
8. Open another command line and navigate to ***notifier-pwa** and run ionic serve
9. By this time, you should have both projects running
