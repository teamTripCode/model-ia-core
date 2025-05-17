import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { QwenService } from './qwen.service';
import { CvAtsRequestDto, QwenRequestDto } from './dto/request.dto';
import { CvAtsResponseDto, QwenResponseDto } from './dto/response.dto';

@Controller('qwen')
export class QwenController {
  constructor(private readonly qwenService: QwenService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generateText(@Body() requestDto: QwenRequestDto): Promise<QwenResponseDto> {
    return this.qwenService.generateText(requestDto);
  }

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck(): Promise<{ status: string; model: string }> {
    return this.qwenService.healthCheck();
  }

  @Post('generate-cv-ats')
  @HttpCode(HttpStatus.OK)
  async generateCvAts(@Body() requestDto: CvAtsRequestDto): Promise<CvAtsResponseDto> {
    return this.qwenService.generateCvAts(requestDto);
  }
}
