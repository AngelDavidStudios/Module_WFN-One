import { defineFunction } from '@aws-amplify/backend';

export const organizationTree = defineFunction({
  name: 'organizationTree',
  entry: './handler.ts',
});
