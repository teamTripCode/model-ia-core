import { Injectable } from '@nestjs/common';

@Injectable()
export class CvService {
  public extractField(text: string, fieldName: string): string {
    const regex = new RegExp(`["']${fieldName}["']\\s*:\\s*["']([^"']*)["']`, 'i');
    const match = text.match(regex);
    return match ? match[1] : '';
  }

  public extractExperiences(text: string): any[] {
    try {
      const experiencesMatch = text.match(/["']formattedExperiences["']\s*:\s*\[([\s\S]*?)\]/i);
      if (!experiencesMatch || !experiencesMatch[1]) return [];

      const experiencesText = experiencesMatch[1];
      const experiencesArray: any[] = [];

      // Buscar objetos de experiencia individuales
      let bracketCount = 0;
      let currentExp = '';
      let inExp = false;

      for (let i = 0; i < experiencesText.length; i++) {
        const char = experiencesText[i];

        if (char === '{') {
          bracketCount++;
          inExp = true;
          currentExp += char;
        } else if (char === '}') {
          bracketCount--;
          currentExp += char;

          if (bracketCount === 0 && inExp) {
            try {
              // Limpiar y analizar la experiencia individual
              let cleanExp = currentExp.replace(/'/g, '"').replace(/,(\s*})/g, '$1');
              // Extraer datos clave usando regex para mayor robustez
              const company = this.extractFromObject(cleanExp, 'company');
              const position = this.extractFromObject(cleanExp, 'position');
              const period = this.extractFromObject(cleanExp, 'period');

              // Extraer bullets
              const bulletsMatch = cleanExp.match(/["']bullets["']\s*:\s*\[([\s\S]*?)\]/i);
              const bullets = bulletsMatch ?
                bulletsMatch[1].split(',')
                  .map(b => b.trim().replace(/^["']|["']$/g, ''))
                  .filter(b => b.length > 0) :
                [];

              experiencesArray.push({
                company,
                position,
                period,
                bullets
              });
            } catch (e) {
              // Ignorar experiencias que no se pueden parsear
            }

            currentExp = '';
            inExp = false;
          }
        } else if (inExp) {
          currentExp += char;
        }
      }

      return experiencesArray;
    } catch (e) {
      return [];
    }
  }

  public extractFromObject(objText: string, fieldName: string): string {
    const regex = new RegExp(`["']${fieldName}["']\\s*:\\s*["']([^"']*)["']`, 'i');
    const match = objText.match(regex);
    return match ? match[1] : '';
  }

  public extractEducation(text: string): any[] {
    try {
      const educationMatch = text.match(/["']formattedEducation["']\s*:\s*\[([\s\S]*?)\]/i);
      if (!educationMatch || !educationMatch[1]) return [];

      const educationText = educationMatch[1];
      const educationArray: any[] = [];

      // Similar a extractExperiences pero para educación
      let bracketCount = 0;
      let currentEdu = '';
      let inEdu = false;

      for (let i = 0; i < educationText.length; i++) {
        const char = educationText[i];

        if (char === '{') {
          bracketCount++;
          inEdu = true;
          currentEdu += char;
        } else if (char === '}') {
          bracketCount--;
          currentEdu += char;

          if (bracketCount === 0 && inEdu) {
            try {
              // Limpiar y analizar la educación individual
              let cleanEdu = currentEdu.replace(/'/g, '"').replace(/,(\s*})/g, '$1');

              const institution = this.extractFromObject(cleanEdu, 'institution');
              const degree = this.extractFromObject(cleanEdu, 'degree');
              const period = this.extractFromObject(cleanEdu, 'period');
              const details = this.extractFromObject(cleanEdu, 'details');

              educationArray.push({
                institution,
                degree,
                period,
                ...(details ? { details } : {})
              });
            } catch (e) {
              // Ignorar educación que no se puede parsear
            }

            currentEdu = '';
            inEdu = false;
          }
        } else if (inEdu) {
          currentEdu += char;
        }
      }

      return educationArray;
    } catch (e) {
      return [];
    }
  }

  public extractSkills(text: string): string[] {
    try {
      const skillsMatch = text.match(/["']formattedSkills["']\s*:\s*\[([\s\S]*?)\]/i);
      if (!skillsMatch || !skillsMatch[1]) return [];

      // Extraer habilidades individuales
      return skillsMatch[1]
        .split(',')
        .map(skill => skill.trim().replace(/^["']|["']$/g, ''))
        .filter(skill => skill.length > 0);
    } catch (e) {
      return [];
    }
  }
}
