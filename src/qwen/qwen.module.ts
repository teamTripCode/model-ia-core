import { Module } from '@nestjs/common';
import { QwenService } from './qwen.service';
import { QwenController } from './qwen.controller';
import { CvModule } from 'src/cv/cv.module';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Module({
  imports: [CvModule],
  controllers: [QwenController],
  providers: [QwenService, JwtAuthGuard],
})
export class QwenModule {}
