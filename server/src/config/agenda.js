import Agenda from 'agenda';
import mongoose from 'mongoose';

let agenda;

const initAgenda = () => {
  agenda = new Agenda({
    mongo: mongoose.connection.db,
    collection: 'agendaJobs',
    processEvery: '1 minute',
    maxConcurrency: 20,
    defaultLockLifetime: 10000,
  });

  // Graceful shutdown
  const gracefulShutdown = async () => {
    await agenda.stop();
    process.exit(0);
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);

  return agenda;
};

export { initAgenda, agenda };
