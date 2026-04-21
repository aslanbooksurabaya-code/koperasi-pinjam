const fs = require('fs');
const { execSync } = require('child_process');

const files = execSync('find src/app -name "*.tsx"').toString().split('\n').filter(Boolean);

let changedFiles = 0;
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  const classesToRemove = [
    'bg-slate-50/20',
    'bg-slate-50',
    'border-slate-100',
    'dark:bg-slate-900',
    'dark:border-slate-800',
    'focus-visible:bg-white'
  ];
  
  const original = content;
  
  content = content.replace(/<Input[^>]+className=\"[^\"]+\"[^>]*>/g, (match) => {
    let newMatch = match;
    for (const c of classesToRemove) {
      const regex = new RegExp(`\\b${c.replace('/', '\\/')}\\b`, 'g');
      newMatch = newMatch.replace(regex, '');
    }
    newMatch = newMatch.replace(/className=\"\s+/g, 'className="');
    newMatch = newMatch.replace(/\s+\"/g, '"');
    newMatch = newMatch.replace(/\s{2,}/g, ' ');
    newMatch = newMatch.replace(/className=\"\" ?/g, '');
    return newMatch;
  });
  
  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    changedFiles++;
  }
}
console.log(`Updated ${changedFiles} files`);
