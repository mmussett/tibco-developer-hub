import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fs from 'fs-extra';
import { z } from 'zod';
import path from 'path';

export const makeDirectoryAction = createTemplateAction<{
  dirPath: string;
  recursive: boolean;
}>({
  id: 'file:makeDirectory',
  description: 'Make Directory',
  schema: {
    input: z.object({
      dirPath: z.string().describe('Directory path(s) to make'),
    }),
    output: z.object({
      createdPath: z.array(z.string()).describe('Directory entries'),
    }),
  },
  async handler(ctx) {
    const { dirPath } = ctx.input;

    try {
      
      ctx.logger.info(`Making Directory: ${dirPath}`);
      
      // Resolve against the workspace root
      const target = path.resolve(ctx.workspacePath, dirPath);

      // Create the directory
      await fs.mkdirp(target);
      
      ctx.logger.info(`Created directory: ${target}`);

      ctx.output('createdPath', target);


      
    } catch (error) {
      ctx.logger.error(`Failed to list directories: ${error}`);
      throw new Error(`Failed to list directories ${dirPath}: ${error}`);
    }
  },
});