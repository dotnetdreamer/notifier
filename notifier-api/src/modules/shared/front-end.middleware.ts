import { NestMiddleware, Injectable } from "@nestjs/common";
import { Request, Response } from 'express';
import * as path from 'path';

import { AppConstant } from "./app-constant";
import { AppLogger } from "./app-logger.service";

const resolvePath = (file: string) => path.resolve(`./client/${file}`);

@Injectable()
export class FrontendMiddleware implements NestMiddleware {
  private logger: AppLogger = new AppLogger();

  use(req: Request, res: Response, next: Function) {
    const { url } = req;
    this.logger.log(`Resolving url: ${url}`);

    if (url.indexOf(AppConstant.ROUTE_PREFIX) === 1) {
      this.logger.log(`Resolving Redirecting: ${url} to api`);
        // it starts with /api --> continue with execution
      next();
    } else if (AppConstant.ROUTE_ALLOWED_FILE_EXTENSIONS.filter(ext => url.indexOf(ext) > 0).length > 0) {
      this.logger.log(`Resolving Redirecting: ${url} to file`);
      // it has a file extension --> resolve the file
      res.sendFile(resolvePath(url));
    } else {
      this.logger.log(`Resolving Redirecting: ${url} to index.html`);
      // in all other cases, redirect to the index.html!
      res.sendFile(resolvePath('index.html'));
    }
  } 
}


// @Middleware()
//   export class FrontendMiddleware implements NestMiddleware {
//     resolve(...args: any[]) {
//       return (req, res, next) => {
//         const { url } = req;
//         if (url.indexOf(ROUTE_PREFIX) === 1) {
//           // it starts with /api --> continue with execution
//           next();
//         } else if (allowedExt.filter(ext => url.indexOf(ext) > 0).length > 0) {
//           // it has a file extension --> resolve the file
//           res.sendFile(resolvePath(url));
//         } else {
//           // in all other cases, redirect to the index.html!
//           res.sendFile(resolvePath('index.html'));
//         }
//       };
//     }
//   }