import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, 'src', 'firebase-messaging-sw.template.js');
const outputPath = path.join(projectRoot, 'dist', 'firebase-messaging-sw.js');

// Load environment variables from .env file
function loadEnvVariables() {
  const envPath = path.join(projectRoot, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        envVars[key.trim()] = value;
      }
    });
    
    return envVars;
  }
  return {};
}

function buildServiceWorker() {
  try {
    // Load environment variables
    const envVars = loadEnvVariables();
    
    // Read the template
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Get environment variables (from .env file and process.env)
    const config = {
      VITE_FIREBASE_API_KEY: envVars.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
      VITE_FIREBASE_AUTH_DOMAIN: envVars.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      VITE_FIREBASE_PROJECT_ID: envVars.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
      VITE_FIREBASE_STORAGE_BUCKET: envVars.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      VITE_FIREBASE_APP_ID: envVars.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || ''
    };
    
    // Replace placeholders with actual values
    let processedContent = template;
    Object.entries(config).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Ensure dist directory exists
    const distDir = path.dirname(outputPath);
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Write the processed service worker
    fs.writeFileSync(outputPath, processedContent);
    
    // Copy vite.svg icon to dist for notifications (if it doesn't exist)
    const iconSource = path.join(projectRoot, 'src', 'assets', 'vite.svg');
    const iconDest = path.join(projectRoot, 'dist', 'vite.svg');
    
    if (fs.existsSync(iconSource) && !fs.existsSync(iconDest)) {
      fs.copyFileSync(iconSource, iconDest);
      console.log('✅ Copied notification icon to dist');
    }
    
    console.log('✅ Firebase messaging service worker built successfully');
    console.log(`   Template: ${templatePath}`);
    console.log(`   Output: ${outputPath}`);
    console.log(`   Config injected: ${Object.keys(config).length} variables`);
    
    // Verify essential config is present
    const missingConfig = Object.entries(config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);
    
    if (missingConfig.length > 0) {
      console.warn('⚠️  Missing environment variables:', missingConfig.join(', '));
    }
    
  } catch (error) {
    console.error('❌ Failed to build service worker:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  buildServiceWorker();
}

export { buildServiceWorker };