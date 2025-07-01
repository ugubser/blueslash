import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, '..');
const templatePath = path.join(projectRoot, 'dist', 'sw.js');
const outputPath = path.join(projectRoot, 'dist', 'sw.js');

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

function processMessagingServiceWorker() {
  try {
    // Check if the service worker file exists
    if (!fs.existsSync(templatePath)) {
      console.log('Service worker file not found, skipping Firebase config injection');
      return;
    }
    
    // Load environment variables
    const envVars = loadEnvVariables();
    
    // Read the generated service worker
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Detect build mode from command line arguments or environment
    let buildMode = 'development';
    const modeIndex = process.argv.indexOf('--mode');
    if (modeIndex !== -1 && process.argv[modeIndex + 1]) {
      buildMode = process.argv[modeIndex + 1];
    } else if (process.env.NODE_ENV === 'production') {
      buildMode = 'production';
    }
    
    // Get environment variables (from .env file and process.env)
    const config = {
      VITE_FIREBASE_API_KEY: envVars.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
      VITE_FIREBASE_AUTH_DOMAIN: envVars.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      VITE_FIREBASE_PROJECT_ID: envVars.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
      VITE_FIREBASE_STORAGE_BUCKET: envVars.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: envVars.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      VITE_FIREBASE_APP_ID: envVars.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '',
      BUILD_MODE: buildMode
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
    
    // Write the processed messaging service worker
    fs.writeFileSync(outputPath, processedContent);
    
    console.log('✅ Firebase config injected into service worker successfully');
    console.log(`   Service Worker: ${outputPath}`);
    console.log(`   Build Mode: ${buildMode}`);
    console.log(`   Firebase API Key configured: ${config.VITE_FIREBASE_API_KEY ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Failed to process messaging service worker:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === __filename) {
  processMessagingServiceWorker();
}

export { processMessagingServiceWorker };