import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { resolveSafeChildPath } from '@backstage/backend-common';
import fs from 'fs-extra';
import { z } from 'zod';

export const readFileAndMatchAction = createTemplateAction<{
  filePath: string;
  pattern: string;
  flags?: string;
  encoding?: string;
  extractGroup?: number;
  workspacePath?: string;
}>({
  id: 'file:readAndMatch',
  description: 'Reads a file and performs regex matching on its contents',
  schema: {
    input: z.object({
      filePath: z.string().describe('Path to the file to read'),
      pattern: z.string().describe('Regular expression pattern'),
      flags: z.string().default('g').describe('Regex flags (default: g for global)'),
      encoding: z.string().default('utf8').describe('File encoding (default: utf8)'),
      extractGroup: z.number().optional().describe('Specific capture group to extract'),
      workspacePath: z.string().optional().describe('Base path to resolve relative paths from'),
    }),
    output: z.object({
      matches: z.array(z.object({
        match: z.string(),
        line: z.number(),
        index: z.number(),
      })).describe('Array of matches with line numbers'),
      matchCount: z.number().describe('Number of matches found'),
      hasMatches: z.boolean().describe('Whether any matches were found'),
      fileSize: z.number().describe('Size of the file in bytes'),
      lineCount: z.number().describe('Total number of lines in the file'),
    }),
  },
  async handler(ctx) {
    const { 
      filePath, 
      pattern, 
      flags = 'g', 
      encoding = 'utf8', 
      extractGroup,
      workspacePath 
    } = ctx.input;
    
    try {
      // Resolve file path safely
      const basePath = workspacePath || ctx.workspacePath;
      const resolvedPath = resolveSafeChildPath(basePath, filePath);
      
      ctx.logger.info(`Reading and matching file: ${resolvedPath}`);
      
      // Check if file exists
      if (!(await fs.pathExists(resolvedPath))) {
        throw new Error(`File not found: ${resolvedPath}`);
      }
      
      const stats = await fs.stat(resolvedPath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolvedPath}`);
      }
      
      // Read file content
      const content = await fs.readFile(resolvedPath, { encoding: encoding as BufferEncoding });
      const lines = content.split('\n');
      
      // Perform regex matching
      const regex = new RegExp(pattern, flags);
      const matches: Array<{ match: string; line: number; index: number }> = [];
      let match;
      
      if (flags.includes('g')) {
        while ((match = regex.exec(content)) !== null) {
          const extractedValue = extractGroup !== undefined 
            ? (match[extractGroup] || match[0])
            : match[0];
          
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          matches.push({
            match: extractedValue,
            line: lineNumber,
            index: match.index,
          });
          
          if (match.index === regex.lastIndex) {
            regex.lastIndex++;
          }
        }
      } else {
        match = regex.exec(content);
        if (match) {
          const extractedValue = extractGroup !== undefined 
            ? (match[extractGroup] || match[0])
            : match[0];
          
          const lineNumber = content.substring(0, match.index).split('\n').length;
          
          matches.push({
            match: extractedValue,
            line: lineNumber,
            index: match.index,
          });
        }
      }
      
      ctx.logger.info(`Found ${matches.length} matches in ${resolvedPath}`);
      
      ctx.output('matches', matches);
      ctx.output('matchCount', matches.length);
      ctx.output('hasMatches', matches.length > 0);
      ctx.output('fileSize', stats.size);
      ctx.output('lineCount', lines.length);
      
    } catch (error) {
      ctx.logger.error(`Failed to read file and match: ${error}`);
      throw new Error(`Failed to read file and match ${filePath}: ${error}`);
    }
  },
});
