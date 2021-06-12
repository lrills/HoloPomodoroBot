import path from 'path';
import Machinat from '@machinat/core';
import Messenger from '@machinat/messenger';
import MessengerAssetsManager from '@machinat/messenger/asset';
import Telegram from '@machinat/telegram';
import Line from '@machinat/line';
import LineAssetsManager from '@machinat/line/asset';
import FileState from '@machinat/local-state/file';
import RedisState from '@machinat/redis-state';
import YAML from 'yaml';
import { Umzug, JSONStorage } from 'umzug';
import commander from 'commander';

const {
  NODE_ENV,
  REDIS_URL,
  MESSENGER_PAGE_ID,
  MESSENGER_ACCESS_TOKEN,
  TELEGRAM_BOT_TOKEN,
  LINE_PROVIDER_ID,
  LINE_BOT_CHANNEL_ID,
  LINE_ACCESS_TOKEN,
} = process.env as Record<string, string>;

const DEV = NODE_ENV !== 'production';

const app = Machinat.createApp({
  modules: [
    DEV
      ? FileState.initModule({
          path: './.state_storage',
        })
      : RedisState.initModule({
          clientOptions: {
            url: REDIS_URL,
          },
        }),
  ],
  platforms: [
    Messenger.initModule({
      pageId: Number(MESSENGER_PAGE_ID),
      accessToken: MESSENGER_ACCESS_TOKEN,
      noServer: true,
    }),

    Telegram.initModule({
      botToken: TELEGRAM_BOT_TOKEN,
      noServer: true,
    }),

    Line.initModule({
      providerId: LINE_PROVIDER_ID,
      channelId: LINE_BOT_CHANNEL_ID,
      accessToken: LINE_ACCESS_TOKEN,
      noServer: true,
    }),
  ],
  services: [
    { provide: FileState.Serializer, withValue: YAML },

    LineAssetsManager,
    MessengerAssetsManager,
  ],
});

const umzug = new Umzug({
  storage: new JSONStorage({ path: path.resolve('./.migrated.json') }),
  logger: console,
  context: { app },
  migrations: {
    glob: path.resolve(__dirname, '../migrations/*.js'),
  },
});

commander
  .usage('[options]')
  .option('--down', 'roll back down')
  .parse(process.argv);

async function migrate() {
  await app.start();

  if (commander.down) {
    await umzug.down();
  } else {
    await umzug.up();
  }

  await app.stop();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
