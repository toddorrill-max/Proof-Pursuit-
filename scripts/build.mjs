import {cp,mkdir,readFile,readdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {validateDataset} from '../lib/data-model.js';
const root=fileURLToPath(new URL('../',import.meta.url)),output=path.join(root,'dist');
for(const mode of ['demo','production']){
 const errors=validateDataset(JSON.parse(await readFile(path.join(root,'data',mode+'.json'))),{mode});
 if(errors.length)throw Error(mode+': '+errors.join('\n'));
}
const files=['index.html','dashboard.html','editorial.html','retailers.html','retailer.html','finding.html','store-picks.html','rare-releases.html','methodology.html','about.html','dashboard.js','dashboard.css','pages.js','pages.css','app.js','styles.css','data.js','config.js','assets/mark.svg','assets/whiskey-hero.webp'];
async function collect(folder){
 for(const entry of await readdir(path.join(root,folder),{withFileTypes:true})){
  const relative=folder+'/'+entry.name;
  if(entry.isSymbolicLink())throw Error('Unexpected symbolic link: '+relative);
  if(entry.isDirectory())await collect(relative);else files.push(relative);
 }
}
for(const folder of ['lib','data','vendor'])await collect(folder);
// Refuse unknown leftovers instead of silently packaging development or secret files.
async function checkOutput(folder=''){
 let entries;try{entries=await readdir(path.join(output,folder),{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
 for(const entry of entries){
  const relative=folder?folder+'/'+entry.name:entry.name;
  if(entry.isSymbolicLink())throw Error('Unexpected output link: '+relative);
  if(entry.isDirectory())await checkOutput(relative);else if(!files.includes(relative))throw Error('Remove unexpected dist file before building: '+relative);
 }
}
await checkOutput();
for(const file of files){await mkdir(path.dirname(path.join(output,file)),{recursive:true});await cp(path.join(root,file),path.join(output,file));}
const bytes=(await Promise.all(files.map(async file=>(await stat(path.join(output,file))).size))).reduce((a,b)=>a+b,0);
console.log('Built '+files.length+' static files ('+bytes+' bytes) in '+output+'. Dataset mode is unchanged; inspect config.js before publishing.');
