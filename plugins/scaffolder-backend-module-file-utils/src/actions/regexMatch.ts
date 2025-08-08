import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { z } from 'zod';

export const regexMatchAction = createTemplateAction<{
  text: string;
  pattern: string;
  flags?: string;
  extractGroup?: number;
}>({
  id: 'regex:match',
  description: 'Performs regex matching on text and extracts matches',
  schema: {
    input: z.object({
      text: z.string().describe('Text to search in'),
      pattern: z.string().describe('Regular expression pattern'),
      flags: z.string().default('g').describe('Regex flags (default: g for global)'),
      extractGroup: z.number().optional().describe('Specific capture group to extract (0 for full match)'),
    }),
    output: z.object({
      matches: z.array(z.string()).describe('Array of matched strings'),
      matchCount: z.number().describe('Number of matches found'),
      hasMatches: z.boolean().describe('Whether any matches were found'),
      firstMatch: z.string().optional().describe('First match found'),
    }),
  },
  async handler(ctx) {
    const { text, pattern, flags = 'g', extractGroup } = ctx.input;
    
    try {
      ctx.logger.info(`Performing regex match with pattern: ${pattern}`);
      
      const regex = new RegExp(pattern, flags);
      const matches: string[] = [];
      let match;
      
      if (flags.includes('g')) {
        // Global matching - find all matches
        while ((match = regex.exec(text)) !== null) {
          const extractedValue = extractGroup !== undefined 
            ? (match[extractGroup] || match[0])
            : match[0];
          matches.push(extractedValue);
          
          // Prevent infinite loop on zero-length matches
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        // Single match
        match = regex.exec(text);
        if (match) {
          const extractedValue = extractGroup !== undefined 
            ? (match[extractGroup] || match[0])
            : match[0];
          matches.push(extractedValue);
        }
      }
      
      ctx.logger.info(`Found ${matches.length} matches`);
      
      ctx.output('matches', matches);
      ctx.output('matchCount', matches.length);
      ctx.output('hasMatches', matches.length > 0);
      ctx.output('firstMatch', matches[0]);
      
    } catch (error) {
      ctx.logger.error(`Regex matching failed: ${error}`);
      throw new Error(`Regex matching failed: ${error}`);
    }
  },
});