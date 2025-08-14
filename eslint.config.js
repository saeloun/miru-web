// @ts-check
import js from '@eslint/js';
import { fixupConfigRules, fixupPluginRules } from '@eslint/compat';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-plugin-prettier';
import promise from 'eslint-plugin-promise';
import jam3 from 'eslint-plugin-jam3';
import unusedImports from 'eslint-plugin-unused-imports';
import importPlugin from 'eslint-plugin-import';

export default [
  // Base config
  js.configs.recommended,
  
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'public/**',
      'tmp/**',
      'vendor/**',
      'config/**',
      'db/**',
      'log/**',
      'storage/**',
      '.git/**',
      'app/assets/**',
      '**/*.min.js',
      'coverage/**',
      '.eslintrc',
      '.eslintignore'
    ]
  },
  
  // Global config for all files
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        sessionStorage: 'readonly',
        localStorage: 'readonly',
        FileReader: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLUListElement: 'readonly',
        HTMLSpanElement: 'readonly',
        HTMLParagraphElement: 'readonly',
        HTMLHeadingElement: 'readonly',
        Element: 'readonly',
        Node: 'readonly',
        Event: 'readonly',
        FormData: 'readonly',
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        Navigator: 'readonly',
        Location: 'readonly',
        History: 'readonly',
        CustomEvent: 'readonly',
        KeyboardEvent: 'readonly',
        MouseEvent: 'readonly',
        
        // Node globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        console: 'readonly',
        
        // Jest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        
        // Custom globals
        log: 'readonly',
        Promise: 'readonly'
      }
    },
    
    plugins: {
      '@typescript-eslint': fixupPluginRules(typescript),
      'react': fixupPluginRules(react),
      'react-hooks': fixupPluginRules(reactHooks),
      'prettier': fixupPluginRules(prettier),
      'promise': fixupPluginRules(promise),
      'jam3': fixupPluginRules(jam3),
      'unused-imports': fixupPluginRules(unusedImports),
      'import': fixupPluginRules(importPlugin)
    },
    
    settings: {
      react: {
        version: 'detect'
      },
      'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx', '.svg', '.json', '.mp3', '.css']
        }
      }
    },
    
    rules: {
      // TypeScript rules (disabled for quick fix)
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      
      // React rules
      'react/jsx-filename-extension': ['error', { extensions: ['.js', '.jsx', '.ts', '.tsx'] }],
      'react/react-in-jsx-scope': 'off', // Not needed with React 17+
      'react/prop-types': 'off', // Using TypeScript for prop validation
      'react/jsx-newline': 'off',
      'react/hook-use-state': 'off',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'off',
      
      // Prettier
      'prettier/prettier': 'warn',
      
      // General rules
      'no-unused-vars': 'off',
      'no-undef': 'error',
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'curly': ['error', 'multi-line'],
      'no-else-return': 'error',
      'prefer-const': 'error',
      'no-unsafe-optional-chaining': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'prefer-template': 'error',
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'object-shorthand': ['error', 'always', { avoidQuotes: true, ignoreConstructors: true }],
      'prefer-arrow-callback': ['error', { allowUnboundThis: true }],
      'no-duplicate-imports': ['error', { includeExports: true }],
      'no-implicit-coercion': ['error', { allow: ['!!'] }],
      'no-var': 'error',
      'no-nested-ternary': 'off',
      
      // Import rules
      'import/exports-last': 'off',
      'import/order': 'off',
      
      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      
      // Jam3 rules
      'jam3/no-sanitizer-with-danger': [2, {
        wrapperName: ['dompurify', 'sanitizer', 'sanitize']
      }],
      
      // Comma dangle
      'comma-dangle': ['error', {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'always-multiline',
        functions: 'never'
      }],
      
      // Padding lines
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: 'if', next: ['if', 'return'] },
        { blankLine: 'always', prev: '*', next: 'return' },
        {
          blankLine: 'always',
          prev: ['block', 'multiline-block-like', 'function', 'iife', 'multiline-const', 'multiline-expression'],
          next: ['function', 'iife', 'multiline-const', 'multiline-expression']
        }
      ]
    }
  }
];