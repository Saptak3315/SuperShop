import { configApp } from '@adonisjs/eslint-config'

export default configApp({
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
    },
  },
  languageOptions: {
    parserOptions: {
      tsconfigRootDir: import.meta.dirname,
      project: ['./tsconfig.json'],
    },
  },
})
