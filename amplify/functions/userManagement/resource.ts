import { defineFunction } from '@aws-amplify/backend';

export const userManagement = defineFunction({
  name: 'userManagement',
  entry: './handler.ts',
  environment: {
    // El User Pool ID se inyectará desde backend.ts
  },
});
