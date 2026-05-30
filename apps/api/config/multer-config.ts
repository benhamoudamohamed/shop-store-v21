import { diskStorage } from 'multer';
import { existsSync } from 'fs';
import { customAlphabet } from 'nanoid';
import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';

const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);

export const multerOptions = {
    
    storage: diskStorage({
        destination: './upload',
        filename: (req, file, cb) => {
            const path = `./upload/${file.originalname}`;

            if (existsSync(path)) {
                return cb(new HttpException(`${file.originalname} : Image Already Exists`, HttpStatus.BAD_REQUEST), '');
            }

            if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
                return cb(new HttpException(`${extname(file.originalname)} : Wrong File Type`, HttpStatus.BAD_REQUEST), '');
            }
            cb(null, `${nanoid()}_${file.originalname}`);
        },
    }),
    limits: { fileSize: 1 * 1024 * 1024 }, // This is exactly 1 MB
};