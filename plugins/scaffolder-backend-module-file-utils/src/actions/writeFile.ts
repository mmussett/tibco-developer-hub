import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { resolveSafeChildPath } from '@backstage/backend-common';
import fs from 'fs-extra';
import { z } from 'zod';

export const writeFileAction = createTemplateAction<{
  filePath: string;
  content: string;
  encoding?: string;
  workspacePath?: string;
  createDirectories?: boolean;
}>({
  id: 'file:write',
  description: 'Writes content to a file',
  schema: {
    input: z.object({
      filePath: z.string().describe('Path to the file to write'),
      content: z.string().describe('Content to write to the file'),
      encoding: z.string().default('utf8').describe('File encoding (default: utf8)'),
      workspacePath: z.string().optional().describe('Base path to resolve relative paths from'),
      createDirectories: z.boolean().default(true).describe('Create parent directories if they don\'t exist'),
    }),
    output: z.object({
      filePath: z.string().describe('Path to the written file'),
      size: z.number().describe('Size of the written file in bytes'),
    }),
  },
  async handler(ctx) {
    const { 
      filePath, 
      content, 
      encoding = 'utf8', 
      workspacePath,
      createDirectories = true 
    } = ctx.input;
    
    try {
      // Resolve file path safely
      const basePath = workspacePath || ctx.workspacePath;
      const resolvedPath = resolveSafeChildPath(basePath, filePath);
      
      ctx.logger.info(`Writing file: ${resolvedPath}`);
      
      // Create parent directories if needed
      if (createDirectories) {
        await fs.ensureDir(require('path').dirname(resolvedPath));
      }
      
      // Write file content
      await fs.writeFile(resolvedPath, content, { encoding: encoding as BufferEncoding });
      
      // Get file size
      const stats = await fs.stat(resolvedPath);
      
      ctx.logger.info(`Successfully wrote file: ${resolvedPath} (${stats.size} bytes)`);
      
      ctx.output('filePath', resolvedPath);
      ctx.output('size', stats.size);
      
    } catch (error) {
      ctx.logger.error(`Failed to write file: ${error}`);
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  },
});