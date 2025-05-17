import { PartialType } from '@nestjs/mapped-types';
import { CreateQwenDto } from './create-qwen.dto';

export class UpdateQwenDto extends PartialType(CreateQwenDto) {}
