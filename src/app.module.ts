import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QwenModule } from './qwen/qwen.module';
import { CvModule } from './cv/cv.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    QwenModule,
    CvModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
