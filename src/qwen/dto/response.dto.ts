export class QwenResponseDto {
  id: string;
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class CvAtsResponseDto {
  professionalSummary: string;
  formattedExperiences: {
    company: string;
    position: string;
    period: string;
    bullets: string[];
  }[];
  formattedEducation: {
    institution: string;
    degree: string;
    period: string;
    details?: string;
  }[];
  formattedSkills: string[];
  additionalSections?: {
    [key: string]: string | string[];
  };
}