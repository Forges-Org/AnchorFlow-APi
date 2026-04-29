'use strict';

const config = {
  mongodb: {
    url: process.env.MONGO_URI,
    options: {
      serverSelectionTimeoutMS: 5000,
    },
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
};

module.exports = config;
