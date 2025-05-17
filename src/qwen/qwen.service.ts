import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { CvAtsResponseDto, QwenResponseDto } from './dto/response.dto';
import { CvAtsRequestDto, QwenRequestDto } from './dto/request.dto';
import { CvService } from 'src/cv/cv.service';

@Injectable()
export class QwenService {
  private readonly logger = new Logger(QwenService.name);
  private readonly apiUrl = process.env.MODEL_URI!;
  private readonly modelName = process.env.NAME_MODEL!;

  constructor(private readonly cvService: CvService) { }

  async generateText(requestDto: QwenRequestDto): Promise<QwenResponseDto> {
    try {
      // Configurar la solicitud para la API de Ollama
      const apiRequest = {
        model: this.modelName,
        prompt: requestDto.prompt,
        stream: false,
        options: {
          temperature: requestDto.temperature || 0.7,
          num_predict: requestDto.max_tokens || 256,
        },
        system: requestDto.system || '',
      };

      this.logger.log(`Enviando solicitud a ${this.apiUrl} para el modelo ${this.modelName}`);

      const response = await axios.post(this.apiUrl, apiRequest);

      if (response.status !== 200) {
        throw new HttpException(
          `Error en la API de Ollama: ${response.statusText}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Limpiar la respuesta para quitar los tags <think>...</think> si existen
      let cleanResponse = response.data.response || '';
      cleanResponse = cleanResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // Transformar la respuesta de Ollama al formato DTO
      const result: QwenResponseDto = {
        id: response.data.id || 'unknown',
        model: response.data.model || this.modelName,
        created_at: new Date().toISOString(),
        response: cleanResponse,
        done: true,
        total_duration: response.data.total_duration,
        load_duration: response.data.load_duration,
        prompt_eval_count: response.data.prompt_eval_count,
        eval_count: response.data.eval_count,
        eval_duration: response.data.eval_duration,
      };

      return result;
    } catch (error) {
      this.logger.error(`Error al conectar con el modelo Qwen3: ${error.message}`);

      if (error.response) {
        this.logger.error(`Respuesta de error: ${JSON.stringify(error.response.data)}`);
      }

      throw new HttpException(
        'Error al comunicarse con el modelo Qwen3',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async generateCvAts(requestDto: CvAtsRequestDto): Promise<CvAtsResponseDto> {
    try {
      // Construir un prompt detallado para la generación del CV en formato ATS
      let prompt = `Crea un CV en formato ATS optimizado para ${requestDto.fullName}, 
                    aspirando al puesto de ${requestDto.jobTitle}.`;

      if (requestDto.targetJob) {
        prompt += ` El CV debe estar enfocado específicamente para un puesto de ${requestDto.targetJob}.`;
      }

      if (requestDto.summary) {
        prompt += ` Información personal: ${requestDto.summary}`;
      }

      if (requestDto.skills && requestDto.skills.length > 0) {
        prompt += ` Habilidades: ${requestDto.skills.join(', ')}.`;
      }

      if (requestDto.experiences && requestDto.experiences.length > 0) {
        prompt += ' Experiencia profesional:';
        requestDto.experiences.forEach(exp => {
          prompt += ` ${exp.position} en ${exp.company} (${exp.startDate} - ${exp.endDate || 'Presente'})`;
          if (exp.description) {
            prompt += `: ${exp.description}`;
          }
          prompt += '.';
        });
      }

      if (requestDto.education && requestDto.education.length > 0) {
        prompt += ' Educación:';
        requestDto.education.forEach(edu => {
          prompt += ` ${edu.degree} en ${edu.field || ''} en ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Presente'}).`;
        });
      }

      if (requestDto.keywords && requestDto.keywords.length > 0) {
        prompt += ` Incluye estas palabras clave: ${requestDto.keywords.join(', ')}.`;
      }

      prompt += ` Genera un resumen profesional conciso y logros cuantificables para cada experiencia laboral. 
                  Usa verbos de acción poderosos. El contenido debe ser profesional y no debe parecer generado por IA. 
                  Evita frases genéricas o clichés. Enfócate en logros medibles y específicos. Usa lenguaje natural y fluido.
                  Responde SOLO con un objeto JSON con los siguientes campos:
                  - professionalSummary: un párrafo de resumen profesional
                  - formattedExperiences: array de objetos con company, position, period y bullets (array de textos)
                  - formattedEducation: array de objetos con institution, degree, period y details opcional
                  - formattedSkills: array de habilidades reorganizadas y optimizadas
                  - additionalSections (opcional): objeto con secciones adicionales relevantes`;

      const system = `Eres un experto en redacción de currículums optimizados para sistemas ATS (Applicant Tracking System).
                      Tu tarea es generar contenido de CV profesional que no parezca generado por IA. Usa lenguaje natural, específico y orientado a resultados.
                      Devuelve SOLO un objeto JSON válido con las secciones solicitadas sin ninguna explicación adicional.`;

      const response = await this.generateText({
        prompt: prompt,
        max_tokens: 2000, // Número alto para asegurar respuesta completa
        temperature: 0.4, // Temperatura baja para mantener profesionalismo
        system: system,
      });

      try {
        // Intentar parsear la respuesta JSON
        let jsonResponse = response.response.trim();

        // Si la respuesta comienza o termina con backticks, eliminarlos
        if (jsonResponse.startsWith('```json')) {
          jsonResponse = jsonResponse.substring(7);
        } else if (jsonResponse.startsWith('```')) {
          jsonResponse = jsonResponse.substring(3);
        }

        if (jsonResponse.endsWith('```')) {
          jsonResponse = jsonResponse.substring(0, jsonResponse.length - 3);
        }

        jsonResponse = jsonResponse.trim();

        // Intentar forzar la corrección de errores comunes en el JSON
        // 1. Reemplazar "ágile" por "ágiles" (error observado)
        jsonResponse = jsonResponse.replace(/ágile/g, 'ágiles');

        // 2. Asegurar que no haya comas extra al final de arrays/objetos
        jsonResponse = jsonResponse.replace(/,(\s*[\]}])/g, '$1');

        // 3. Asegurar que las comillas sean consistentes
        jsonResponse = jsonResponse.replace(/'/g, '"');

        this.logger.log('JSON procesado: ' + jsonResponse);

        const parsedResponse = JSON.parse(jsonResponse);

        // Comprobar que tenga la estructura esperada
        if (!parsedResponse.professionalSummary ||
          !Array.isArray(parsedResponse.formattedExperiences) ||
          !Array.isArray(parsedResponse.formattedEducation) ||
          !Array.isArray(parsedResponse.formattedSkills)) {
          throw new Error('La respuesta JSON no tiene el formato esperado');
        }

        return parsedResponse as CvAtsResponseDto;
      } catch (parseError) {
        this.logger.error(`Error al parsear la respuesta JSON: ${parseError.message}`);
        this.logger.error(`Respuesta recibida: ${response.response}`);

        // Intento alternativo usando una solución manual (regex)
        try {
          const cleanedResponse: CvAtsResponseDto = {
            professionalSummary: this.cvService.extractField(response.response, 'professionalSummary'),
            formattedExperiences: this.cvService.extractExperiences(response.response),
            formattedEducation: this.cvService.extractEducation(response.response),
            formattedSkills: this.cvService.extractSkills(response.response),
            additionalSections: {}
          };

          // Verificar si tenemos al menos los datos básicos
          if (cleanedResponse.professionalSummary &&
            cleanedResponse.formattedExperiences.length > 0 &&
            cleanedResponse.formattedSkills.length > 0) {
            return cleanedResponse;
          }
        } catch (e) {
          this.logger.error(`Error en extracción manual: ${e.message}`);
        }

        // Si todo falla, devolver una respuesta vacía con la respuesta raw
        return {
          professionalSummary: 'No se pudo generar el resumen profesional automáticamente. La respuesta sin procesar está disponible en additionalSections.rawResponse.',
          formattedExperiences: [],
          formattedEducation: [],
          formattedSkills: [],
          additionalSections: {
            rawResponse: response.response
          }
        };
      }
    } catch (error) {
      this.logger.error(`Error al generar CV ATS: ${error.message}`);
      throw new HttpException(
        'Error al generar el CV en formato ATS',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async healthCheck(): Promise<{ status: string; model: string }> {
    try {
      // Intenta una solicitud simple para verificar que el servicio esté en funcionamiento
      const response = await axios.post(this.apiUrl, {
        model: this.modelName,
        prompt: 'Hola',
        stream: false,
      });

      return {
        status: 'ok',
        model: this.modelName,
      };
    } catch (error) {
      this.logger.error(`Error en health check: ${error.message}`);
      throw new HttpException(
        'El servicio Qwen3 no está disponible',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}