type Level = 'debug' | 'info' | 'warn' | 'error';

interface Fields {
  [key: string]: unknown;
}

const isDev = Boolean(import.meta.env.DEV);
const debugEnabled = isDev || localStorage.getItem('uptiq:debug') === '1';

function write(level: Level, message: string, fields?: Fields) {
  const ts = new Date().toISOString();
  const payload = { ts, level, message, ...(fields ?? {}) };
  const text = `[uptiq:${level}] ${message}`;

  if (level === 'debug' && !debugEnabled) {
    return;
  }

  if (level === 'error') {
    console.error(text, payload);
    return;
  }
  if (level === 'warn') {
    console.warn(text, payload);
    return;
  }
  if (level === 'info') {
    console.info(text, payload);
    return;
  }
  console.debug(text, payload);
}

export const logger = {
  debug: (message: string, fields?: Fields) => write('debug', message, fields),
  info: (message: string, fields?: Fields) => write('info', message, fields),
  warn: (message: string, fields?: Fields) => write('warn', message, fields),
  error: (message: string, fields?: Fields) => write('error', message, fields),
};
