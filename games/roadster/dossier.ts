import './dossier.css';
import { specs, sources, unknowns, researchDate } from './specs';
document.querySelector('#date')!.textContent=`Researched ${researchDate}. Pre-production claims can change.`;
const body=document.querySelector('#specs')!;
function render(filter:string){
  body.replaceChildren();
  for(const spec of specs.filter(s=>filter==='All'||(filter==='Unknown'?false:filter==='Historical'?s.status.startsWith('Historical'):filter==='Claims'?s.status==='Manufacturer claim':s.status!=='Manufacturer claim'&&!s.status.startsWith('Historical')))){
    const row=document.createElement('tr');
    for(const text of [spec.label,spec.value,spec.variant]){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}
    const evidence=document.createElement('td');
    if(spec.source){const link=document.createElement('a');link.href=sources[spec.source].url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=spec.status;evidence.append(link);}else evidence.textContent=spec.status;
    row.append(evidence);body.append(row);
  }
}
for(const label of ['All','Claims','Reports','Historical']){
  const button=document.createElement('button');button.textContent=label;button.setAttribute('aria-pressed',String(label==='All'));
  button.onclick=()=>{document.querySelectorAll('#filters button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render(label);};document.querySelector('#filters')!.append(button);
}
for(const text of unknowns){const li=document.createElement('li');li.textContent=text;document.querySelector('#unknowns')!.append(li);}
for(const source of Object.values(sources)){const li=document.createElement('li'),a=document.createElement('a');a.href=source.url;a.textContent=source.title;a.target='_blank';a.rel='noopener noreferrer';li.append(a);document.querySelector('#sources')!.append(li);}
render('All');
