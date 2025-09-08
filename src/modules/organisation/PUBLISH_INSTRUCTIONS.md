# Publishing Instructions for @kahuna-rayn/organisation-management

## Prerequisites
1. Ensure you have NPM access to the `@kahuna-rayn` scope
2. Login to NPM: `npm login`

## Build and Publish Process

### 1. Navigate to the module directory
```bash
cd src/modules/organisation
```

### 2. Install dependencies
```bash
npm install
```

### 3. Build the package
```bash
npm run build
```

### 4. Verify the build
Check that the `dist/` folder contains:
- `index.js` (CommonJS build)
- `index.esm.js` (ES modules build)  
- `index.d.ts` (TypeScript declarations)
- Component files and type definitions

### 5. Test the package locally (optional)
```bash
npm pack
# This creates a .tgz file you can test with
```

### 6. Publish to NPM
```bash
npm publish
```

### 7. Verify publication
Visit: https://www.npmjs.com/package/@kahuna-rayn/organisation-management

## After Publishing
1. Install the package in the main project: `npm install @kahuna-rayn/organisation-management`
2. Update imports in `src/components/SettingsPanel.tsx`
3. Remove the local module directory: `src/modules/organisation/`

## Version Updates
For future updates:
1. Update version in `package.json`
2. Run build and publish process again