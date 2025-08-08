import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import fs from 'fs-extra';
import { z } from 'zod';

export const listDirectoriesAction = createTemplateAction<{
}>({
  id: 'file:listDirectories',
  description: 'Lists directories',
  schema: {
    input: z.object({
    }),
    output: z.object({
      entries: z.array(z.string()).describe('Directory entries'),
    }),
  },
  async handler(ctx) {
    const dirPath  = ctx.workspacePath;
    
    try {
      
      ctx.logger.info(`Reading Directory: ${dirPath}`);
      
      // Check if file exists
      const exists = await fs.pathExists(dirPath);
      if (!exists) {
        ctx.logger.warn(`Directory not found: ${dirPath}`);
        return;
      }
      

      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      // Filter only directories
      const directoryEntries = entries.filter(entry => entry.isDirectory());
      
      // Log each directory entry
      directoryEntries.forEach(entry => {
        ctx.logger.info(`Directory: ${entry.name}`);
      });
      
      const dirs = directoryEntries.map(d => d.name);

      ctx.output('entries', dirs);

      
    } catch (error) {
      ctx.logger.error(`Failed to list directories: ${error}`);
      throw new Error(`Failed to list directories ${dirPath}: ${error}`);
    }
  },
});