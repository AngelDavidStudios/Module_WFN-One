import { defineFunction } from '@aws-amplify/backend';

export const vacationManagement = defineFunction({
  name: 'vacationManagement',
  entry: './handler.ts',
});
