import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, IsEnum } from 'class-validator';

export class QwenRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsOptional()
  @IsNumber()
  max_tokens?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsString()
  system?: string;
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  EXECUTIVE = 'executive'
}

export class CvAtsRequestDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsEnum(ExperienceLevel)
  @IsOptional()
  experienceLevel?: ExperienceLevel;

  @IsArray()
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsOptional()
  experiences?: {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }[];

  @IsArray()
  @IsOptional()
  education?: {
    institution: string;
    degree: string;
    field?: string;
    startDate: string;
    endDate?: string;
  }[];

  @IsString()
  @IsOptional()
  targetJob?: string;

  @IsArray()
  @IsOptional()
  keywords?: string[];
}