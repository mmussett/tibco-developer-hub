import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { resolveSafeChildPath } from '@backstage/backend-common';
import fs from 'fs-extra';
import { z } from 'zod';

export const readFileAction = createTemplateAction<{
  filePath: string;
  encoding?: string;
  workspacePath?: string;
}>({
  id: 'file:read',
  description: 'Reads the contents of a file',
  schema: {
    input: z.object({
      filePath: z.string().describe('Path to the file to read'),
      encoding: z.string().default('utf8').describe('File encoding (default: utf8)'),
      workspacePath: z.string().optional().describe('Base path to resolve relative paths from (defaults to workspace)'),
    }),
    output: z.object({
      content: z.string().describe('File contents'),
      size: z.number().describe('File size in bytes'),
      exists: z.boolean().describe('Whether the file exists'),
    }),
  },
  async handler(ctx) {
    const { filePath, encoding = 'utf8', workspacePath } = ctx.input;
    
    try {
      // Resolve file path safely within workspace or specified base path
      const basePath = workspacePath || ctx.workspacePath;
      const resolvedPath = resolveSafeChildPath(basePath, filePath);
      
      ctx.logger.info(`Reading file: ${resolvedPath}`);
      
      // Check if file exists
      const exists = await fs.pathExists(resolvedPath);
      if (!exists) {
        ctx.logger.warn(`File not found: ${resolvedPath}`);
        ctx.output('content', '');
        ctx.output('size', 0);
        ctx.output('exists', false);
        return;
      }
      
      // Get file stats
      const stats = await fs.stat(resolvedPath);
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${resolvedPath}`);
      }
      
      // Read file content
      const content = await fs.readFile(resolvedPath, { encoding: encoding as BufferEncoding });
      
      ctx.logger.info(`Successfully read file: ${resolvedPath} (${stats.size} bytes)`);
      
      ctx.output('content', content);
      ctx.output('size', stats.size);
      ctx.output('exists', true);
      
    } catch (error) {
      ctx.logger.error(`Failed to read file: ${error}`);
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  },
});