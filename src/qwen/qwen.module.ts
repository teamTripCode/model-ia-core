import { Module } from '@nestjs/common';
import { QwenService } from './qwen.service';
import { QwenController } from './qwen.controller';
import { CvModule } from 'src/cv/cv.module';

@Module({
  imports: [CvModule],
  controllers: [QwenController],
  providers: [QwenService],
})
export class QwenModule {}
