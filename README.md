<div align="center">
  <h1>Notifier</h1>
  <p><strong>An open source offline-first notification listener for Android that syncs everywhere</strong></p>
</div>

<div align="center">
  <img src="https://github.com/dotnetdreamer/notifier/blob/master/_docs/screenshots/launch-on-startup.gif" width="270" />
  <img src="https://github.com/dotnetdreamer/notifier/blob/master/_docs/screenshots/notification-arrive.gif" width="270" />
</div>

## Introducation
The repository consists of two projects i.e **notifier-api** and **notifier-pwa**. API project is built with [NestJS](https://nestjs.com/) and PWA is built with [Ionic](https://ionicframework.com/) and [Capacitor](https://capacitorjs.com/).

## Features
1. Capture notifications as soon as arrive **(even when they are deleted by sender)**
2. Autostart app on Device Boot/Re-Boot
3. Ignore Duplicate notifications
4. Define your own custom ignore list
5. And more...

## <a name="quick-start"></a>Quick Start
### Development
1. Clone this repository or Download it as a zip
2. Switch to master branch
3. Navigate to i.e **notifier-pwa** directory and run `npm i`.
5. Now navigate to **notifier-pwa** and run `npm i`
6. Navigate to **notifier-api** directory (if not already) and run `npm run start`. This will kick in the NestJs in debug mode
7. Note down the **notifier-api** project address and port (usually http://localhost:3000) and go to **notifier-pwa -> src -> assets -> env.js** and add the API urls there in `BASE_URL` and `BASE_API_URL`
8. In **notifier-pwa** project, go to **android -> app -> src -> main -> res -> xml -> network_security_config.xml** file and update your API url there. If you don't do this, you will get typical **net::ERR_CLEARTEXT_NOT_PERMITTED** error 
9. Open another command line and navigate to **notifier-pwa** and run ionic serve
10. By this time, you should have both projects running

### Production
#### API
1. Navigate to **notifier-api** directory and run `npm run build`. This will generate the production build of API project inside **dist** directory
2. Copy the **package.json** from **notifier-api** and paste it to **notifier-api -> dist**. Now you can zip the **dist** and deploy it to your hosting

#### PWA
1. Navigate to **notifier-pwa** directory and run `ionic build --prod` which will generate production build inside **www* directory
2. Go inside the **www -> assets** directory and change the `BASE_URL` and `BASE_API_URL` to your deployed API URL
3. (Optional) If you want to keep your **PWA** together with **API** then simply copy the contents of **www** directory to **notifier-api -> client folder**

#### Android
1. Navigate to **notifier-pwa** directory and run `ionic build --prod` which will generate production build inside **www* directory
2. Now run `npx cap copy` and then `npx cap update`. You can also follow [official capacitor](https://capacitorjs.com/docs/android) guide.
3. Now you can generate your `apk` from Android Studio

## Author(s)
* **Idrees Khan** (dotnetdreamer)

## Follow:
[GitHub](https://github.com/dotnetdreamer)
| [Twitter](https://twitter.com/dotnetdreamer)

## License
```
The MIT License (MIT)

Copyright (c) 2016 Rinto Jose (rintoj)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
