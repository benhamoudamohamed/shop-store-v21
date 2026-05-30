import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response } from 'express';
import { resolve } from 'path';

@Injectable()
export class FrontendMiddleware implements NestMiddleware {
  use(req: Request, res: Response) {
    res.sendFile(resolve('../../../../../dist/apps/client/index.html'));
  }
}
