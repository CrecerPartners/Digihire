const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectName = process.env.VERCEL_PROJECT_NAME || '';
console.log('Vercel Project Name Detected:', projectName);

// Helper to recursively copy directories
function copyFolderSync(from, to) {
  fs.mkdirSync(to, { recursive: true });
  fs.readdirSync(from).forEach(element => {
    const srcPath = path.join(from, element);
    const destPath = path.join(to, element);
    if (fs.lstatSync(srcPath).isDirectory()) {
      copyFolderSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

const dest = path.resolve(__dirname, '../apps/landing/dist');

if (projectName.includes('brands')) {
  console.log('Project matches "brands". Building @digihire/brands...');
  execSync('npm run build:brands', { stdio: 'inherit' });
  
  const src = path.resolve(__dirname, '../apps/brands/dist');
  
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyFolderSync(src, dest);
  console.log('Brands build successfully routed and copied to landing dist.');
} else if (projectName.includes('voltsquad')) {
  console.log('Project matches "voltsquad". Building @digihire/voltsquad...');
  execSync('npm run build:voltsquad', { stdio: 'inherit' });
  
  const src = path.resolve(__dirname, '../apps/voltsquad/dist');
  
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyFolderSync(src, dest);
  console.log('VoltSquad build successfully routed and copied to landing dist.');
} else if (projectName.includes('talentpool') || projectName.includes('talents')) {
  console.log('Project matches "talentpool/talents". Building @digihire/talentpool...');
  execSync('npm run build:talentpool', { stdio: 'inherit' });
  
  const src = path.resolve(__dirname, '../apps/talentpool/dist');
  
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyFolderSync(src, dest);
  console.log('TalentPool build successfully routed and copied to landing dist.');
} else {
  // Default fallback to building landing app
  console.log('No specific project match or default landing. Building @digihire/landing...');
  execSync('npm run build:landing', { stdio: 'inherit' });
}
