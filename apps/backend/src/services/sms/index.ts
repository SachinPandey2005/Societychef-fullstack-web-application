import { env } from '../../config/env';
import { SmsProvider } from './SmsProvider';
import { Msg91Provider } from './Msg91Provider';
import { ConsoleLogProvider } from './ConsoleLogProvider';

let instance: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (instance) return instance;

  if (env.MSG91_AUTH_KEY && env.MSG91_OTP_TEMPLATE_ID) {
    instance = new Msg91Provider(env.MSG91_AUTH_KEY, env.MSG91_OTP_TEMPLATE_ID);
  } else {
    if (env.NODE_ENV === 'production') {
      throw new Error('MSG91_AUTH_KEY and MSG91_OTP_TEMPLATE_ID must be set in production — refusing to fall back to the console-log OTP provider.');
    }
    instance = new ConsoleLogProvider();
  }

  return instance;
}

export type { SmsProvider };
