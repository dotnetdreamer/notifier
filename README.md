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

## Author(s)
* **Idrees Khan** (dotnetdreamer)
[GitHub](https://github.com/dotnetdreamer)
| [Twitter](https://twitter.com/dotnetdreamer)

Follow me:

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