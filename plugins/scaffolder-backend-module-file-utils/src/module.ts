import { createBackendModule, coreServices } from "@backstage/backend-plugin-api";
import { scaffolderActionsExtensionPoint  } from '@backstage/plugin-scaffolder-node/alpha';
import { 
  readFileAction, 
  regexMatchAction, 
  readFileAndMatchAction,
  writeFileAction,
  listDirectoriesAction,
  makeDirectoryAction 
} from '@internal/plugin-scaffolder-backend-module-file-utils/src/actions';


/**
 * A backend module that registers the action into the scaffolder
 */

export const scaffolderModule = createBackendModule({
  pluginId: 'scaffolder',
  moduleId: 'file-operations',
  register(env) {
    env.registerInit({
      deps: {
        scaffolder: scaffolderActionsExtensionPoint,
        logger: coreServices.logger,
      },
      async init({ scaffolder, logger }) {
        logger.info('Registering file operations scaffolder actions');
        
        scaffolder.addActions(
          readFileAction,
          regexMatchAction,
          readFileAndMatchAction,
          writeFileAction,
          listDirectoriesAction,
          makeDirectoryAction,
        );
        
        logger.info('File operations actions registered successfully');
      },
    });
  },
});